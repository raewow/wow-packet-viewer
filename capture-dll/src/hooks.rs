//! Manual inline-detour hooking for WoW's packet send/receive functions.
//!
//! Instead of using the `retour` crate (which needs libudis86 and a C compiler),
//! we implement simple 5-byte JMP hooks manually.  This is safe because:
//!
//! 1. We know the exact target addresses from hardcoded offset tables.
//! 2. The first instructions at each hook point are known to be >= 5 bytes
//!    for all supported WoW builds (verified from disassembly).
//! 3. We create a trampoline in executable memory that contains the
//!    overwritten bytes followed by a JMP back.
//!
//! # WoW CDataStore layout (32-bit, 1.12.1)
//!
//! ```text
//! offset 0x00: vftable pointer
//! offset 0x04: m_buffer (u8*)  -- data pointer
//! offset 0x08: m_base (u32)    -- base offset (usually 0)
//! offset 0x0C: m_alloc (u32)   -- allocated capacity
//! offset 0x10: m_size (u32)    -- current data size / write cursor
//! offset 0x14: m_read (u32)    -- read cursor position
//! ```
//!
//! # Calling convention
//!
//! WoW 32-bit uses `__thiscall`: `this` in ECX, remaining args on stack
//! (callee-cleans like stdcall).  Our hook functions use `extern "thiscall"`
//! which matches this ABI exactly (stable since Rust 1.73).

use std::sync::atomic::{AtomicBool, Ordering};

use crate::ipc;
use crate::version::WowOffsets;
use crate::file_log;

use windows::Win32::System::Diagnostics::Debug::FlushInstructionCache;
use windows::Win32::System::Memory::{
    VirtualAlloc, VirtualFree, VirtualProtect, MEM_COMMIT, MEM_RELEASE, MEM_RESERVE,
    PAGE_EXECUTE_READWRITE, PAGE_PROTECTION_FLAGS,
};
use windows::Win32::System::Threading::GetCurrentProcess;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Maximum number of prologue bytes we might need to save.
const MAX_HOOK_SIZE: usize = 16;

/// Size of each trampoline allocation (overkill, but one page is fine).
const TRAMPOLINE_SIZE: usize = 64;

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

static HOOKS_INSTALLED: AtomicBool = AtomicBool::new(false);

static mut SEND_ORIG_BYTES: [u8; MAX_HOOK_SIZE] = [0; MAX_HOOK_SIZE];
static mut RECV_ORIG_BYTES: [u8; MAX_HOOK_SIZE] = [0; MAX_HOOK_SIZE];

static mut SEND_HOOK_SIZE: usize = 0;
static mut RECV_HOOK_SIZE: usize = 0;

/// Executable memory containing original bytes + JMP back.
static mut SEND_TRAMPOLINE: *mut u8 = std::ptr::null_mut();
static mut RECV_TRAMPOLINE: *mut u8 = std::ptr::null_mut();

static mut SEND_TARGET: *mut u8 = std::ptr::null_mut();
static mut RECV_TARGET: *mut u8 = std::ptr::null_mut();

// ---------------------------------------------------------------------------
// CDataStore helpers
// ---------------------------------------------------------------------------

/// Read the data pointer from a CDataStore (offset 0x04).
#[inline]
unsafe fn cds_data(cds: usize) -> *const u8 {
    *((cds + 0x04) as *const *const u8)
}

/// Read the current size from a CDataStore (offset 0x10).
#[inline]
unsafe fn cds_size(cds: usize) -> usize {
    *((cds + 0x10) as *const u32) as usize
}

// ---------------------------------------------------------------------------
// Hook handlers
// ---------------------------------------------------------------------------

/// Replacement for WoW's NetClient::Send2.
///
/// Real signature: `DWORD __thiscall Send2(this, CDataStore* pkt, void* param2)`
/// Two stack parameters + return value.  Getting the param count wrong
/// causes `ret 4` instead of `ret 8`, corrupting the caller's stack.
unsafe extern "thiscall" fn send_hook(this: usize, data_store: usize, param2: usize) -> u32 {
    // Capture packet data BEFORE calling original (CDataStore is definitely
    // valid here; it may be freed by the caller after Send2 returns).
    if data_store > 0x10000 {
        let data_ptr = cds_data(data_store);
        let data_size = cds_size(data_store);

        if !data_ptr.is_null()
            && (data_ptr as usize) > 0x10000
            && data_size >= 4
            && data_size < 0x10_0000
        {
            let opcode = *(data_ptr as *const u32);
            let payload = if data_size > 4 {
                std::slice::from_raw_parts(data_ptr.add(4), data_size - 4)
            } else {
                &[]
            };
            ipc::write_packet(1, opcode, payload); // 1 = CMSG
        }
    }

    // Call the original function via trampoline.
    type OrigSendFn = unsafe extern "thiscall" fn(usize, usize, usize) -> u32;
    let original: OrigSendFn = std::mem::transmute(SEND_TRAMPOLINE);
    original(this, data_store, param2)
}

