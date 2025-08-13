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
    const btnStyle = {
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.3)",
        padding: "8px 12px",
        borderRadius: 4,
        cursor: "pointer",
        transition: "background 0.2s ease, border 0.2s ease, box-shadow 0.2s ease",
        fontSize: 14
    };

    const btnHoverStyle = {
        background: "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
    };

    return (
        <div
            id="settings-panel"
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                height: "100%",
                width: 300,
                backgroundColor: "rgba(34,34,34,0.6)", // полупрозрачная панель
                backdropFilter: "blur(6px)",
                color: "#fff",
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
            <h2 style={{
                margin: 0,
                padding: "0 0 10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.2)"
            }}>
                Settings
            </h2>

            <div>
                <label style={{ display: "block", marginBottom: 4 }}>Volume: {volume}%</label>
                <input
                    type="range"
                    min="0"
                    max="500"
                    step="1"
                    value={volume}
                    onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        // Магнит на 100 ±3
                        if (Math.abs(val - 100) <= 3) {
                            val = 100;
                        }
                        onVolumeChange({ target: { value: val } });
                    }}
                    style={{
                        width: "100%",
                        accentColor: "#fff",
                        background: "rgba(255,255,255,0.1)",
                        height: 4,
                        borderRadius: 2,
                        cursor: "pointer"
                    }}
                />

            </div>

            <button
                style={btnStyle}
                onMouseEnter={e => Object.assign(e.target.style, btnHoverStyle)}
                onMouseLeave={e => Object.assign(e.target.style, btnStyle)}
                onClick={onOpenFile}
            >
                Open video
            </button>

            <button
                style={btnStyle}
                onMouseEnter={e => Object.assign(e.target.style, btnHoverStyle)}
                onMouseLeave={e => Object.assign(e.target.style, btnStyle)}
                onClick={onToggleSharing}
            >
                {isSharing ? "Stop Sharing" : "Start Sharing"}
            </button>

            {shareURL && (
                <div
                    style={{
                        padding: 10,
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: 6
                    }}
                >
                    <p style={{ margin: 0 }}>Link:</p>
                    <a
                        href={shareURL}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#4af", textDecoration: "underline" }}
                    >
                        {shareURL}
                    </a>
                    <QRCodeSVG value={shareURL} />
                </div>
            )}

            <div>
                <label style={{ display: "block", marginBottom: 4 }}>
                    Speed: {playbackRate}x
                </label>
                <input
                    type="range"
                    min="0.25"
                    max="8"
                    step="0.25"
                    value={playbackRate}
                    onChange={onSpeedChange}
                    style={{
                        width: "100%",
                        accentColor: "#fff",
                        background: "rgba(255,255,255,0.1)",
                        height: 4,
                        borderRadius: 2,
                        cursor: "pointer"
                    }}
                />
            </div>

            <div>
                <label style={{ cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={!!isFlipped}
                        onChange={onFlipChange}
                        style={{
                            marginRight: 6,
                            accentColor: "#fff"
                        }}
                    />
                    Flip horizontally
                </label>
            </div>

            <button
                style={btnStyle}
                onMouseEnter={e => Object.assign(e.target.style, btnHoverStyle)}
                onMouseLeave={e => Object.assign(e.target.style, btnStyle)}
                onClick={onPiP}
            >
                Picture in Picture
            </button>

            <button
                style={btnStyle}
                onMouseEnter={e => Object.assign(e.target.style, btnHoverStyle)}
                onMouseLeave={e => Object.assign(e.target.style, btnStyle)}
                onClick={() => window.electronAPI.toggleFullScreen()}
            >
                Toggle Fullscreen
            </button>
        </div>
    );
}
