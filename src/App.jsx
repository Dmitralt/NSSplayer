import React, { useState } from "react";
import SettingsPanel from "./components/SettingsPanel";
import { useSelector } from "react-redux";
import { QRCodeSVG } from 'qrcode.react';

export default function App() {
    const [videoPath, setVideoPath] = useState(null);
    const [shareURL, setShareURL] = useState(null);
    const [isSharing, setIsSharing] = useState(false); // 🔄 новое состояние

    const backgroundColor = useSelector(state => state.settings.backgroundColor);

    const openFile = async () => {
        const file = await window.electronAPI.selectVideo();
        if (file) {
            setVideoPath(file);
            setShareURL(null);
            setIsSharing(false); // сбрасываем шаринг при смене видео
        }
    };

    const toggleSharing = async () => {
        if (!isSharing) {
            const result = await window.electronAPI.startSharing();
            if (result.success) {
                setShareURL(result.url);
                setIsSharing(true);
            } else {
                alert(result.message);
            }
        } else {
            const result = await window.electronAPI.stopSharing(); // предполагаем, что такой метод есть
            if (result.success) {
                setShareURL(null);
                setIsSharing(false);
            } else {
                alert(result.message);
            }
        }
    };

    return (
        <div style={{ padding: 20, backgroundColor, minHeight: "100vh" }}>
            <SettingsPanel />
            <h1>Видеоплеер</h1>
            <button onClick={openFile}>Открыть видео</button>
            <button onClick={toggleSharing} style={{ marginLeft: 10 }}>
                {isSharing ? "Остановить шаринг" : "Шарить по локальной сети"}
            </button>

            {shareURL && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 16 }}>
                    <div>
                        <p>Ссылка для других устройств:</p>
                        <a href={shareURL} target="_blank" rel="noreferrer">
                            {shareURL}
                        </a>
                    </div>
                    <QRCodeSVG value={shareURL} />
                </div>
            )}

            {videoPath && (
                <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
                    <video
                        src={`file://${videoPath}`}
                        controls
                        style={{
                            width: "80%",
                            maxWidth: "720px",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            backgroundColor: "#000"
                        }}
                    />
                </div>
            )}
        </div>
    );
}
