//! capture-dll -- a 32-bit DLL injected into WoW.exe to intercept packet
//! send/receive calls and relay packet data to a 64-bit host application
//! via shared memory.
//!
//! # Architecture
//!
//! ```text
//!   WoW.exe (32-bit)                       Host app (64-bit)
//!  +--------------------+                +--------------------+
//!  |  capture-dll.dll   |  shared memory |  packet reader     |
//!  |  (this crate)      | =============> |  ring consumer     |
//!  |  hooks send/recv   |                |                    |
//!  +--------------------+                +--------------------+
//! ```
//!
//! On `DLL_PROCESS_ATTACH` we spawn an initialisation thread that:
//! 1. Detects the WoW build number ([`version::detect_build`]).
//! 2. Creates the shared-memory ring buffer ([`ipc::init_shared_memory`]).
//! 3. Installs inline detours on the packet functions ([`hooks::install_hooks`]).
//! 4. Subclasses WoW's main window for host-to-DLL commands ([`wndproc::install_wndproc`]).
//!
//! On `DLL_PROCESS_DETACH` everything is torn down in reverse order.

mod hooks;
mod ipc;
mod version;
mod wndproc;

use std::ffi::c_void;

use once_cell::sync::OnceCell;

use windows::Win32::Foundation::{BOOL, HINSTANCE, HMODULE, TRUE};
use windows::Win32::System::LibraryLoader::DisableThreadLibraryCalls;
use windows::Win32::System::SystemServices::{DLL_PROCESS_ATTACH, DLL_PROCESS_DETACH};
use windows::Win32::System::Threading::{CreateThread, THREAD_CREATION_FLAGS};
use windows::Win32::System::Diagnostics::Debug::OutputDebugStringA;
use windows::core::PCSTR;

use crate::version::WowOffsets;

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

/// Holds everything the DLL needs to remember between attach and detach.
struct CaptureState {
    /// The detected WoW build number.
    _build: u32,
    /// Absolute addresses/offsets for the running build.
    _offsets: WowOffsets,
    /// The DLL's own `HINSTANCE`.
    _dll_instance: HINSTANCE,
}

// Safety: CaptureState is only written once during init (via OnceCell) and then
// read-only.  The HINSTANCE is a raw pointer that is valid for the lifetime
// of the DLL.
unsafe impl Send for CaptureState {}
unsafe impl Sync for CaptureState {}

static STATE: OnceCell<CaptureState> = OnceCell::new();

// ---------------------------------------------------------------------------
// DllMain
// ---------------------------------------------------------------------------

/// Standard Win32 DLL entry point.
///
/// # Safety
///
/// Called by the OS loader.  We do minimal work here (no heap allocation in
/// `DLL_PROCESS_ATTACH` proper) and defer real initialisation to a helper
/// thread.
#[no_mangle]
pub unsafe extern "system" fn DllMain(
    dll: HINSTANCE,
    reason: u32,
    _reserved: *mut c_void,
) -> BOOL {
    if reason == DLL_PROCESS_ATTACH {
        // Suppress DLL_THREAD_ATTACH / DLL_THREAD_DETACH notifications to
        // avoid unnecessary overhead.
        // DisableThreadLibraryCalls expects HMODULE; HINSTANCE and HMODULE
        // are layout-identical pointer wrappers.
        let _ = DisableThreadLibraryCalls(HMODULE(dll.0));

        // Spawn the real initialisation on a dedicated thread so we do not
        // hold the loader lock while doing heavy work (hooking, mapping
        // shared memory, etc.).
        // On 32-bit, pointers are 4 bytes, so casting to u32 is lossless.
        let dll_raw = dll.0 as usize;
        let _ = CreateThread(
            None,                                    // default security
            0,                                       // default stack size
            Some(init_thread),                       // thread proc
            Some(dll_raw as *const c_void),          // parameter
            THREAD_CREATION_FLAGS(0),                // run immediately
            None,                                    // don't need the thread id
        );

        TRUE
    } else if reason == DLL_PROCESS_DETACH {
        cleanup();
        TRUE
    } else {
        TRUE
    }
}

// ---------------------------------------------------------------------------
// Initialisation thread
// ---------------------------------------------------------------------------

