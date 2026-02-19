//! WoW build detection and hardcoded offset tables.
//!
//! Detects the WoW.exe build number from the file version info and returns
//! the corresponding function/data offsets needed for packet hooking.

use std::ffi::c_void;
use windows::core::{PCWSTR, w};
use windows::Win32::Foundation::HMODULE;
use windows::Win32::System::LibraryLoader::{
    GetModuleFileNameW, GetModuleHandleW,
};

/// Offsets into the WoW.exe address space (absolute addresses after adding base).
#[derive(Debug, Clone, Copy)]
pub struct WowOffsets {
    /// Connection object / opcode handler table.
    pub opcode_table: usize,
    /// Opcode name lookup (0 if not available for this build).
    pub opcode_names: usize,
    /// Address of the packet-send function (we hook this).
    pub send_packet: usize,
    /// Address of the packet-receive handler (we hook this).
    pub recv_handler: usize,
    /// Total opcode count for this build.
    pub num_opcodes: u32,
    /// Minimum bytes to overwrite for the send hook (must be on instruction boundary).
    pub send_hook_size: usize,
    /// Minimum bytes to overwrite for the recv hook (must be on instruction boundary).
    pub recv_hook_size: usize,
}

/// Detects the WoW build number and returns `(build, offsets)` if recognized.
///
/// Detection works by:
/// 1. Getting the WoW.exe module base via `GetModuleHandleW(NULL)`.
/// 2. Getting the exe path via `GetModuleFileNameW`.
/// 3. Reading the file version via `GetFileVersionInfoW` / `VerQueryValueW`
///    to extract `VS_FIXEDFILEINFO.dwFileVersionLS`. The build number is in
///    the low word.
/// 4. Looking up the build in a hardcoded table of known offsets.
pub fn detect_build() -> Option<(u32, WowOffsets)> {
    unsafe {
        // Get the main module (NULL = the exe itself).
        let hmodule = GetModuleHandleW(PCWSTR::null()).ok()?;
        let base = hmodule.0 as usize;

        // Get the full path to WoW.exe.
        let mut path_buf = [0u16; 1024];
        let len = GetModuleFileNameW(hmodule, &mut path_buf);
        if len == 0 || len as usize >= path_buf.len() {
            return None;
        }

        let build = get_build_from_file(&path_buf[..len as usize])?;
        let offsets = offsets_for_build(build, base)?;

        Some((build, offsets))
    }
}

/// VS_FIXEDFILEINFO layout (we define it here to avoid needing the
/// Storage_FileSystem feature in the DLL crate).
#[repr(C)]
#[allow(non_snake_case)]
struct VsFixedFileInfo {
    dwSignature: u32,
    dwStrucVersion: u32,
    dwFileVersionMS: u32,
    dwFileVersionLS: u32,
    dwProductVersionMS: u32,
    dwProductVersionLS: u32,
    dwFileFlagsMask: u32,
    dwFileFlags: u32,
    dwFileOS: u32,
    dwFileType: u32,
    dwFileSubtype: u32,
    dwFileDateMS: u32,
    dwFileDateLS: u32,
}