/// Replacement for WoW's NetClient::ProcessMessage.
///
/// Vanilla/TBC signature (build <= 8606):
///   `DWORD __thiscall ProcessMessage(this, void* param1, CDataStore* pkt)`
/// Two stack parameters + return value.  CDataStore is the SECOND param.
/// Opcode is the first 2 bytes of the CDataStore buffer (vanilla).
unsafe extern "thiscall" fn recv_hook(
    this: usize,
    param1: usize,
    data_store: usize,
) -> u32 {
    // Capture incoming packet data.
    if data_store > 0x10000 {
        let data_ptr = cds_data(data_store);
        let data_size = cds_size(data_store);

        if !data_ptr.is_null()
            && (data_ptr as usize) > 0x10000
            && data_size >= 2
            && data_size < 0x10_0000
        {
            // Vanilla: opcode is 2 bytes at start of buffer
            let opcode = *(data_ptr as *const u16) as u32;
            let payload = if data_size > 2 {
                std::slice::from_raw_parts(data_ptr.add(2), data_size - 2)
            } else {
                &[]
            };
            ipc::write_packet(0, opcode, payload); // 0 = SMSG
        }
    }

    // Call original
    type OrigRecvFn = unsafe extern "thiscall" fn(usize, usize, usize) -> u32;
    let original: OrigRecvFn = std::mem::transmute(RECV_TRAMPOLINE);
    original(this, param1, data_store)
}

// ---------------------------------------------------------------------------
// Inline hook plumbing
// ---------------------------------------------------------------------------

/// Allocate a trampoline: copy `hook_size` original bytes, then append a
/// JMP rel32 back to `target + hook_size`.
///
/// `hook_size` MUST be >= 5 and aligned to an instruction boundary.
unsafe fn create_trampoline(target: *const u8, hook_size: usize) -> *mut u8 {
    let trampoline = VirtualAlloc(
        None,
        TRAMPOLINE_SIZE,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_EXECUTE_READWRITE,
    ) as *mut u8;

    if trampoline.is_null() {
        return std::ptr::null_mut();
    }

    // Copy original bytes (exactly hook_size, which is on an instruction boundary)
    std::ptr::copy_nonoverlapping(target, trampoline, hook_size);

    // Write JMP rel32 back to (target + hook_size)
    let jmp_src = trampoline.add(hook_size); // address of the JMP instruction
    let jmp_dst = target.add(hook_size); // where to jump
    *jmp_src = 0xE9; // JMP rel32 opcode
    let rel = (jmp_dst as isize) - (jmp_src.add(5) as isize);
    std::ptr::copy_nonoverlapping(&rel as *const isize as *const u8, jmp_src.add(1), 4);

    trampoline
}

/// Overwrite the first `hook_size` bytes of `target` with a JMP to `detour`.
/// Remaining bytes (after the 5-byte JMP) are filled with NOPs.
unsafe fn write_jmp(target: *mut u8, detour: *const u8, hook_size: usize) -> bool {
    // Make writable
    let mut old_protect = PAGE_PROTECTION_FLAGS(0);
    if VirtualProtect(target as _, hook_size, PAGE_EXECUTE_READWRITE, &mut old_protect).is_err() {
        return false;
    }

    // Write JMP rel32 (5 bytes)
    *target = 0xE9;
    let rel = (detour as isize) - (target.add(5) as isize);
    std::ptr::copy_nonoverlapping(&rel as *const isize as *const u8, target.add(1), 4);

    // NOP any remaining bytes so we don't leave partial instructions
    for i in 5..hook_size {
        *target.add(i) = 0x90; // NOP
    }

    // Restore protection
    let mut dummy = PAGE_PROTECTION_FLAGS(0);
    let _ = VirtualProtect(target as _, hook_size, old_protect, &mut dummy);

    // Flush instruction cache
    let _ = FlushInstructionCache(GetCurrentProcess(), Some(target as *const _ as _), hook_size);

    true
}

