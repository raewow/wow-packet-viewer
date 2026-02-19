import { useState } from "react";

interface FilterBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  showCmsg: boolean;
  showSmsg: boolean;
  onToggleCmsg: () => void;
  onToggleSmsg: () => void;
  totalCount: number;
  filteredCount: number;
  onClear: () => void;
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  onSave: () => void;
  hiddenOpcodes: Set<number>;
  opcodeNameMap: Map<number, string>;
  onToggleHiddenOpcode: (opcode: number) => void;
  onClearHiddenOpcodes: () => void;
}

export default function FilterBar({
  searchText,
  onSearchChange,
  showCmsg,
  showSmsg,
  onToggleCmsg,
  onToggleSmsg,
  totalCount,
  filteredCount,
  onClear,
  autoScroll,
  onToggleAutoScroll,
  onSave,
  hiddenOpcodes,
  opcodeNameMap,
  onToggleHiddenOpcode,
  onClearHiddenOpcodes,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="filter-bar" style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Filter by opcode name or hex (e.g. CMSG_MESSAGECHAT or 0x95)..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="toggle-group">
        <button
          className={`toggle-btn cmsg ${showCmsg ? "active" : ""}`}
          onClick={onToggleCmsg}
        >
          CMSG
        </button>
        <button
          className={`toggle-btn smsg ${showSmsg ? "active" : ""}`}
          onClick={onToggleSmsg}
        >
          SMSG
        </button>
      </div>

      <button
        className={`toggle-btn ${autoScroll ? "active" : ""}`}
        style={{ borderRadius: 4 }}
        onClick={onToggleAutoScroll}
      >
        Auto-scroll
      </button>

      {hiddenOpcodes.size > 0 && (
        <button
          className={`hidden-opcodes-badge ${expanded ? "active" : ""}`}
          onClick={() => setExpanded(!expanded)}
        >
          Hidden: {hiddenOpcodes.size}
        </button>
      )}

      <button className="btn btn-secondary btn-sm" onClick={onSave}>
        Save
      </button>

      <button className="btn btn-secondary btn-sm" onClick={onClear}>
        Clear
      </button>

      <span className="filter-stats">
        {filteredCount === totalCount
          ? `${totalCount} packets`
          : `${filteredCount} / ${totalCount} packets`}
      </span>

      {expanded && hiddenOpcodes.size > 0 && (
        <div className="hidden-opcodes-panel">
          <div className="hidden-opcodes-panel-header">
            <span>Hidden Packets ({hiddenOpcodes.size})</span>
            <button
              className="btn btn-link btn-xs"
              onClick={onClearHiddenOpcodes}
            >
              Clear All
            </button>
          </div>
          <div className="opcode-chips">
            {Array.from(hiddenOpcodes).map((opcode) => {
              const name = opcodeNameMap.get(opcode) || `0x${opcode.toString(16).toUpperCase().padStart(4, "0")}`;
              return (
                <div key={opcode} className="opcode-chip">
                  <span>{name}</span>
                  <button
                    className="opcode-chip-remove"
                    onClick={() => onToggleHiddenOpcode(opcode)}
                    title="Unhide this packet type"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
