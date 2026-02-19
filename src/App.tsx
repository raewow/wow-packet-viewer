import { useState, useCallback, useEffect, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import ProcessPanel from "./components/ProcessPanel";
import FilterBar from "./components/FilterBar";
import PacketLog, { PacketSummary } from "./components/PacketLog";
import PacketDetail from "./components/PacketDetail";
import SessionTabs from "./components/SessionTabs";
import SessionOpenDialog from "./components/SessionOpenDialog";
import WindowHeader from "./components/WindowHeader";
import "./App.css";

interface SessionUIState {
  searchText: string;
  showCmsg: boolean;
  showSmsg: boolean;
  autoScroll: boolean;
  selectedPacketIds: Set<number>;
  primarySelectedId: number | null;
  hiddenOpcodes: Set<number>;
  isRecording: boolean;
}

interface SessionTab {
  id: string;
  name: string;
  build: number | null;
  packets: PacketSummary[];
  ui: SessionUIState;
  isDirty: boolean;
  attached: boolean;
  attachedInfo: string;
}

interface SessionInfo {
  id: string;
  name: string;
  created_at: string;
  packet_count: number;
  build: number | null;
}

function defaultUI(): SessionUIState {
  return {
    searchText: "",
    showCmsg: true,
    showSmsg: true,
    autoScroll: true,
    selectedPacketIds: new Set<number>(),
    primarySelectedId: null,
    hiddenOpcodes: new Set<number>(),
    isRecording: true,
  };
}

function App() {
  const [sessions, setSessions] = useState<SessionTab[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // Build opcode-to-name mapping for UI display
  const opcodeNameMap = useMemo(() => {
    const map = new Map<number, string>();
    activeSession?.packets.forEach((pkt) => {
      if (!map.has(pkt.opcode)) {
        map.set(pkt.opcode, pkt.opcode_name);
      }
    });
    return map;
  }, [activeSession?.packets]);

  function updateSession(id: string, fn: (s: SessionTab) => SessionTab) {
    setSessions((prev) => prev.map((s) => (s.id === id ? fn(s) : s)));
  }

  function updateActiveUI(patch: Partial<SessionUIState>) {
    if (!activeSessionId) return;
    updateSession(activeSessionId, (s) => ({ ...s, ui: { ...s.ui, ...patch } }));
  }

  // Initialize from backend on mount
  useEffect(() => {
    async function init() {
      const [infos, activeId] = await Promise.all([
        invoke<SessionInfo[]>("get_sessions"),
        invoke<string | null>("get_active_session_id"),
      ]);
      setSessions(
        infos.map((info) => ({
          id: info.id,
          name: info.name,
          build: info.build ?? null,
          packets: [],
          ui: defaultUI(),
          isDirty: false,
          attached: false,
          attachedInfo: "",
        }))
      );
      setActiveSessionId(activeId);
    }
    init();
  }, []);

  // Listen for incoming packets — route by session_id
  useEffect(() => {
    const unlisten = listen<PacketSummary & { session_id: string }>(
      "packet",
      (event) => {
        const { session_id, ...summary } = event.payload;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === session_id) {
              // Only append packet if recording is enabled
              if (s.ui.isRecording) {
                return { ...s, packets: [...s.packets, summary], isDirty: true };
              }
              // If not recording, still mark as dirty (backend has packets we don't show)
              return { ...s, isDirty: true };
            }
            return s;
          })
        );
      }
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // --- Session handlers ---

  async function handleCreateSession() {
    const info = await invoke<SessionInfo>("create_session", { name: "Untitled" });
    setSessions((prev) => [
      ...prev,
      { id: info.id, name: info.name, build: info.build ?? null, packets: [], ui: defaultUI(), isDirty: false, attached: false, attachedInfo: "" },
    ]);
    setActiveSessionId(info.id);
    await invoke("switch_session", { sessionId: info.id });
  }

  async function handleActivateSession(id: string) {
    setActiveSessionId(id);
    await invoke("switch_session", { sessionId: id });
  }

  async function handleCloseSession(id: string) {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    if (sessions.length <= 1) return; // Cannot close last session

    if (session.isDirty && session.packets.length > 0) {
      if (!window.confirm(`Session "${session.name}" has unsaved packets. Close anyway?`))
        return;
    }

    // If this tab was attached, detach from the backend
    if (session.attached) {
      try {
        await invoke("detach_process");
      } catch {
        // best-effort
      }
    }

    // Switch away from this session if it's active
    if (id === activeSessionId) {
      const others = sessions.filter((s) => s.id !== id);
      if (others.length > 0) {
        const newActive = others[others.length - 1].id;
        setActiveSessionId(newActive);
        await invoke("switch_session", { sessionId: newActive });
      }
    }

    setSessions((prev) => prev.filter((s) => s.id !== id));
    await invoke("close_session", { sessionId: id });
  }

  async function handleRenameSession(id: string, newName: string) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)));
    await invoke("rename_session", { sessionId: id, newName });
  }

  async function handleSaveSession(id: string) {
    try {
      await invoke("save_session_cmd", { sessionId: id });
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, isDirty: false } : s)));
    } catch (e) {
      alert(`Failed to save session: ${e}`);
    }
  }

  async function handleLoadSession(filePath: string) {
    try {
      const info = await invoke<SessionInfo>("load_session_cmd", { filePath });
      // Don't duplicate if already open
      if (sessions.some((s) => s.id === info.id)) {
        setActiveSessionId(info.id);
        await invoke("switch_session", { sessionId: info.id });
        setShowOpenDialog(false);
        return;
      }
      // Fetch packet summaries for the loaded session
      const packets = await invoke<PacketSummary[]>("get_packet_summaries", {
        sessionId: info.id,
      });
      setSessions((prev) => [
        ...prev,
        { id: info.id, name: info.name, build: info.build ?? null, packets, ui: defaultUI(), isDirty: false, attached: false, attachedInfo: "" },
      ]);
      setActiveSessionId(info.id);
      await invoke("switch_session", { sessionId: info.id });
      setShowOpenDialog(false);
    } catch (e) {
      alert(`Failed to load session: ${e}`);
    }
  }

  // --- Process handlers ---

  const handleAttach = useCallback(async (pid: number) => {
    if (!activeSessionId) return;

    // Clear attached state on all other tabs (backend only supports one attachment)
    setSessions((prev) =>
      prev.map((s) =>
        s.attached ? { ...s, attached: false, attachedInfo: "" } : s
      )
    );

    // Mark the active tab as attached
    updateSession(activeSessionId, (s) => ({ ...s, attached: true }));

    try {
      const status = await invoke<{
        attached: boolean;
        process: { pid: number; build: number; version_name: string } | null;
        packet_count: number;
      }>("get_status");
      if (status.process) {
        updateSession(activeSessionId, (s) => ({
          ...s,
          attachedInfo: `PID ${status.process!.pid} - ${status.process!.version_name}`,
          build: status.process!.build,
        }));
      }
    } catch {
      updateSession(activeSessionId, (s) => ({
        ...s,
        attachedInfo: `PID ${pid}`,
      }));
    }
  }, [activeSessionId]);

  const handleDetach = useCallback(() => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, (s) => ({
      ...s,
      attached: false,
      attachedInfo: "",
    }));
  }, [activeSessionId]);

  const handleToggleRecording = useCallback(() => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, (s) => ({
      ...s,
      ui: { ...s.ui, isRecording: !s.ui.isRecording },
    }));
  }, [activeSessionId]);

  // --- Active session UI handlers ---

  const handleClear = useCallback(() => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, packets: [], isDirty: false, ui: { ...s.ui, selectedPacketIds: new Set(), primarySelectedId: null } }
          : s
      )
    );
    invoke("clear_packets", { sessionId: activeSessionId }).catch(() => {});
  }, [activeSessionId]);

  const handleToggleHiddenOpcode = useCallback((opcode: number) => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, (s) => {
      const newHidden = new Set(s.ui.hiddenOpcodes);
      if (newHidden.has(opcode)) {
        newHidden.delete(opcode);
      } else {
        newHidden.add(opcode);
      }
      return { ...s, ui: { ...s.ui, hiddenOpcodes: newHidden } };
    });
  }, [activeSessionId]);

  const handleClearHiddenOpcodes = useCallback(() => {
    if (!activeSessionId) return;
    updateActiveUI({ hiddenOpcodes: new Set<number>() });
  }, [activeSessionId]);

  // Filtered packets for the active session
  const filteredPackets = (activeSession?.packets ?? []).filter((pkt) => {
    const ui = activeSession!.ui;
    // Check if opcode is hidden
    if (ui.hiddenOpcodes.has(pkt.opcode)) return false;
    if (!ui.showCmsg && pkt.direction === "CMSG") return false;
    if (!ui.showSmsg && pkt.direction === "SMSG") return false;
    if (ui.searchText) {
      const search = ui.searchText.toLowerCase();
      const nameMatch = pkt.opcode_name.toLowerCase().includes(search);
      const hexMatch = `0x${pkt.opcode.toString(16).toLowerCase()}`.includes(search);
      const decMatch = pkt.opcode.toString().includes(search);
      if (!nameMatch && !hexMatch && !decMatch) return false;
    }
    return true;
  });

  return (
    <div className="app">
      <WindowHeader />

      <SessionTabs
        sessions={sessions.map((s) => ({
          id: s.id,
          name: s.name,
          isDirty: s.isDirty && s.packets.length > 0,
        }))}
        activeSessionId={activeSessionId}
        onActivate={handleActivateSession}
        onCreate={handleCreateSession}
        onClose={handleCloseSession}
        onRename={handleRenameSession}
        onSave={(id) => handleSaveSession(id)}
        onOpen={() => setShowOpenDialog(true)}
      />

      <ProcessPanel
        attached={activeSession?.attached ?? false}
        attachedInfo={activeSession?.attachedInfo ?? ""}
        onAttach={handleAttach}
        onDetach={handleDetach}
        isRecording={activeSession?.ui.isRecording ?? true}
        onToggleRecording={handleToggleRecording}
      />

      {activeSession && (
        <>
          <FilterBar
            searchText={activeSession.ui.searchText}
            onSearchChange={(text) => updateActiveUI({ searchText: text })}
            showCmsg={activeSession.ui.showCmsg}
            showSmsg={activeSession.ui.showSmsg}
            onToggleCmsg={() => updateActiveUI({ showCmsg: !activeSession.ui.showCmsg })}
            onToggleSmsg={() => updateActiveUI({ showSmsg: !activeSession.ui.showSmsg })}
            totalCount={activeSession.packets.length}
            filteredCount={filteredPackets.length}
            onClear={handleClear}
            autoScroll={activeSession.ui.autoScroll}
            onToggleAutoScroll={() =>
              updateActiveUI({ autoScroll: !activeSession.ui.autoScroll })
            }
            onSave={() => handleSaveSession(activeSession.id)}
            hiddenOpcodes={activeSession.ui.hiddenOpcodes}
            opcodeNameMap={opcodeNameMap}
            onToggleHiddenOpcode={handleToggleHiddenOpcode}
            onClearHiddenOpcodes={handleClearHiddenOpcodes}
          />

          <div className="main-content">
            <PacketLog
              packets={filteredPackets}
              selectedIds={activeSession.ui.selectedPacketIds}
              primarySelectedId={activeSession.ui.primarySelectedId}
              onSelectionChange={(ids, primaryId) =>
                updateActiveUI({ selectedPacketIds: ids, primarySelectedId: primaryId })
              }
              autoScroll={activeSession.ui.autoScroll}
              build={activeSession.build}
              onHideOpcode={(opcode) => handleToggleHiddenOpcode(opcode)}
            />
            <PacketDetail
              sessionId={activeSession.id}
              packetId={activeSession.ui.primarySelectedId}
              build={activeSession.build}
              onClose={() => updateActiveUI({ selectedPacketIds: new Set(), primarySelectedId: null })}
            />
          </div>
        </>
      )}

      {showOpenDialog && (
        <SessionOpenDialog
          onClose={() => setShowOpenDialog(false)}
          onLoad={handleLoadSession}
        />
      )}
    </div>
  );
}

export default App;
