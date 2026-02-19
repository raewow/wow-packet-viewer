//! Shared-memory ring buffer for relaying packet data from the injected DLL
//! (writer) to the 64-bit host application (reader).
//!
//! Layout:
//! ```text
//! [ PacketRingHeader (24 bytes) ][ data ring buffer (RING_CAPACITY bytes) ]
//! ```
//!
//! The DLL writes `PacketEntry` records into the ring. The host reads them.
//! `write_pos` / `read_pos` are byte offsets into the data area and are
//! updated with volatile stores/loads to ensure visibility across processes.

use std::ffi::c_void;
use std::ptr;
use std::sync::atomic::{AtomicPtr, Ordering};

use windows::core::PCWSTR;
use windows::Win32::Foundation::{CloseHandle, HANDLE, INVALID_HANDLE_VALUE};
use windows::Win32::System::Memory::{
    CreateFileMappingW, MapViewOfFile, UnmapViewOfFile, FILE_MAP_ALL_ACCESS,
    MEMORY_MAPPED_VIEW_ADDRESS, PAGE_READWRITE,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Magic value written into the header so the host can verify the mapping.
pub const RING_MAGIC: u32 = 0x57535059; // "WSPY"

/// Size of the data ring area (4 MiB).
const RING_CAPACITY: u32 = 4 * 1024 * 1024;

/// Total shared memory size (header + ring data).
const TOTAL_SIZE: usize = std::mem::size_of::<PacketRingHeader>() + RING_CAPACITY as usize;

// ---------------------------------------------------------------------------
// Shared-memory structures
// ---------------------------------------------------------------------------

/// Header at the start of the shared memory region.
#[repr(C)]
pub struct PacketRingHeader {
    /// Magic value (`RING_MAGIC`). Lets the host verify the mapping.
    pub magic: u32,
    /// Write cursor (byte offset into the data area). Updated by the DLL.
    pub write_pos: u32,
    /// Read cursor (byte offset into the data area). Updated by the host.
    pub read_pos: u32,
    /// Size of the data area in bytes (always `RING_CAPACITY`).
    pub capacity: u32,
    /// Set to 1 once hooks are installed and the DLL is ready.
    pub dll_ready: u32,
    /// The detected WoW build number.
    pub build_number: u32,
}

/// Per-packet record written into the ring buffer.
#[repr(C)]
pub struct PacketEntry {
    /// Total size of this entry in bytes (header fields + payload, aligned).
    pub total_size: u32,
    /// `timeGetTime()` timestamp.
    pub timestamp: u32,
    /// 0 = server-to-client (SMSG), 1 = client-to-server (CMSG).
    pub direction: u8,
    pub _pad: [u8; 3],
    /// The packet opcode.
    pub opcode: u32,
    /// Length of the payload bytes that follow this header.
    pub data_len: u32,
    // Followed by `data_len` bytes of packet payload.
}

/// Size of the `PacketEntry` header (not counting the variable-length payload).
const ENTRY_HEADER_SIZE: usize = std::mem::size_of::<PacketEntry>();

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

/// Pointer to the mapped view (beginning of `PacketRingHeader`).
static MAPPED_VIEW: AtomicPtr<u8> = AtomicPtr::new(ptr::null_mut());

/// Handle to the file mapping object so we can close it on cleanup.
static MAP_HANDLE: AtomicPtr<c_void> = AtomicPtr::new(ptr::null_mut());

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Creates (or opens) the named shared memory region `Local\WowCapture_{pid}`
/// and maps it into our address space.  Returns `true` on success.
///
/// Uses `Local\` (session namespace) rather than `Global\` because the
/// latter requires `SeCreateGlobalPrivilege` which non-elevated processes
/// typically don't have.
pub fn init_shared_memory(pid: u32, build_number: u32) -> bool {
    unsafe {
        let name = format!("Local\\WowCapture_{pid}");
        let name_wide: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();

        let handle: HANDLE = match CreateFileMappingW(
            INVALID_HANDLE_VALUE, // backed by the system pagefile
            None,                 // default security
            PAGE_READWRITE,
            0,                    // high dword of max size
            TOTAL_SIZE as u32,    // low dword of max size
            PCWSTR(name_wide.as_ptr()),
        ) {
            Ok(h) => h,
            Err(_) => return false,
        };

        if handle.is_invalid() || handle.0.is_null() {
            return false;
        }

        let view = MapViewOfFile(handle, FILE_MAP_ALL_ACCESS, 0, 0, TOTAL_SIZE);
        let base = view.Value;
        if base.is_null() {
            let _ = CloseHandle(handle);
            return false;
        }

        // Zero the entire region.
        ptr::write_bytes(base as *mut u8, 0u8, TOTAL_SIZE);

        // Initialize the header.
        let header = &mut *(base as *mut PacketRingHeader);
        ptr::write_volatile(&mut header.magic, RING_MAGIC);
        ptr::write_volatile(&mut header.write_pos, 0);
        ptr::write_volatile(&mut header.read_pos, 0);
        ptr::write_volatile(&mut header.capacity, RING_CAPACITY);
        ptr::write_volatile(&mut header.dll_ready, 0);
        ptr::write_volatile(&mut header.build_number, build_number);

        MAPPED_VIEW.store(base as *mut u8, Ordering::Release);
        MAP_HANDLE.store(handle.0, Ordering::Release);

        true
    }
}

/// Mark the DLL as ready (hooks installed).
pub fn set_dll_ready() {
    unsafe {
        let base = MAPPED_VIEW.load(Ordering::Acquire);
        if base.is_null() {
            return;
        }
        let header = &mut *(base as *mut PacketRingHeader);
        ptr::write_volatile(&mut header.dll_ready, 1);
    }
}

/// Write a packet entry into the ring buffer.
///
/// * `direction` -- 0 = SMSG (server-to-client), 1 = CMSG (client-to-server).
/// * `opcode`    -- the packet opcode.
/// * `data`      -- raw payload bytes (excluding the opcode itself).
///
/// If the ring buffer is full (the write cursor would overtake the read cursor)
/// the packet is silently dropped.
pub fn write_packet(direction: u8, opcode: u32, data: &[u8]) {
    unsafe {
        let base = MAPPED_VIEW.load(Ordering::Acquire);
        if base.is_null() {
            return;
        }

        let header = &mut *(base as *mut PacketRingHeader);
        let capacity = ptr::read_volatile(&header.capacity) as usize;
        let data_base = base.add(std::mem::size_of::<PacketRingHeader>());

        let entry_total = ENTRY_HEADER_SIZE + data.len();
        // Align entry_total up to 4 bytes so the next entry starts aligned.
        let entry_total_aligned = (entry_total + 3) & !3;

        if entry_total_aligned > capacity {
            // Single entry larger than the entire ring -- drop it.
            return;
        }

        let write_pos = ptr::read_volatile(&header.write_pos) as usize;
        let read_pos = ptr::read_volatile(&header.read_pos) as usize;

        // Compute available space.  The ring is "full" when write would reach
        // read (we never let write_pos == read_pos when data is present; that
        // state means "empty").
        let available = if write_pos >= read_pos {
            capacity - (write_pos - read_pos) - 1
        } else {
            read_pos - write_pos - 1
        };

        if entry_total_aligned > available {
            // Not enough room -- drop the packet.
            return;
        }

        // Get a rough timestamp.
        let timestamp = time_get_time();

        // Build the entry header.
        let entry = PacketEntry {
            total_size: entry_total_aligned as u32,
            timestamp,
            direction,
            _pad: [0; 3],
            opcode,
            data_len: data.len() as u32,
        };

        // Write the entry header + payload into the ring, handling wrap-around.
        let entry_bytes = std::slice::from_raw_parts(
            &entry as *const PacketEntry as *const u8,
            ENTRY_HEADER_SIZE,
        );

        ring_write(data_base, capacity, write_pos, entry_bytes);
        ring_write(
            data_base,
            capacity,
            (write_pos + ENTRY_HEADER_SIZE) % capacity,
            data,
        );

        // Advance write_pos.
        let new_write_pos = (write_pos + entry_total_aligned) % capacity;
        ptr::write_volatile(&mut header.write_pos, new_write_pos as u32);
    }
}

/// Unmap the shared memory and close the file mapping handle.
pub fn cleanup() {
    unsafe {
        let base = MAPPED_VIEW.swap(ptr::null_mut(), Ordering::AcqRel);
        if !base.is_null() {
            let _ = UnmapViewOfFile(MEMORY_MAPPED_VIEW_ADDRESS {
                Value: base as *mut c_void,
            });
        }

        let handle = MAP_HANDLE.swap(ptr::null_mut(), Ordering::AcqRel);
        if !handle.is_null() {
            let _ = CloseHandle(HANDLE(handle));
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Copy `src` into the ring buffer at `offset`, wrapping around at `capacity`.
unsafe fn ring_write(ring_base: *mut u8, capacity: usize, offset: usize, src: &[u8]) {
    let mut dst_off = offset;
    for &byte in src {
        *ring_base.add(dst_off) = byte;
        dst_off += 1;
        if dst_off >= capacity {
            dst_off = 0;
        }
    }
}

/// Returns a millisecond timestamp from `timeGetTime()` (winmm.dll).
/// Falls back to `GetTickCount` if winmm cannot be loaded.
unsafe fn time_get_time() -> u32 {
    use windows::Win32::System::LibraryLoader::{GetProcAddress, LoadLibraryW};
    use windows::core::w;

    // Cache the resolved function pointer in a static.  This is only ever
    // called from the WoW main thread (during packet processing), so the
    // lack of synchronisation on these statics is acceptable.
    static mut FN_PTR: Option<unsafe extern "system" fn() -> u32> = None;
    static mut RESOLVED: bool = false;

    if !RESOLVED {
        RESOLVED = true;
        if let Ok(h) = LoadLibraryW(w!("winmm.dll")) {
            if let Some(p) = GetProcAddress(h, windows::core::s!("timeGetTime")) {
                FN_PTR = Some(std::mem::transmute(p));
            }
        }
    }

    match FN_PTR {
        Some(f) => f(),
        None => {
            // Fallback: GetTickCount (kernel32, always available).
            windows::Win32::System::SystemInformation::GetTickCount()
        }
    }
}
