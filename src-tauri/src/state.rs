use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Direction {
    #[serde(rename = "SMSG")]
    ServerToClient = 0,
    #[serde(rename = "CMSG")]
    ClientToServer = 1,
}

impl From<u8> for Direction {
    fn from(val: u8) -> Self {
        if val == 0 {
            Direction::ServerToClient
        } else {
            Direction::ClientToServer
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Packet {
    pub id: usize,
    pub timestamp: u32,
    pub direction: Direction,
    pub opcode: u32,
    pub opcode_name: String,
    pub size: usize,
    pub data: Vec<u8>,
}

/// Lightweight packet summary without raw payload bytes.
#[derive(Debug, Clone, Serialize)]
pub struct PacketSummary {
    pub id: usize,
    pub timestamp: u32,
    pub direction: Direction,
    pub opcode: u32,
    pub opcode_name: String,
    pub size: usize,
}

impl From<&Packet> for PacketSummary {
    fn from(p: &Packet) -> Self {
        PacketSummary {
            id: p.id,
            timestamp: p.timestamp,
            direction: p.direction,
            opcode: p.opcode,
            opcode_name: p.opcode_name.clone(),
            size: p.size,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AttachedProcess {
    pub pid: u32,
    pub build: u32,
    pub version_name: String,
}

pub type SessionId = String;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: SessionId,
    pub name: String,
    pub created_at: String, // RFC 3339
    #[serde(default)]
    pub build: Option<u32>,
    pub packets: Vec<Packet>,
    pub next_packet_id: usize,
}

impl Session {
    pub fn new(name: impl Into<String>) -> Self {
        Session {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.into(),
            created_at: chrono::Utc::now().to_rfc3339(),
            build: None,
            packets: Vec::new(),
            next_packet_id: 0,
        }
    }
}

/// Lightweight session metadata without packet data.
#[derive(Debug, Clone, Serialize)]
pub struct SessionInfo {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub packet_count: usize,
    pub build: Option<u32>,
}

impl From<&Session> for SessionInfo {
    fn from(s: &Session) -> Self {
        SessionInfo {
            id: s.id.clone(),
            name: s.name.clone(),
            created_at: s.created_at.clone(),
            packet_count: s.packets.len(),
            build: s.build,
        }
    }
}

pub struct AppState {
    pub sessions: Mutex<HashMap<SessionId, Session>>,
    pub active_session_id: Mutex<Option<SessionId>>,
    pub attached: Mutex<Option<AttachedProcess>>,
    pub capturing: Mutex<bool>,
}

impl AppState {
    pub fn new() -> Self {
        let default_session = Session::new("Untitled");
        let default_id = default_session.id.clone();
        let mut sessions = HashMap::new();
        sessions.insert(default_id.clone(), default_session);
        AppState {
            sessions: Mutex::new(sessions),
            active_session_id: Mutex::new(Some(default_id)),
            attached: Mutex::new(None),
            capturing: Mutex::new(false),
        }
    }
}
