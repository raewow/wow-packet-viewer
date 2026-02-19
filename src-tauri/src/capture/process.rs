use serde::Serialize;
use std::ffi::c_void;
use windows::core::{w, PCWSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, BOOL, HANDLE, HWND, LPARAM, MAX_PATH, TRUE};
use windows::Win32::Storage::FileSystem::{
    GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW, VS_FIXEDFILEINFO,
};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT,
    PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetClassNameW, GetWindowTextLengthW, GetWindowTextW,
    GetWindowThreadProcessId,
};

#[derive(Debug, Clone, Serialize)]
pub struct WowProcess {
    pub pid: u32,
    pub hwnd: isize,
    pub build: u32,
    pub version_name: String,
    pub exe_path: String,
}

struct EnumCallbackData {
    results: Vec<(HWND, u32)>,
}

/// Discover all running WoW processes by enumerating windows.
/// Returns processes even if version detection fails (build=0).
pub fn discover_processes() -> Vec<WowProcess> {
    let mut callback_data = EnumCallbackData {
        results: Vec::new(),
    };

    unsafe {
        // EnumWindows failure is not critical - we'll work with whatever windows we found
        let _ignored = EnumWindows(
            Some(enum_window_callback),
            LPARAM(&mut callback_data as *mut EnumCallbackData as isize),
        );
    }

    log::debug!("EnumWindows found {} WoW windows", callback_data.results.len());

    let mut processes = Vec::new();
    for (hwnd, pid) in &callback_data.results {
        let proc = build_wow_process(*hwnd, *pid);
        log::debug!("PID {} => {:?}", pid, proc);
        if let Some(proc) = proc {
            if !processes.iter().any(|p: &WowProcess| p.pid == proc.pid) {
                processes.push(proc);
            }
        }
    }

    processes
}

unsafe extern "system" fn enum_window_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let data = &mut *(lparam.0 as *mut EnumCallbackData);

    let text_len = GetWindowTextLengthW(hwnd);
    if text_len == 0 {
        return TRUE;
    }

    let mut buffer = vec![0u16; (text_len + 1) as usize];
    let copied = GetWindowTextW(hwnd, &mut buffer);
    if copied == 0 {
        return TRUE;
    }

    let title = String::from_utf16_lossy(&buffer[..copied as usize]);
    let title_lower = title.to_lowercase();

    // Check window title: "World of Warcraft" or titles starting with it
    let title_match = title_lower == "world of warcraft"
        || title_lower.starts_with("world of warcraft");

    // Also check window class: WoW uses "GxWindowClass" or "GxWindowClassD3d"
    let mut class_buf = [0u16; 256];
    let class_len = GetClassNameW(hwnd, &mut class_buf);
    let class_match = if class_len > 0 {
        let class_name = String::from_utf16_lossy(&class_buf[..class_len as usize]);
        class_name.starts_with("GxWindow")
    } else {
        false
    };

    if title_match || class_match {
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid != 0 {
            data.results.push((hwnd, pid));
        }
    }

    TRUE
}

fn build_wow_process(hwnd: HWND, pid: u32) -> Option<WowProcess> {
    unsafe {
        let process: HANDLE = match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
            Ok(h) => h,
            Err(e) => {
                log::warn!("OpenProcess({}) failed: {} -- try running as Administrator", pid, e);
                // Still return a basic entry so the user sees the process
                return Some(WowProcess {
                    pid,
                    hwnd: hwnd.0 as isize,
                    build: 0,
                    version_name: "Unknown (access denied)".to_string(),
                    exe_path: String::new(),
                });
            }
        };

        let mut path_buf = vec![0u16; MAX_PATH as usize];
        let mut path_len = path_buf.len() as u32;
        let result = QueryFullProcessImageNameW(
            process,
            PROCESS_NAME_FORMAT(0),
            PWSTR(path_buf.as_mut_ptr()),
            &mut path_len,
        );

        let _cleanup = CloseHandle(process);

        let exe_path = if result.is_ok() && path_len > 0 {
            String::from_utf16_lossy(&path_buf[..path_len as usize])
        } else {
            log::debug!("QueryFullProcessImageNameW({}) failed", pid);
            String::new()
        };

        let build = if !exe_path.is_empty() {
            match get_build_number(&exe_path) {
                Some(b) => {
                    log::debug!("Build number for PID {}: {}", pid, b);
                    b
                }
                None => {
                    log::debug!("Could not read version info from: {}", exe_path);
                    0
                }
            }
        } else {
            0
        };

        let version_name = build_to_version_name(build);

        Some(WowProcess {
            pid,
            hwnd: hwnd.0 as isize,
            build,
            version_name,
            exe_path,
        })
    }
}

fn get_build_number(exe_path: &str) -> Option<u32> {
    unsafe {
        let wide_path: Vec<u16> = exe_path.encode_utf16().chain(std::iter::once(0)).collect();
        let path_pcwstr = PCWSTR(wide_path.as_ptr());

        let size = GetFileVersionInfoSizeW(path_pcwstr, None);
        if size == 0 {
            log::debug!("GetFileVersionInfoSizeW returned 0 for {}", exe_path);
            return None;
        }

        let mut ver_data: Vec<u8> = vec![0u8; size as usize];
        if let Err(e) =
            GetFileVersionInfoW(path_pcwstr, 0, size, ver_data.as_mut_ptr() as *mut c_void)
        {
            log::debug!("GetFileVersionInfoW failed: {}", e);
            return None;
        }

        let mut info_ptr: *mut c_void = std::ptr::null_mut();
        let mut info_len: u32 = 0;

        let query_result = VerQueryValueW(
            ver_data.as_ptr() as *const c_void,
            w!("\\"),
            &mut info_ptr,
            &mut info_len,
        );

        if !query_result.as_bool() || info_ptr.is_null() {
            log::debug!("VerQueryValueW failed");
            return None;
        }

        let info = &*(info_ptr as *const VS_FIXEDFILEINFO);

        log::debug!(
            "VS_FIXEDFILEINFO: MS=0x{:08X} LS=0x{:08X}",
            info.dwFileVersionMS, info.dwFileVersionLS
        );

        // Build number is in the low word of dwFileVersionLS
        let build = info.dwFileVersionLS & 0xFFFF;
        Some(build)
    }
}

fn build_to_version_name(build: u32) -> String {
    match build {
        5875 => "1.12.1 (Vanilla)".to_string(),
        8606 => "2.4.3 (TBC)".to_string(),
        12340 => "3.3.5a (WotLK)".to_string(),
        15595 => "4.3.4 (Cataclysm)".to_string(),
        0 => "Unknown".to_string(),
        other => format!("Unknown (build {})", other),
    }
}
