use std::ffi::c_void;
use std::path::Path;
use windows::core::{s, w};
use windows::Win32::Foundation::{CloseHandle, HANDLE, LUID, BOOL};
use windows::Win32::Security::{
    AdjustTokenPrivileges, LookupPrivilegeValueW, SE_PRIVILEGE_ENABLED, TOKEN_ADJUST_PRIVILEGES,
    TOKEN_PRIVILEGES, TOKEN_QUERY,
};
use windows::Win32::System::Diagnostics::Debug::{ReadProcessMemory, WriteProcessMemory};
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Module32FirstW, Module32NextW, MODULEENTRY32W, TH32CS_SNAPMODULE,
    TH32CS_SNAPMODULE32,
};
use windows::Win32::System::LibraryLoader::{GetModuleHandleW, GetProcAddress};
use windows::Win32::System::Memory::{
    MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_READWRITE, VirtualAllocEx, VirtualFreeEx,
};
use windows::Win32::System::Threading::{
    CreateRemoteThread, GetCurrentProcess, GetExitCodeThread, IsWow64Process, OpenProcess,
    OpenProcessToken, WaitForSingleObject, PROCESS_CREATE_THREAD, PROCESS_QUERY_INFORMATION,
    PROCESS_VM_OPERATION, PROCESS_VM_READ, PROCESS_VM_WRITE,
};

