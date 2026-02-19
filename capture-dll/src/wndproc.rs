//! Window subclassing for command IPC with the host application.
//!
//! We find WoW's main window, subclass it with `SetWindowLongW`, and listen
//! for custom `WM_USER+N` messages sent by the 64-bit host.  Unrecognised
//! messages are forwarded to the original window procedure.

use std::sync::atomic::{AtomicIsize, AtomicPtr, Ordering};

use windows::Win32::Foundation::{BOOL, HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    CallWindowProcW, DefWindowProcW, EnumWindows, GetClassNameW,
    GetWindowThreadProcessId, SetWindowLongW, GWL_WNDPROC, WM_USER, WNDPROC,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// The host sends messages with this wParam to identify capture commands.
const CAPTURE_WPARAM: usize = 0x57535059; // "WSPY"

/// Message IDs (WM_USER + offset).
const MSG_HOOKS_INSTALLED: u32 = WM_USER + 1; // 0x0401 -- no-op acknowledgement
const MSG_REINSTALL_HOOKS: u32 = WM_USER + 2; // 0x0402 -- re-install hooks
const MSG_QUERY_STATUS: u32 = WM_USER + 3;    // 0x0403 -- return status flags

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

/// The original WNDPROC before we subclassed.
static ORIGINAL_WNDPROC: AtomicIsize = AtomicIsize::new(0);

/// The HWND we subclassed (stored as a raw pointer for cross-thread access).
static SUBCLASSED_HWND: AtomicPtr<core::ffi::c_void> =
    AtomicPtr::new(core::ptr::null_mut());

// ---------------------------------------------------------------------------
// Our replacement window procedure
// ---------------------------------------------------------------------------

unsafe extern "system" fn capture_wndproc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    // Check if this is a capture command.
    if wparam.0 == CAPTURE_WPARAM {
        match msg {
            MSG_HOOKS_INSTALLED => {
                // No-op: hooks are already installed during DLL init.
                return LRESULT(1);
            }
            MSG_REINSTALL_HOOKS => {
                // The host asks us to re-install hooks (e.g. after a patch).
                // For now just report that we are alive.
                return LRESULT(if crate::hooks::hooks_active() { 1 } else { 0 });
            }
            MSG_QUERY_STATUS => {
                // Return a bitmask:
                //   bit 0: hooks active
                //   bit 1: shared memory mapped
                let mut status: isize = 0;
                if crate::hooks::hooks_active() {
                    status |= 1;
                }
                // If we got here the DLL is initialised, so shared memory is up.
                status |= 2;
                return LRESULT(status);
            }
            _ => {
                // Reserved message range -- ignore but consume.
                if msg > WM_USER && msg <= WM_USER + 8 {
                    return LRESULT(0);
                }
            }
        }
    }

    // Forward everything else to the original WNDPROC.
    let orig = ORIGINAL_WNDPROC.load(Ordering::Acquire);
    if orig != 0 {
        let proc: WNDPROC = Some(core::mem::transmute(orig));
        CallWindowProcW(proc, hwnd, msg, wparam, lparam)
    } else {
        // Should not happen, but avoid hanging the message loop.
        DefWindowProcW(hwnd, msg, wparam, lparam)
    }
}

// ---------------------------------------------------------------------------
// Window enumeration
// ---------------------------------------------------------------------------

/// State passed through `EnumWindows` lparam.
struct FindWindowCtx {
    /// The PID we are looking for (our own process).
    target_pid: u32,
    /// Set to the HWND if we find it.
    found: HWND,
}

/// Callback for `EnumWindows`.  Looks for a top-level window belonging to our
/// process whose class name is `GxWindowClass*` (the well-known WoW window
/// class for all supported builds).
unsafe extern "system" fn enum_windows_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let ctx = &mut *(lparam.0 as *mut FindWindowCtx);

    // Check the owning PID.
    let mut pid: u32 = 0;
    GetWindowThreadProcessId(hwnd, Some(&mut pid));
    if pid != ctx.target_pid {
        return BOOL(1); // continue -- wrong process
    }

    // Check the class name.
    let mut class_buf = [0u16; 256];
    let len = GetClassNameW(hwnd, &mut class_buf);
    if len > 0 {
        let class_name = String::from_utf16_lossy(&class_buf[..len as usize]);
        // WoW historically uses "GxWindowClass" or "GxWindowClassD3d".
        if class_name.starts_with("GxWindow") {
            ctx.found = hwnd;
            return BOOL(0); // stop enumeration
        }
    }

    BOOL(1) // continue
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Find WoW's main window (in the current process) and subclass it.
///
/// Returns `true` on success.
pub fn install_wndproc() -> bool {
    unsafe {
        let pid = windows::Win32::System::Threading::GetCurrentProcessId();

        let mut ctx = FindWindowCtx {
            target_pid: pid,
            found: HWND::default(),
        };

        // EnumWindows walks every top-level window on the desktop.
        let _ = EnumWindows(
            Some(enum_windows_callback),
            LPARAM(&mut ctx as *mut FindWindowCtx as isize),
        );

        if ctx.found.0.is_null() {
            return false;
        }

        let hwnd = ctx.found;

        // Subclass: replace the window procedure.
        let old = SetWindowLongW(hwnd, GWL_WNDPROC, capture_wndproc as i32);
        if old == 0 {
            return false;
        }

        ORIGINAL_WNDPROC.store(old as isize, Ordering::Release);
        SUBCLASSED_HWND.store(hwnd.0, Ordering::Release);

        true
    }
}

/// Restore the original window procedure.
pub fn uninstall_wndproc() {
    unsafe {
        let hwnd_raw = SUBCLASSED_HWND.swap(core::ptr::null_mut(), Ordering::AcqRel);
        let orig = ORIGINAL_WNDPROC.swap(0, Ordering::AcqRel);

        if !hwnd_raw.is_null() && orig != 0 {
            SetWindowLongW(HWND(hwnd_raw), GWL_WNDPROC, orig as i32);
        }
    }
}
