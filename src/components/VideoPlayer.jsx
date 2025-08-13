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

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (time) => {
        if (!isFinite(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    // Автоскрытие панели при бездействии
    useEffect(() => {
        const resetHideTimer = () => {
            setShowControls(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener("mousemove", resetHideTimer);
        window.addEventListener("keydown", resetHideTimer);

        resetHideTimer(); // показать при монтировании

        return () => {
            window.removeEventListener("mousemove", resetHideTimer);
            window.removeEventListener("keydown", resetHideTimer);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

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
                    backgroundColor: "#ffffffff"
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
                backgroundColor: "#fff", // светлый фон при старте
                overflow: "hidden"
            }}
        >
            {/* Видео */}
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
                    backgroundColor: "#000" // при воспроизведении чёрный фон вокруг видео
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
                    background: "rgba(0,0,0,0.0)", // полупрозрачный тёмный фон
                    display: showControls ? "flex" : "none",
                    flexDirection: "column",
                    gap: "6px",
                    boxSizing: "border-box",
                    zIndex: 1000,
                    //backdropFilter: "blur(6px)", // лёгкий блюр для читаемости
                    transition: "opacity 0.3s ease"
                }}
            >
                {/* Прогресс */}
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

                {/* Кнопки */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "#fff"
                    }}
                >
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