/// Thread procedure: performs the full DLL initialisation sequence.
/// Wrapped in catch_unwind so a Rust panic doesn't silently kill the thread.
unsafe extern "system" fn init_thread(param: *mut c_void) -> u32 {
    // catch_unwind so we can log panics instead of silently dying
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        init_thread_inner(param)
    }));

    match result {
        Ok(code) => code,
        Err(e) => {
            let msg = if let Some(s) = e.downcast_ref::<&str>() {
                format!("capture-dll: init_thread PANICKED: {}\n", s)
            } else if let Some(s) = e.downcast_ref::<String>() {
                format!("capture-dll: init_thread PANICKED: {}\n", s)
            } else {
                "capture-dll: init_thread PANICKED (unknown payload)\n".to_string()
            };
            debug_log(&msg);
            file_log(&msg);
            99
        }
    }
}

unsafe fn init_thread_inner(param: *mut c_void) -> u32 {
    let dll_instance = HINSTANCE(param);

    file_log("capture-dll: init_thread started\n");
    debug_log("capture-dll: init_thread started\n");

    // 1. Detect the WoW build.
    let (build, offsets) = match version::detect_build() {
        Some(v) => v,
        None => {
            file_log("capture-dll: unsupported or unrecognised WoW build\n");
            debug_log("capture-dll: unsupported or unrecognised WoW build\n");
            return 1;
        }
    };

    file_log(&format!("capture-dll: detected build {}\n", build));
    debug_log_fmt(&format!("capture-dll: detected build {}\n", build));

    // 2. Create the shared-memory ring buffer.
    let pid = windows::Win32::System::Threading::GetCurrentProcessId();
    file_log(&format!("capture-dll: creating shared memory for PID {}\n", pid));
    if !ipc::init_shared_memory(pid, build) {
        file_log("capture-dll: failed to create shared memory\n");
        debug_log("capture-dll: failed to create shared memory\n");
        return 2;
    }

    file_log("capture-dll: shared memory initialised\n");
    debug_log("capture-dll: shared memory initialised\n");

    // 3. Install inline detours on send/recv functions.
    if !hooks::install_hooks(&offsets) {
        file_log("capture-dll: failed to install hooks\n");
        debug_log("capture-dll: failed to install hooks\n");
        ipc::cleanup();
        return 3;
    }

    file_log("capture-dll: hooks installed\n");
    debug_log("capture-dll: hooks installed\n");

    // Mark the DLL as ready in the shared-memory header so the host knows
    // packets will start flowing.
    ipc::set_dll_ready();

    // 4. Subclass WoW's main window for host commands.
    //    WoW may not have created its window yet at this point (especially if
    //    we were injected very early).  Retry a few times with a short sleep.
    let mut wndproc_ok = false;
    for _ in 0..20 {
        if wndproc::install_wndproc() {
            wndproc_ok = true;
            break;
        }
        windows::Win32::System::Threading::Sleep(500);
    }

    if wndproc_ok {
        debug_log("capture-dll: wndproc installed\n");
    } else {
        debug_log("capture-dll: WARNING -- could not subclass WoW window (host IPC unavailable)\n");
    }

    // Store global state.
    let _ = STATE.set(CaptureState {
        _build: build,
        _offsets: offsets,
        _dll_instance: dll_instance,
    });

    file_log("capture-dll: initialisation complete\n");
    debug_log("capture-dll: initialisation complete\n");
    0
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/// Reverse-order teardown of everything the DLL installed.
unsafe fn cleanup() {
    debug_log("capture-dll: cleanup\n");

    // 1. Restore the original window procedure.
    wndproc::uninstall_wndproc();

    // 2. Remove inline detours.
    hooks::uninstall_hooks();

    // 3. Unmap shared memory.
    ipc::cleanup();
}

// ---------------------------------------------------------------------------
// Debug logging helpers
// ---------------------------------------------------------------------------

/// Write a message to the debug output (visible in debuggers like WinDbg).
fn debug_log(msg: &str) {
    let mut buf: Vec<u8> = msg.as_bytes().to_vec();
    buf.push(0);
    unsafe {
        OutputDebugStringA(PCSTR(buf.as_ptr()));
    }
}

/// Write a formatted `String` to the debug output.
fn debug_log_fmt(msg: &str) {
    debug_log(msg);
}

/// Append a message to a log file next to WoW.exe for debugging.
/// This is more reliable than OutputDebugStringA when no debugger is attached.
pub(crate) fn file_log(msg: &str) {
    use std::io::Write;
    // Write next to the WoW executable
    let path = std::env::current_exe()
        .unwrap_or_default()
        .parent()
        .unwrap_or(std::path::Path::new("C:\\"))
        .join("capture_dll_log.txt");
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
    {
        let _ = writeln!(f, "{}", msg.trim_end());
    }
}
