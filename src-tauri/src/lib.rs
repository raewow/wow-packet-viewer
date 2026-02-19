mod capture;
mod state;

use capture::process::WowProcess;
use capture::session_store;
use state::{AppState, Direction, Packet, PacketSummary, Session, SessionInfo};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
fn discover_processes() -> Result<Vec<WowProcess>, String> {
    Ok(capture::process::discover_processes())
}

fn locate_dll_path() -> Result<PathBuf, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get current executable path: {}", e))?
        .parent()
        .ok_or("Failed to locate application directory: no parent directory found")?
        .to_path_buf();

    let dll_path = exe_dir.join("capture_dll.dll");

    if !dll_path.exists() {
        return Err(format!("Capture DLL not found at {:?}", dll_path));
    }

    Ok(dll_path)
}

fn initialize_capture(pid: u32, dll_path: &PathBuf) -> Result<capture::ipc::SharedMemoryReader, String> {
    capture::injector::inject_dll(pid, dll_path)?;

    // Open shared memory — retry because the DLL needs a moment after LoadLibrary
    let mut last_err = String::new();
    for _ in 0..20 {
        match capture::ipc::SharedMemoryReader::open(pid) {
            Ok(reader) => return Ok(reader),
            Err(e) => {
                last_err = e;
                std::thread::sleep(std::time::Duration::from_millis(250));
            }
        }
    }

    Err(format!("Failed to open shared memory after retries: {}", last_err))
}

fn update_attached_state(
    state: &Arc<AppState>,
    pid: u32,
    build: u32,
    version_name: String,
) {
    {
        let mut attached = state.attached.lock().unwrap();
        *attached = Some(state::AttachedProcess {
            pid,
            build,
            version_name,
        });
    }

    // Stamp the active session with this build number
    {
        let active_sid = state.active_session_id.lock().unwrap().clone();
        if let Some(sid) = active_sid {
            let mut sessions = state.sessions.lock().unwrap();
            if let Some(session) = sessions.get_mut(&sid) {
                session.build = Some(build);
            }
        }
    }

    *state.capturing.lock().unwrap() = true;
}

