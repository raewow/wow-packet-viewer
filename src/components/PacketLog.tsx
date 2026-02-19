import { useRef, useEffect, useCallback, useState } from "react";
import { getPacketDefinition } from "../packet-parser";

export interface PacketSummary {
  id: number;
  timestamp: number;
  direction: string;
  opcode: number;
  opcode_name: string;
  size: number;
}

interface PacketLogProps {
  packets: PacketSummary[];
  selectedIds: Set<number>;
  primarySelectedId: number | null;
  onSelectionChange: (ids: Set<number>, primaryId: number | null) => void;
  autoScroll: boolean;
  build: number | null;
  onHideOpcode: (opcode: number) => void;
}

function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = ms % 1000;
  const hours = Math.floor(s / 3600) % 24;
  const mins = Math.floor(s / 60) % 60;
  const secs = s % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(m).padStart(3, "0")}`;
}

function formatOpcode(opcode: number): string {
  return `0x${opcode.toString(16).toUpperCase().padStart(4, "0")}`;
}

function formatPacketsForCopy(packets: PacketSummary[]): string {
  const header = "#\tTime\tDir\tOpcode\tName\tSize";
  const rows = packets.map(
    (pkt) =>
      `${pkt.id}\t${formatTimestamp(pkt.timestamp)}\t${pkt.direction === "CMSG" ? "C\u2192S" : "S\u2192C"}\t${formatOpcode(pkt.opcode)}\t${pkt.opcode_name}\t${pkt.size}B`
  );
  return [header, ...rows].join("\n");
}

function hasMapper(pkt: PacketSummary, build: number | null): boolean {
  if (build === null) return true;
  const definition = getPacketDefinition(build, pkt.opcode, pkt.direction);
  return definition !== undefined;
}

export default function PacketLog({
  packets,
  selectedIds,
  primarySelectedId,
  onSelectionChange,
  autoScroll,
  build,
  onHideOpcode,
}: PacketLogProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastClickedIndexRef = useRef<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    opcode: number;
    opcodeName: string;
  } | null>(null);

  useEffect(() => {
    if (autoScroll && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [packets.length, autoScroll]);

  const handleRowClick = useCallback(
    (pkt: PacketSummary, index: number, e: React.MouseEvent) => {
      if (e.shiftKey && lastClickedIndexRef.current !== null) {
        // Shift+Click: range select
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        const rangeIds = new Set(selectedIds);
        for (let i = start; i <= end; i++) {
          rangeIds.add(packets[i].id);
        }
        onSelectionChange(rangeIds, pkt.id);
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click: toggle individual row
        const newIds = new Set(selectedIds);
        if (newIds.has(pkt.id)) {
          newIds.delete(pkt.id);
          const newPrimary = newIds.size > 0 ? pkt.id : null;
          onSelectionChange(newIds, newIds.has(pkt.id) ? pkt.id : (newIds.size > 0 ? [...newIds][newIds.size - 1] : null));
        } else {
          newIds.add(pkt.id);
          onSelectionChange(newIds, pkt.id);
        }
        lastClickedIndexRef.current = index;
      } else {
        // Plain click: select only this row
        onSelectionChange(new Set([pkt.id]), pkt.id);
        lastClickedIndexRef.current = index;
      }
    },
    [packets, selectedIds, onSelectionChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIds.size > 0) {
        e.preventDefault();
        const selected = packets.filter((pkt) => selectedIds.has(pkt.id));
        const text = formatPacketsForCopy(selected);
        navigator.clipboard.writeText(text);
      }
      if (e.key === "Escape") {
        setContextMenu(null);
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        if (packets.length === 0) return;

        let newIndex: number;
        if (primarySelectedId === null) {
          // No selection - select first or last packet
          newIndex = e.key === "ArrowDown" ? 0 : packets.length - 1;
        } else {
          // Find current primary packet index
          const currentIndex = packets.findIndex((pkt) => pkt.id === primarySelectedId);
          if (currentIndex === -1) {
            // Current primary not in filtered list - select first or last
            newIndex = e.key === "ArrowDown" ? 0 : packets.length - 1;
          } else {
            // Move up or down
            if (e.key === "ArrowUp") {
              newIndex = Math.max(0, currentIndex - 1);
            } else {
              newIndex = Math.min(packets.length - 1, currentIndex + 1);
            }
          }
        }

        const newPacket = packets[newIndex];
        onSelectionChange(new Set([newPacket.id]), newPacket.id);
        lastClickedIndexRef.current = newIndex;

        // Scroll the selected row into view
        if (bodyRef.current) {
          const row = bodyRef.current.children[newIndex] as HTMLElement;
          if (row) {
            row.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }
      }
    },
    [packets, selectedIds, primarySelectedId, onSelectionChange]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, pkt: PacketSummary) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        opcode: pkt.opcode,
        opcodeName: pkt.opcode_name,
      });
    },
    []
  );

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu]);

  const header = (
    <div className="packet-table-header">
      <span></span>
      <span>#</span>
      <span>Time</span>
      <span>Dir</span>
      <span>Opcode</span>
      <span>Name</span>
      <span>Size</span>
    </div>
  );

  if (packets.length === 0) {
    return (
      <div className="packet-log">
        {header}
        <div className="empty-state">
          <div className="icon">&#x1F4E1;</div>
          <p>No packets captured yet</p>
          <p style={{ fontSize: 12 }}>Attach to a WoW process to begin capturing</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="packet-log" tabIndex={0} onKeyDown={handleKeyDown}>
        {header}
        <div className="packet-table-body" ref={bodyRef}>
          {packets.map((pkt, index) => {
            const isSelected = selectedIds.has(pkt.id);
            const isPrimary = pkt.id === primarySelectedId;
            const showWarning = !hasMapper(pkt, build);
            return (
              <div
                key={pkt.id}
                className={`packet-row${isSelected ? " selected" : ""}${isPrimary ? " primary" : ""}`}
                onClick={(e) => handleRowClick(pkt, index, e)}
                onContextMenu={(e) => handleContextMenu(e, pkt)}
              >
                <span className={showWarning ? "no-mapper-warning" : ""} title={showWarning ? "No parser defined for this packet" : ""}>
                  {showWarning ? "\u26A0" : ""}
                </span>
                <span className="col-muted">{pkt.id}</span>
                <span className="col-muted">{formatTimestamp(pkt.timestamp)}</span>
                <span className={pkt.direction === "CMSG" ? "dir-cmsg" : "dir-smsg"}>
                  {pkt.direction === "CMSG" ? "C\u2192S" : "S\u2192C"}
                </span>
                <span className="opcode-hex">{formatOpcode(pkt.opcode)}</span>
                <span className="opcode-name">{pkt.opcode_name}</span>
                <span className="col-muted">{pkt.size}B</span>
              </div>
            );
          })}
        </div>
      </div>
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              onHideOpcode(contextMenu.opcode);
              setContextMenu(null);
            }}
          >
            Hide all {contextMenu.opcodeName}
          </div>
        </div>
      )}
    </>
  );
}
