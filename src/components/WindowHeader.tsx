import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect } from "react";

export default function WindowHeader() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    async function checkMaximized() {
      const appWindow = getCurrentWindow();
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    }
    checkMaximized();
  }, []);

  async function handleMinimize() {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  }

  async function handleMaximize() {
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
    const maximized = await appWindow.isMaximized();
    setIsMaximized(maximized);
  }

  async function handleClose() {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  }

  async function handleDragStart() {
    const appWindow = getCurrentWindow();
    await appWindow.startDragging();
  }

  return (
    <div className="window-header" onMouseDown={handleDragStart}>
      <div className="window-title">
        WoW Packet Analyzer
      </div>
      <div className="window-controls" onMouseDown={(e) => e.stopPropagation()}>
        <button
          className="window-control-btn minimize"
          onClick={handleMinimize}
          title="Minimize"
          aria-label="Minimize window"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="0" y="5" width="12" height="2" />
          </svg>
        </button>
        <button
          className="window-control-btn maximize"
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="0" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <rect x="0" y="2" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="0" y="0" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>
        <button
          className="window-control-btn close"
          onClick={handleClose}
          title="Close"
          aria-label="Close window"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="0" y1="0" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="0" x2="0" y2="12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