fn spawn_packet_reader(
    state: Arc<AppState>,
    app: AppHandle,
    reader: capture::ipc::SharedMemoryReader,
    build: u32,
) {
    tauri::async_runtime::spawn(async move {
        let reader = reader;
        loop {
            if !*state.capturing.lock().unwrap() {
                break;
            }

            let raw_packets = reader.read_packets();
            for raw in raw_packets {
                let opcode_name =
                    capture::packets::get_opcode_name(build, raw.opcode).to_string();
                let direction = Direction::from(raw.direction);

                // Capture fields before raw.data is moved
                let timestamp = raw.timestamp;
                let opcode = raw.opcode;
                let size = raw.data.len();

                // Get active session and add packet to it
                let active_sid = state.active_session_id.lock().unwrap().clone();
                let Some(sid) = active_sid else { continue };

                let packet_id = {
                    let mut sessions = state.sessions.lock().unwrap();
                    if let Some(session) = sessions.get_mut(&sid) {
                        let id = session.next_packet_id;
                        session.next_packet_id += 1;
                        session.packets.push(Packet {
                            id,
                            timestamp,
                            direction,
                            opcode,
                            opcode_name: opcode_name.clone(),
                            size,
                            data: raw.data,
                        });
                        Some(id)
                    } else {
                        None
                    }
                };

                let Some(packet_id) = packet_id else { continue };

                if let Err(e) = app.emit(
                    "packet",
                    serde_json::json!({
                        "session_id": &sid,
                        "id": packet_id,
                        "timestamp": timestamp,
                        "direction": direction,
                        "opcode": opcode,
                        "opcode_name": &opcode_name,
                        "size": size,
                    }),
                ) {
                    log::warn!("Failed to emit packet event: {}", e);
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        }
        drop(reader);
    });
}

#[tauri::command]
fn attach_process(
    pid: u32,
    build: u32,
    version_name: String,
    app: AppHandle,
) -> Result<(), String> {
    let state = app.state::<Arc<AppState>>();

    let dll_path = locate_dll_path()?;
    let reader = initialize_capture(pid, &dll_path)?;
    update_attached_state(&state, pid, build, version_name);
    spawn_packet_reader(Arc::clone(state.inner()), app, reader, build);

    Ok(())
}

#[tauri::command]
fn detach_process(app: AppHandle) -> Result<(), String> {
    let state = app.state::<Arc<AppState>>();
    *state.capturing.lock().unwrap() = false;
    let _attached = state.attached.lock().unwrap().take();
    Ok(())
}

#[tauri::command]
fn get_status(app: AppHandle) -> serde_json::Value {
    let state = app.state::<Arc<AppState>>();
    let active_sid = state.active_session_id.lock().unwrap().clone();
    let packet_count = if let Some(ref sid) = active_sid {
        let sessions = state.sessions.lock().unwrap();
        sessions.get(sid).map(|s| s.packets.len()).unwrap_or(0)
    } else {
        0
    };
    let attached = state.attached.lock().unwrap();
    serde_json::json!({
        "attached": attached.is_some(),
        "process": *attached,
        "packet_count": packet_count,
    })
}

// --- Session management commands ---

#[tauri::command]
fn get_sessions(app: AppHandle) -> Vec<SessionInfo> {
    let state = app.state::<Arc<AppState>>();
    let sessions = state.sessions.lock().unwrap();
    sessions.values().map(SessionInfo::from).collect()
}

#[tauri::command]
fn get_active_session_id(app: AppHandle) -> Option<String> {
    let state = app.state::<Arc<AppState>>();
    let id = state.active_session_id.lock().unwrap().clone();
    id
}

#[tauri::command]
fn create_session(name: String, app: AppHandle) -> SessionInfo {
    let state = app.state::<Arc<AppState>>();
    let session = Session::new(name);
    let info = SessionInfo::from(&session);
    state.sessions.lock().unwrap().insert(session.id.clone(), session);
    info
}

#[tauri::command]
fn switch_session(session_id: String, app: AppHandle) -> Result<(), String> {
    let state = app.state::<Arc<AppState>>();
    {
        let sessions = state.sessions.lock().unwrap();
        if !sessions.contains_key(&session_id) {
            return Err(format!("Session {} not found", session_id));
        }
    }
    *state.active_session_id.lock().unwrap() = Some(session_id);
    Ok(())
}

#[tauri::command]
fn rename_session(session_id: String, new_name: String, app: AppHandle) -> Result<(), String> {
    let state = app.state::<Arc<AppState>>();
    let mut sessions = state.sessions.lock().unwrap();
    sessions
        .get_mut(&session_id)
        .ok_or_else(|| format!("Session {} not found", session_id))
        .map(|s| {
            s.name = new_name;
        })
}

#[tauri::command]
fn close_session(session_id: String, app: AppHandle) -> Result<(), String> {
    let state = app.state::<Arc<AppState>>();

    // Remove session; pick a new active candidate before releasing the lock
    let new_active_candidate = {
        let mut sessions = state.sessions.lock().unwrap();
        if sessions.len() <= 1 {
            return Err("Cannot close the last session".to_string());
        }
        sessions.remove(&session_id);
        sessions.keys().next().cloned()
    };

    // Update active session ID if needed (separate lock acquisition)
    let mut active = state.active_session_id.lock().unwrap();
    if active.as_deref() == Some(&session_id) {
        *active = new_active_candidate;
    }

    Ok(())
}

#[tauri::command]
fn clear_packets(session_id: String, app: AppHandle) {
    let state = app.state::<Arc<AppState>>();
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.get_mut(&session_id) {
        session.packets.clear();
        session.next_packet_id = 0;
    }
}

#[tauri::command]
fn get_packet_summaries(session_id: String, app: AppHandle) -> Vec<PacketSummary> {
    let state = app.state::<Arc<AppState>>();
    let sessions = state.sessions.lock().unwrap();
    sessions
        .get(&session_id)
        .map(|s| s.packets.iter().map(PacketSummary::from).collect())
        .unwrap_or_default()
}

#[tauri::command]
fn get_packets(session_id: String, offset: usize, limit: usize, app: AppHandle) -> Vec<Packet> {
    let state = app.state::<Arc<AppState>>();
    let sessions = state.sessions.lock().unwrap();
    sessions
        .get(&session_id)
        .map(|s| s.packets.iter().skip(offset).take(limit).cloned().collect())
        .unwrap_or_default()
}

#[tauri::command]
fn get_packet_detail(session_id: String, id: usize, app: AppHandle) -> Option<Packet> {
    let state = app.state::<Arc<AppState>>();
    let sessions = state.sessions.lock().unwrap();
    sessions
        .get(&session_id)
        .and_then(|s| s.packets.iter().find(|p| p.id == id).cloned())
}

#[tauri::command]
fn save_session_cmd(session_id: String, app: AppHandle) -> Result<String, String> {
    // Clone the session before releasing the lock so we don't hold it during file I/O
    let session_clone = {
        let state = app.state::<Arc<AppState>>();
        let sessions = state.sessions.lock().unwrap();
        sessions
            .get(&session_id)
            .ok_or_else(|| format!("Session {} not found", session_id))?
            .clone()
    };
    let path = session_store::save_session(&app, &session_clone)?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn list_saved_sessions(app: AppHandle) -> Result<Vec<session_store::SavedSessionMeta>, String> {
    session_store::list_saved_sessions(&app)
}

#[tauri::command]
fn load_session_cmd(file_path: String, app: AppHandle) -> Result<SessionInfo, String> {
    let path = std::path::PathBuf::from(&file_path);
    let sf = session_store::load_session_file(&path)?;
    let max_id = sf.packets.iter().map(|p| p.id).max().map(|m| m + 1).unwrap_or(0);
    let session = Session {
        id: sf.id,
        name: sf.name,
        created_at: sf.created_at,
        build: sf.build,
        packets: sf.packets,
        next_packet_id: max_id,
    };
    let info = SessionInfo::from(&session);
    let state = app.state::<Arc<AppState>>();
    state.sessions.lock().unwrap().insert(session.id.clone(), session);
    Ok(info)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = Arc::new(AppState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            discover_processes,
            attach_process,
            detach_process,
            get_status,
            get_sessions,
            get_active_session_id,
            create_session,
            switch_session,
            rename_session,
            close_session,
            clear_packets,
            get_packet_summaries,
            get_packets,
            get_packet_detail,
            save_session_cmd,
            list_saved_sessions,
            load_session_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
