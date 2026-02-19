import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SavedSessionMeta {
  id: string;
  name: string;
  created_at: string;
  saved_at: string;
  packet_count: number;
  file_path: string;
}

interface SessionOpenDialogProps {
  onClose: () => void;
  onLoad: (filePath: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SessionOpenDialog({ onClose, onLoad }: SessionOpenDialogProps) {
  const [sessions, setSessions] = useState<SavedSessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<SavedSessionMeta[]>("list_saved_sessions")
      .then(setSessions)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Open Session</h3>
          <button className="detail-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <p>Loading...</p>
            </div>
          )}

          {error && (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <p style={{ color: "var(--accent)" }}>{error}</p>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <div className="icon">&#x1F4BE;</div>
              <p>No saved sessions found</p>
              <p style={{ fontSize: 12 }}>
                Use the Save button in the filter bar to save a session
              </p>
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="session-list">
              {sessions.map((s) => (
                <div key={s.id} className="session-list-item">
                  <div className="session-list-info">
                    <span className="session-list-name">{s.name}</span>
                    <span className="session-list-meta">
                      {s.packet_count.toLocaleString()} packets &middot; saved{" "}
                      {formatDate(s.saved_at)}
                    </span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onLoad(s.file_path)}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