/// Inject a DLL into the target process by writing its path and spawning
/// a remote thread that calls LoadLibraryW.
pub fn inject_dll(pid: u32, dll_path: &Path) -> Result<(), String> {
    let dll_path_str = dll_path
        .to_str()
        .ok_or_else(|| "DLL path is not valid UTF-8".to_string())?;

    // Enable SeDebugPrivilege (best-effort, expected to fail without admin privileges)
    let _ignored = enable_debug_privilege();

    unsafe {
        // 1. Open target process
        let process: HANDLE = OpenProcess(
            PROCESS_CREATE_THREAD
                | PROCESS_QUERY_INFORMATION
                | PROCESS_VM_OPERATION
                | PROCESS_VM_WRITE
                | PROCESS_VM_READ,
            false,
            pid,
        )
        .map_err(|e| format!("OpenProcess failed: {}", e))?;

        // 2. Check if target is 32-bit (WoW64)
        let mut is_wow64 = BOOL(0);
        let _ = IsWow64Process(process, &mut is_wow64);
        let target_is_32bit = is_wow64.as_bool();

        log::debug!(
            "Target PID {} is {}-bit",
            pid,
            if target_is_32bit { 32 } else { 64 }
        );

        // 3. Prepare wide string of DLL path
        let wide_path: Vec<u16> = dll_path_str.encode_utf16().chain(Some(0)).collect();
        let byte_len = wide_path.len() * std::mem::size_of::<u16>();

        // 4. Allocate memory in target process
        let remote_addr = VirtualAllocEx(
            process,
            None,
            byte_len,
            MEM_COMMIT | MEM_RESERVE,
            PAGE_READWRITE,
        );

        if remote_addr.is_null() {
            let _cleanup = CloseHandle(process);
            return Err("VirtualAllocEx failed".to_string());
        }

        // 5. Write DLL path into target process memory
        let write_result = WriteProcessMemory(
            process,
            remote_addr,
            wide_path.as_ptr() as *const c_void,
            byte_len,
            None,
        );

        if write_result.is_err() {
            // Cleanup on error path - failures here are expected and not critical
            let _cleanup1 = VirtualFreeEx(process, remote_addr, 0, MEM_RELEASE);
            let _cleanup2 = CloseHandle(process);
            return Err("WriteProcessMemory failed".to_string());
        }

        // 6. Get address of LoadLibraryW -- must match target architecture
        let load_library_addr: usize = if target_is_32bit {
            // Cross-architecture: find 32-bit LoadLibraryW by reading the
            // remote process's kernel32.dll PE export table.
            find_remote_load_library_w(process, pid)?
        } else {
            // Same architecture: our kernel32 LoadLibraryW address works
            // because 64-bit system DLLs share the same base across processes.
            let kernel32 = GetModuleHandleW(w!("kernel32.dll"))
                .map_err(|e| format!("GetModuleHandleW(kernel32) failed: {}", e))?;
            let addr = GetProcAddress(kernel32, s!("LoadLibraryW"))
                .ok_or_else(|| "GetProcAddress(LoadLibraryW) failed".to_string())?;
            addr as usize
        };

        log::debug!("Remote LoadLibraryW at 0x{:X}", load_library_addr);

        // 7. Create remote thread calling LoadLibraryW with our path
        let thread_proc: unsafe extern "system" fn(*mut c_void) -> u32 =
            std::mem::transmute(load_library_addr);

        let thread: HANDLE = CreateRemoteThread(
            process,
            None,
            0,
            Some(thread_proc),
            Some(remote_addr),
            0,
            None,
        )
        .map_err(|e| format!("CreateRemoteThread failed: {}", e))?;

        // 8. Wait for the remote thread to finish (timeout 10s)
        let wait_result = WaitForSingleObject(thread, 10_000);
        if wait_result.0 != 0 {
            // Cleanup on error - failures here are expected and not critical
            let _cleanup1 = CloseHandle(thread);
            let _cleanup2 = VirtualFreeEx(process, remote_addr, 0, MEM_RELEASE);
            let _cleanup3 = CloseHandle(process);
            return Err(format!(
                "WaitForSingleObject returned 0x{:08X} (expected WAIT_OBJECT_0 = 0)",
                wait_result.0
            ));
        }

        // 9. Check if LoadLibraryW succeeded (exit code = HMODULE, 0 = failure)
        let mut exit_code: u32 = 0;
        let _ignored = GetExitCodeThread(thread, &mut exit_code);
        log::debug!("LoadLibraryW thread exit code (HMODULE): 0x{:08X}", exit_code);

        if exit_code == 0 {
            // Cleanup on error - failures here are expected and not critical
            let _cleanup1 = CloseHandle(thread);
            let _cleanup2 = VirtualFreeEx(process, remote_addr, 0, MEM_RELEASE);
            let _cleanup3 = CloseHandle(process);
            return Err(
                "LoadLibraryW returned NULL -- DLL failed to load in target process. \
                 Check that the DLL matches the target architecture (32-bit vs 64-bit)."
                    .to_string(),
            );
        }

        // 10. Cleanup
        let _cleanup1 = CloseHandle(thread);
        let _cleanup2 = VirtualFreeEx(process, remote_addr, 0, MEM_RELEASE);
        let _cleanup3 = CloseHandle(process);
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Cross-architecture helpers (64-bit host → 32-bit target)
// ---------------------------------------------------------------------------

/// Find the address of `LoadLibraryW` inside a 32-bit target process by
/// enumerating its modules to locate kernel32.dll, then parsing the PE
/// export table via ReadProcessMemory.
unsafe fn find_remote_load_library_w(process: HANDLE, pid: u32) -> Result<usize, String> {
    // Step 1: Find kernel32.dll base address in the 32-bit target
    let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid)
        .map_err(|e| format!("CreateToolhelp32Snapshot failed: {}", e))?;

    let mut me = MODULEENTRY32W {
        dwSize: std::mem::size_of::<MODULEENTRY32W>() as u32,
        ..Default::default()
    };

    let mut kernel32_base: Option<usize> = None;

    if Module32FirstW(snapshot, &mut me).is_ok() {
        loop {
            let name = String::from_utf16_lossy(&me.szModule)
                .trim_end_matches('\0')
                .to_string();
            if name.eq_ignore_ascii_case("kernel32.dll") {
                kernel32_base = Some(me.modBaseAddr as usize);
                break;
            }
            me.dwSize = std::mem::size_of::<MODULEENTRY32W>() as u32;
            if Module32NextW(snapshot, &mut me).is_err() {
                break;
            }
        }
    }

    let _cleanup = CloseHandle(snapshot);

    let base = kernel32_base
        .ok_or_else(|| "kernel32.dll not found in target process modules".to_string())?;

    log::debug!("Remote 32-bit kernel32.dll base: 0x{:08X}", base);

    // Step 2: Parse the PE export table via ReadProcessMemory

    // Read e_lfanew from DOS header (offset 0x3C)
    let e_lfanew = read_remote_u32(process, base + 0x3C)? as usize;

    // For a 32-bit PE, the export directory RVA is at:
    // NT_HEADERS + 0x78 (Signature:4 + FileHeader:20 + OptionalHeader to DataDir[0]:96)
    let export_dir_rva = read_remote_u32(process, base + e_lfanew + 0x78)? as usize;

    if export_dir_rva == 0 {
        return Err("No export directory in remote kernel32.dll".to_string());
    }

    let export_dir = base + export_dir_rva;

    // Read IMAGE_EXPORT_DIRECTORY fields
    let num_names = read_remote_u32(process, export_dir + 0x18)? as usize;
    let addr_functions_rva = read_remote_u32(process, export_dir + 0x1C)? as usize;
    let addr_names_rva = read_remote_u32(process, export_dir + 0x20)? as usize;
    let addr_ordinals_rva = read_remote_u32(process, export_dir + 0x24)? as usize;

    // Search for "LoadLibraryW" by name
    let target_name = b"LoadLibraryW\0";

    for i in 0..num_names {
        let name_rva = read_remote_u32(process, base + addr_names_rva + i * 4)? as usize;

        // Read just enough of the export name to compare
        let mut name_buf = [0u8; 16];
        read_remote_bytes(process, base + name_rva, &mut name_buf)?;

        if name_buf.starts_with(target_name) {
            // Read the ordinal index for this name
            let mut ord_buf = [0u8; 2];
            read_remote_bytes(process, base + addr_ordinals_rva + i * 2, &mut ord_buf)?;
            let ordinal = u16::from_le_bytes(ord_buf) as usize;

            // Read the function RVA from the address table
            let func_rva =
                read_remote_u32(process, base + addr_functions_rva + ordinal * 4)? as usize;

            let result = base + func_rva;
            log::debug!(
                "Found remote LoadLibraryW at 0x{:08X} (RVA 0x{:X})",
                result, func_rva
            );
            return Ok(result);
        }
    }

    Err("LoadLibraryW not found in remote kernel32.dll export table".to_string())
}

/// Read a u32 from a remote process.
unsafe fn read_remote_u32(process: HANDLE, address: usize) -> Result<u32, String> {
    let mut buf = [0u8; 4];
    read_remote_bytes(process, address, &mut buf)?;
    Ok(u32::from_le_bytes(buf))
}

/// Read bytes from a remote process.
unsafe fn read_remote_bytes(
    process: HANDLE,
    address: usize,
    buf: &mut [u8],
) -> Result<(), String> {
    ReadProcessMemory(
        process,
        address as *const c_void,
        buf.as_mut_ptr() as *mut c_void,
        buf.len(),
        None,
    )
    .map_err(|e| format!("ReadProcessMemory at 0x{:X} failed: {}", address, e))
}

// ---------------------------------------------------------------------------
// Privilege helpers
// ---------------------------------------------------------------------------

/// Try to enable SeDebugPrivilege for the current process.
fn enable_debug_privilege() -> Result<(), String> {
    unsafe {
        let mut token: HANDLE = HANDLE::default();
        OpenProcessToken(
            GetCurrentProcess(),
            TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY,
            &mut token,
        )
        .map_err(|e| format!("OpenProcessToken failed: {}", e))?;

        let mut luid = LUID::default();
        LookupPrivilegeValueW(None, w!("SeDebugPrivilege"), &mut luid)
            .map_err(|e| {
                let _cleanup = CloseHandle(token);
                format!("LookupPrivilegeValueW failed: {}", e)
            })?;

        let tp = TOKEN_PRIVILEGES {
            PrivilegeCount: 1,
            Privileges: [windows::Win32::Security::LUID_AND_ATTRIBUTES {
                Luid: luid,
                Attributes: SE_PRIVILEGE_ENABLED,
            }],
        };

        AdjustTokenPrivileges(
            token,
            false,
            Some(&tp),
            0,
            None,
            None,
        )
            .map_err(|e| {
                let _cleanup = CloseHandle(token);
                format!("AdjustTokenPrivileges failed: {}", e)
            })?;

        let _cleanup = CloseHandle(token);
        Ok(())
    }
}
