use crate::state::{Packet, Session};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize)]
pub struct SessionFile {
    pub version: u32,
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub saved_at: String,
    #[serde(default)]
    pub build: Option<u32>,
    pub packets: Vec<Packet>,
}

#[derive(Serialize)]
pub struct SavedSessionMeta {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub saved_at: String,
    pub packet_count: usize,
    pub file_path: String,
    pub build: Option<u32>,
}

pub fn sessions_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;
    let dir = base.join("sessions");
    std::fs::create_dir_all(&dir).map_err(|e| format!("Cannot create sessions dir: {e}"))?;
    Ok(dir)
}

pub fn save_session(app: &AppHandle, session: &Session) -> Result<PathBuf, String> {
    let path = sessions_dir(app)?.join(format!("{}.json", session.id));
    let file = SessionFile {
        version: 1,
        id: session.id.clone(),
        name: session.name.clone(),
        created_at: session.created_at.clone(),
        saved_at: chrono::Utc::now().to_rfc3339(),
        build: session.build,
        packets: session.packets.clone(),
    };
    let json =
        serde_json::to_string_pretty(&file).map_err(|e| format!("Serialization failed: {e}"))?;
    std::fs::write(&path, json).map_err(|e| format!("Write failed: {e}"))?;
    Ok(path)
}

pub fn load_session_file(path: &PathBuf) -> Result<SessionFile, String> {
    let json = std::fs::read_to_string(path).map_err(|e| format!("Read failed: {e}"))?;
    serde_json::from_str(&json).map_err(|e| format!("Parse failed: {e}"))
}

pub fn list_saved_sessions(app: &AppHandle) -> Result<Vec<SavedSessionMeta>, String> {
    let dir = sessions_dir(app)?;
    let mut results = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(sf) = load_session_file(&path) {
                    results.push(SavedSessionMeta {
                        id: sf.id,
                        name: sf.name,
                        created_at: sf.created_at,
                        saved_at: sf.saved_at,
                        packet_count: sf.packets.len(),
                        file_path: path.to_string_lossy().into_owned(),
                        build: sf.build,
                    });
                }
            }
        }
    }
    results.sort_by(|a, b| b.saved_at.cmp(&a.saved_at));
    Ok(results)
}
