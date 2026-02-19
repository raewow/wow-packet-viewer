import { useState, useRef, useEffect } from "react";

interface TabInfo {
  id: string;
  name: string;
  isDirty: boolean;
}

interface SessionTabsProps {
  sessions: TabInfo[];
  activeSessionId: string | null;
  onActivate: (id: string) => void;
  onCreate: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onSave: (id: string) => void;
  onOpen: () => void;
}

interface SingleTabProps {
  session: TabInfo;
  isActive: boolean;
  isOnly: boolean;
  onActivate: () => void;
  onClose: () => void;
  onRename: (newName: string) => void;
}

function SingleTab({ session, isActive, isOnly, onActivate, onClose, onRename }: SingleTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(session.name);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  return (
    <div
      className={`session-tab ${isActive ? "active" : ""}`}
      onClick={onActivate}
      title={session.name}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="tab-name-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="tab-name" onDoubleClick={startEditing}>
          {session.name}
          {session.isDirty && <span className="dirty-dot" title="Unsaved packets" />}
        </span>
      )}
      {!isOnly && (
        <button
          className="tab-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close session"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function SessionTabs({
  sessions,
  activeSessionId,
  onActivate,
  onCreate,
  onClose,
  onRename,
  onSave,
  onOpen,
}: SessionTabsProps) {
  return (
    <div className="session-tabs">
      <div className="session-tab-list">
        {sessions.map((s) => (
          <SingleTab
            key={s.id}
            session={s}
            isActive={s.id === activeSessionId}
            isOnly={sessions.length === 1}
            onActivate={() => onActivate(s.id)}
            onClose={() => onClose(s.id)}
            onRename={(newName) => onRename(s.id, newName)}
          />
        ))}
      </div>

      <div className="tab-actions">
        <button className="tab-action-btn" onClick={onCreate} title="New session">
          +
        </button>
        {activeSessionId && (
          <button
            className="tab-action-btn"
            onClick={() => onSave(activeSessionId)}
            title="Save session"
          >
            Save
          </button>
        )}
        <button className="tab-action-btn" onClick={onOpen} title="Open saved session">
          Open
        </button>
      </div>
    </div>
  );
}
