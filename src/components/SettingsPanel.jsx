import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function SettingsPanel({
    isPanelOpen,
    volume,
    playbackRate,
    isSharing,
    shareURL,
    onVolumeChange,
    onSpeedChange,
    onOpenFile,
    onToggleSharing,
    onPiP,
    isFlipped,
    onFlipChange
}) {
    return (
        <div
            id="settings-panel"
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                height: "100%",
                width: 300,
                backgroundColor: "rgba(34,34,34,0.95)",
                color: "#fff",
                boxShadow: "-4px 0 10px rgba(0,0,0,0.3)",
                padding: 20,
                transform: isPanelOpen ? "translateX(0)" : "translateX(100%)",
                transition: "transform 0.3s ease",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                overflowY: "auto",
                boxSizing: "border-box"
            }}
        >
            <h2>Settings</h2>

            <div>
                <label>Volume: {volume}%</label>
                <input
                    type="range"
                    min="0"
                    max="500"
                    step="1"
                    value={volume}
                    onChange={onVolumeChange}
                    style={{ width: "100%" }}
                />
            </div>

            <button onClick={onOpenFile}>Open video</button>
            <button onClick={onToggleSharing}>
                {isSharing ? "Stop Sharing" : "Start Sharing"}
            </button>

            {shareURL && (
                <div>
                    <p>Link:</p>
                    <a
                        href={shareURL}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#4af" }}
                    >
                        {shareURL}
                    </a>
                    <QRCodeSVG value={shareURL} />
                </div>
            )}

            <div>
                <label>Speed: {playbackRate}x</label>
                <input
                    type="range"
                    min="0.25"
                    max="8"
                    step="0.25"
                    value={playbackRate}
                    onChange={onSpeedChange}
                    style={{ width: "100%" }}
                />
            </div>

            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={!!isFlipped}
                        onChange={onFlipChange}
                    />{" "}
                    Flip horizontally
                </label>
            </div>

            <button onClick={onPiP}>Picture in Picture</button>
            <button onClick={() => window.electronAPI.toggleFullScreen()}>
                Toggle Fullscreen
            </button>
        </div>
    );
}