/// Restore original bytes at `target`.
unsafe fn restore_bytes(target: *mut u8, original: &[u8], size: usize) {
    let mut old_protect = PAGE_PROTECTION_FLAGS(0);
    if VirtualProtect(target as _, size, PAGE_EXECUTE_READWRITE, &mut old_protect).is_ok() {
        std::ptr::copy_nonoverlapping(original.as_ptr(), target, size);
        let mut dummy = PAGE_PROTECTION_FLAGS(0);
        let _ = VirtualProtect(target as _, size, old_protect, &mut dummy);
        let _ =
            FlushInstructionCache(GetCurrentProcess(), Some(target as *const _ as _), size);
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Install inline JMP hooks on send and receive packet functions.
pub unsafe fn install_hooks(offsets: &WowOffsets) -> bool {
    if HOOKS_INSTALLED.load(Ordering::Acquire) {
        return true;
    }

    let send_size = offsets.send_hook_size;
    let recv_size = offsets.recv_hook_size;

    assert!(send_size >= 5 && send_size <= MAX_HOOK_SIZE);
    assert!(recv_size >= 5 && recv_size <= MAX_HOOK_SIZE);

    // Log the target addresses and their first bytes for debugging.
    {
        let send_addr = offsets.send_packet;
        let recv_addr = offsets.recv_handler;
        let mut send_bytes = [0u8; 16];
        let mut recv_bytes = [0u8; 16];
        std::ptr::copy_nonoverlapping(send_addr as *const u8, send_bytes.as_mut_ptr(), 16);
        std::ptr::copy_nonoverlapping(recv_addr as *const u8, recv_bytes.as_mut_ptr(), 16);
        file_log(&format!(
            "capture-dll: send_target=0x{:08X} hook_size={} bytes={:02X?}",
            send_addr, send_size, send_bytes
        ));
        file_log(&format!(
            "capture-dll: recv_target=0x{:08X} hook_size={} bytes={:02X?}",
            recv_addr, recv_size, recv_bytes
        ));
        file_log(&format!(
            "capture-dll: send_hook fn=0x{:08X} recv_hook fn=0x{:08X}",
            send_hook as usize, recv_hook as usize
        ));
    }

    // -- Send hook --
    let send_target = offsets.send_packet as *mut u8;
    SEND_TARGET = send_target;
    SEND_HOOK_SIZE = send_size;

    // Save original bytes
    std::ptr::copy_nonoverlapping(send_target, SEND_ORIG_BYTES.as_mut_ptr(), send_size);

    // Create trampoline
    SEND_TRAMPOLINE = create_trampoline(send_target, send_size);
    if SEND_TRAMPOLINE.is_null() {
        file_log("capture-dll: failed to allocate send trampoline");
        return false;
    }

    // Patch target
    if !write_jmp(send_target, send_hook as *const u8, send_size) {
        file_log("capture-dll: failed to write send JMP");
        return false;
    }

    // Verify the JMP was written
    {
        let mut verify = [0u8; 8];
        std::ptr::copy_nonoverlapping(send_target as *const u8, verify.as_mut_ptr(), 8);
        file_log(&format!(
            "capture-dll: send AFTER patch bytes={:02X?} (expect E9 at [0])",
            verify
        ));
    }

    // -- Recv hook --
    // Address 0x137AA0 = NetClient::ProcessMessage.
    // Vanilla signature: DWORD __thiscall(this, param1, CDataStore*)
    let recv_target = offsets.recv_handler as *mut u8;
    RECV_TARGET = recv_target;
    RECV_HOOK_SIZE = recv_size;

    std::ptr::copy_nonoverlapping(recv_target, RECV_ORIG_BYTES.as_mut_ptr(), recv_size);

    RECV_TRAMPOLINE = create_trampoline(recv_target, recv_size);
    if RECV_TRAMPOLINE.is_null() {
        file_log("capture-dll: failed to allocate recv trampoline");
        restore_bytes(send_target, &SEND_ORIG_BYTES, send_size);
        return false;
    }

    if !write_jmp(recv_target, recv_hook as *const u8, recv_size) {
        file_log("capture-dll: failed to write recv JMP");
        restore_bytes(send_target, &SEND_ORIG_BYTES, send_size);
        return false;
    }

    // Verify the JMP was written
    {
        let mut verify = [0u8; 8];
        std::ptr::copy_nonoverlapping(recv_target as *const u8, verify.as_mut_ptr(), 8);
        file_log(&format!(
            "capture-dll: recv AFTER patch bytes={:02X?} (expect E9 at [0])",
            verify
        ));
    }

    HOOKS_INSTALLED.store(true, Ordering::Release);
    true
}

/// Remove hooks and restore original function bytes.
pub unsafe fn uninstall_hooks() {
    if !HOOKS_INSTALLED.load(Ordering::Acquire) {
        return;
    }

    // Restore original bytes
    if !RECV_TARGET.is_null() {
        restore_bytes(RECV_TARGET, &RECV_ORIG_BYTES, RECV_HOOK_SIZE);
    }
    if !SEND_TARGET.is_null() {
        restore_bytes(SEND_TARGET, &SEND_ORIG_BYTES, SEND_HOOK_SIZE);
    }

    // Free trampolines
    if !RECV_TRAMPOLINE.is_null() {
        let _ = VirtualFree(RECV_TRAMPOLINE as _, 0, MEM_RELEASE);
        RECV_TRAMPOLINE = std::ptr::null_mut();
    }
    if !SEND_TRAMPOLINE.is_null() {
        let _ = VirtualFree(SEND_TRAMPOLINE as _, 0, MEM_RELEASE);
        SEND_TRAMPOLINE = std::ptr::null_mut();
    }

    SEND_TARGET = std::ptr::null_mut();
    RECV_TARGET = std::ptr::null_mut();
    HOOKS_INSTALLED.store(false, Ordering::Release);
}

/// Returns `true` when hooks are currently active.
pub fn hooks_active() -> bool {
    HOOKS_INSTALLED.load(Ordering::Acquire)
}