/// Extracts the build number from a file's version info.
///
/// The build number lives in the low word of `VS_FIXEDFILEINFO.dwFileVersionLS`.
unsafe fn get_build_from_file(path: &[u16]) -> Option<u32> {
    use windows::Win32::System::LibraryLoader::{GetProcAddress, LoadLibraryW};

    let version_dll = LoadLibraryW(w!("version.dll")).ok()?;

    type GetFileVersionInfoSizeWFn =
        unsafe extern "system" fn(lptstr_filename: *const u16, lpdw_handle: *mut u32) -> u32;
    type GetFileVersionInfoWFn = unsafe extern "system" fn(
        lptstr_filename: *const u16,
        dw_handle: u32,
        dw_len: u32,
        lp_data: *mut c_void,
    ) -> i32;
    type VerQueryValueWFn = unsafe extern "system" fn(
        p_block: *const c_void,
        lp_sub_block: *const u16,
        lplp_buffer: *mut *const c_void,
        pu_len: *mut u32,
    ) -> i32;

    let p_get_size =
        GetProcAddress(version_dll, windows::core::s!("GetFileVersionInfoSizeW"))?;
    let p_get_info =
        GetProcAddress(version_dll, windows::core::s!("GetFileVersionInfoW"))?;
    let p_query =
        GetProcAddress(version_dll, windows::core::s!("VerQueryValueW"))?;

    let fn_get_size: GetFileVersionInfoSizeWFn = std::mem::transmute(p_get_size);
    let fn_get_info: GetFileVersionInfoWFn = std::mem::transmute(p_get_info);
    let fn_query: VerQueryValueWFn = std::mem::transmute(p_query);

    let mut path_z: Vec<u16> = path.to_vec();
    path_z.push(0);

    let mut dummy: u32 = 0;
    let size = fn_get_size(path_z.as_ptr(), &mut dummy);
    if size == 0 {
        return None;
    }

    let mut buffer: Vec<u8> = vec![0u8; size as usize];
    let ok = fn_get_info(
        path_z.as_ptr(),
        0,
        size,
        buffer.as_mut_ptr() as *mut c_void,
    );
    if ok == 0 {
        return None;
    }

    let sub_block: &[u16] = &[b'\\' as u16, 0];
    let mut info_ptr: *const c_void = std::ptr::null();
    let mut info_len: u32 = 0;
    let ok = fn_query(
        buffer.as_ptr() as *const c_void,
        sub_block.as_ptr(),
        &mut info_ptr,
        &mut info_len,
    );
    if ok == 0
        || info_ptr.is_null()
        || (info_len as usize) < std::mem::size_of::<VsFixedFileInfo>()
    {
        return None;
    }

    let info = &*(info_ptr as *const VsFixedFileInfo);
    let build = (info.dwFileVersionLS & 0xFFFF) as u32;

    Some(build)
}

/// Returns the known offsets for a given build number.
/// All addresses are absolute (base + relative offset).
fn offsets_for_build(build: u32, base: usize) -> Option<WowOffsets> {
    match build {
        // 1.12.1 Vanilla
        5875 => Some(WowOffsets {
            opcode_table: base + 0x00C27E00,
            opcode_names: 0, // not available in vanilla
            send_packet: base + 0x001B5630,
            recv_handler: base + 0x00137AA0,
            num_opcodes: 0x1DD, // 477
            send_hook_size: 6, // push ebp; mov ebp, esp; sub esp, 0x14
            recv_hook_size: 9, // push ebp; mov ebp,esp; mov edx,[imm32] = 9 bytes
        }),

        // 2.4.3 TBC
        8606 => Some(WowOffsets {
            opcode_table: base + 0x00A03F80,
            opcode_names: 0, // not available
            send_packet: base + 0x00246530,
            recv_handler: base + 0x002455A0,
            num_opcodes: 0x3FF, // 1023
            send_hook_size: 6,
            recv_hook_size: 6,
        }),

        // 3.3.5a WotLK
        12340 => Some(WowOffsets {
            opcode_table: base + 0x00879CF4,
            opcode_names: base + 0x005E0E24,
            send_packet: base + 0x003653B0,
            recv_handler: base + 0x0036DC80,
            num_opcodes: 0x4FF, // 1279
            send_hook_size: 6,
            recv_hook_size: 6,
        }),

        // 4.3.4 Cata
        15595 => Some(WowOffsets {
            opcode_table: base + 0x009BE5A0,
            opcode_names: base + 0x009BE5A4,
            send_packet: base + 0x00405F70,
            recv_handler: base + 0x004098C0,
            num_opcodes: 0x7FF, // 2047
            send_hook_size: 6,
            recv_hook_size: 6,
        }),

        _ => None,
    }
}

/// Returns the module base address of WoW.exe (or `None` on failure).
pub fn get_base_address() -> Option<usize> {
    unsafe {
        let h = GetModuleHandleW(PCWSTR::null()).ok()?;
        Some(h.0 as usize)
    }
}
