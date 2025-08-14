import React, { useRef, useState, useEffect } from "react";

export default function VideoPlayer({
    videoPath,
    videoRef,
    onPlay,
    onOpenFile,
    isFlipped,
    currentTime,
    duration,
    progress,
    onProgressChange,
    volume,
    onVolumeChange,
    isPlaying,
    togglePlay
}) {
    const containerRef = useRef(null);
    const [showControls, setShowControls] = useState(true);
    const hideTimerRef = useRef(null);
    const seekIntervalRef = useRef(null);

    const formatTime = (time) => {
        if (!isFinite(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    // Автоскрытие панели
    useEffect(() => {
        const resetHideTimer = () => {
            setShowControls(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setShowControls(false), 2000);
        };

        window.addEventListener("mousemove", resetHideTimer);
        window.addEventListener("keydown", resetHideTimer);

        resetHideTimer();
        return () => {
            window.removeEventListener("mousemove", resetHideTimer);
            window.removeEventListener("keydown", resetHideTimer);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    // Горячие клавиши
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        const handleKeyDown = (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                togglePlay();
            }
            if (e.code === "ArrowRight") {
                e.preventDefault();
                // быстрый прыжок
                vid.currentTime = Math.min(vid.duration, vid.currentTime + 10);

                // если зажали — запускаем интервал перемотки
                if (!seekIntervalRef.current) {
                    seekIntervalRef.current = setInterval(() => {
                        vid.currentTime = Math.min(vid.duration, vid.currentTime + 2);
                    }, 100);
                }
            }
            if (e.code === "ArrowLeft") {
                e.preventDefault();
                vid.currentTime = Math.max(0, vid.currentTime - 10);
                if (!seekIntervalRef.current) {
                    seekIntervalRef.current = setInterval(() => {
                        vid.currentTime = Math.max(0, vid.currentTime - 2);
                    }, 100);
                }
            }
            if (e.code === "ArrowUp") {
                e.preventDefault();
                const newVol = Math.min(100, volume + 5);
                onVolumeChange({ target: { value: newVol } });
            }
            if (e.code === "ArrowDown") {
                e.preventDefault();
                const newVol = Math.max(0, volume - 5);
                onVolumeChange({ target: { value: newVol } });
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
                if (seekIntervalRef.current) {
                    clearInterval(seekIntervalRef.current);
                    seekIntervalRef.current = null;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            if (seekIntervalRef.current) clearInterval(seekIntervalRef.current);
        };
    }, [videoRef, togglePlay, volume, onVolumeChange]);

    if (!videoPath) {
        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#000",
                    flexDirection: "column",
                    gap: "1rem",
                    backgroundColor: "#fff"
                }}
            >
                <span>Select video...</span>
                <button onClick={onOpenFile}>Open video</button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: "#fff",
                overflow: "hidden"
            }}
        >
            <video
                ref={videoRef}
                src={`file://${videoPath}`}
                autoPlay
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: isFlipped ? "scaleX(-1)" : "none",
                    transformOrigin: "center",
                    backgroundColor: "#000"
                }}
                onPlay={() => onPlay?.()}
            />

            {/* Панель управления */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    padding: "10px",
                    display: showControls ? "flex" : "none",
                    flexDirection: "column",
                    gap: "6px",
                    zIndex: 1000,
                    transition: "opacity 0.3s ease"
                }}
            >
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={onProgressChange}
                    style={{
                        width: "100%",
                        accentColor: "#fff",
                        cursor: "pointer"
                    }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#fff" }}>
                    <button
                        onClick={togglePlay}
                        style={{
                            background: "transparent",
                            color: "#fff",
                            fontSize: "18px",
                            border: "none",
                            cursor: "pointer"
                        }}
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>

                    <span style={{ fontFamily: "monospace" }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={volume}
                        onChange={onVolumeChange}
                        style={{
                            width: "100px",
                            accentColor: "#fff",
                            cursor: "pointer"
                        }}
                    />

                    <button
                        onClick={() => window.electronAPI.toggleFullScreen()}
                        style={{
                            background: "transparent",
                            color: "#fff",
                            fontSize: "18px",
                            border: "none",
                            cursor: "pointer"
                        }}
                    >
                        ⛶
                    </button>
                </div>
            </div>
        </div>
    );
}
