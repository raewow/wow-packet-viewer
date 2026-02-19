import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface WowProcess {
  pid: number;
  hwnd: number;
  build: number;
  version_name: string;
  exe_path: string;
}

interface ProcessPanelProps {
  attached: boolean;
  attachedInfo: string;
  onAttach: (pid: number) => void;
  onDetach: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
}

export default function ProcessPanel({ attached, attachedInfo, onAttach, onDetach, isRecording, onToggleRecording }: ProcessPanelProps) {
  const [processes, setProcesses] = useState<WowProcess[]>([]);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const procs = await invoke<WowProcess[]>("discover_processes");
      setProcesses(procs);
      if (procs.length > 0 && selectedPid === null) {
        setSelectedPid(procs[0].pid);
      }
      if (procs.length === 0) {
        setSelectedPid(null);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAttach() {
    if (selectedPid === null) return;
    const proc = processes.find((p) => p.pid === selectedPid);
    if (!proc) return;
    setLoading(true);
    setError(null);
    try {
      // Always detach first in case another tab was attached
      try { await invoke("detach_process"); } catch { /* ignore */ }
      await invoke("attach_process", {
        pid: selectedPid,
        build: proc.build,
        versionName: proc.version_name,
      });
      onAttach(selectedPid);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDetach() {
    setLoading(true);
    setError(null);
    try {
      await invoke("detach_process");
      onDetach();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="process-panel">
      <span className="process-status">
        <span className={`status-dot ${attached ? "connected" : "disconnected"}`} />
        {attached ? attachedInfo || "Connected" : "Not attached"}
      </span>

      {attached && (
        <button
          className={`btn ${isRecording ? "btn-danger" : "btn-secondary"} btn-sm recording-btn`}
          onClick={onToggleRecording}
          title={isRecording ? "Pause recording (packets still captured)" : "Resume recording"}
        >
          <span className="record-icon">{isRecording ? "⏸" : "⏺"}</span>
          {isRecording ? "Pause" : "Record"}
        </button>
      )}

      <select
        value={selectedPid ?? ""}
        onChange={(e) => setSelectedPid(e.target.value ? Number(e.target.value) : null)}
        disabled={attached || loading}
      >
        {processes.length === 0 && <option value="">No WoW processes found</option>}
        {processes.map((p) => (
          <option key={p.pid} value={p.pid}>
            PID {p.pid} - {p.version_name} - {p.exe_path}
          </option>
        ))}
      </select>

      <button
        className="btn btn-secondary btn-sm"
        onClick={refresh}
        disabled={attached || loading}
      >
        Refresh
      </button>

      {!attached ? (
        <button
          className="btn btn-primary"
          onClick={handleAttach}
          disabled={selectedPid === null || loading}
        >
          {loading ? "Attaching..." : "Attach"}
        </button>
      ) : (
        <button
          className="btn btn-danger"
          onClick={handleDetach}
          disabled={loading}
        >
          Detach
        </button>
      )}

      {error && <span style={{ color: "#e94560", fontSize: 12 }}>{error}</span>}
    </div>
  );
}
