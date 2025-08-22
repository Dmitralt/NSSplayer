import React, { useRef, useState, useEffect } from "react";
import { electronService } from "../services/electronService";
import { useAutoHideControls } from "../hooks/useAutoHideControls";
import { useWebAudio } from "../hooks/useWebAudio";


export default function VideoPlayer({
    videoPath,
    videoRef,
    onOpenFile,
    isFlipped,
    volume,
    onVolumeChange,
    playbackRate
}) {
    const containerRef = useRef(null);
    const hideTimerRef = useRef(null);
    const seekIntervalRef = useRef(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const formatTime = (time) => {
        if (!isFinite(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };


    const { audioContextRef, gainNodeRef } = useWebAudio(videoRef, videoPath, volume, playbackRate);
    const { showControls } = useAutoHideControls(2000);

    // timeupdate / metadata / play / pause
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        const onTimeUpdate = () => setCurrentTime(vid.currentTime || 0);
        const onLoadedMeta = () => {
            setDuration(vid.duration || 0);
            setCurrentTime(0);
        };
        const onPlayEvt = async () => {
            if (audioContextRef.current?.state === "suspended") {
                try { await audioContextRef.current.resume(); } catch (e) { /* ignore */ }
            }
            setIsPlaying(true);
        };
        const onPauseEvt = () => setIsPlaying(false);

        vid.addEventListener("timeupdate", onTimeUpdate);
        vid.addEventListener("loadedmetadata", onLoadedMeta);
        vid.addEventListener("play", onPlayEvt);
        vid.addEventListener("pause", onPauseEvt);

        if (isFinite(vid.duration)) {
            setDuration(vid.duration || 0);
        }
        setIsPlaying(!vid.paused);

        return () => {
            vid.removeEventListener("timeupdate", onTimeUpdate);
            vid.removeEventListener("loadedmetadata", onLoadedMeta);
            vid.removeEventListener("play", onPlayEvt);
            vid.removeEventListener("pause", onPauseEvt);
        };
    }, [videoPath, videoRef]);

    // keyboard
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        const handleKeyDown = (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                vid.paused ? vid.play() : vid.pause();
            }
            if (e.code === "ArrowRight") {
                e.preventDefault();
                vid.currentTime = Math.min(vid.duration || 0, (vid.currentTime || 0) + 10);
                if (!seekIntervalRef.current) {
                    seekIntervalRef.current = setInterval(() => {
                        vid.currentTime = Math.min(vid.duration || 0, (vid.currentTime || 0) + 2);
                    }, 100);
                }
            }
            if (e.code === "ArrowLeft") {
                e.preventDefault();
                vid.currentTime = Math.max(0, (vid.currentTime || 0) - 10);
                if (!seekIntervalRef.current) {
                    seekIntervalRef.current = setInterval(() => {
                        vid.currentTime = Math.max(0, (vid.currentTime || 0) - 2);
                    }, 100);
                }
            }
            if (e.code === "ArrowUp") {
                e.preventDefault();
                onVolumeChange({ target: { value: Math.min(100, volume + 5) } });
            }
            if (e.code === "ArrowDown") {
                e.preventDefault();
                onVolumeChange({ target: { value: Math.max(0, volume - 5) } });
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
    }, [videoRef, volume, onVolumeChange]);

    // PiP и electronService
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        const handleLeavePiP = () => electronService.restoreMainWindow();
        const handleExitPiPFromMain = async () => {
            if (document.pictureInPictureElement) {
                try { await document.exitPictureInPicture(); } catch (e) { /* ignore */ }
            }
        };

        vid.addEventListener("leavepictureinpicture", handleLeavePiP);
        if (window.electronAPI?.onExitPiP) {
            window.electronAPI.onExitPiP(handleExitPiPFromMain);
        }

        return () => {
            vid.removeEventListener("leavepictureinpicture", handleLeavePiP);
            if (window.electronAPI?.removeExitPiP) {
                window.electronAPI.removeExitPiP(handleExitPiPFromMain);
            }
        };
    }, [videoRef, videoPath]);

    const togglePlay = () => {
        const vid = videoRef.current;
        if (!vid) return;
        vid.paused ? vid.play() : vid.pause();
    };

    const handleProgressChange = (e) => {
        const newTime = (parseFloat(e.target.value) / 100) * (duration || 0);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        }
    };

    if (!videoPath) {
        return (
            <div style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                display: "flex", justifyContent: "center", alignItems: "center",
                color: "#000", flexDirection: "column", gap: "1rem", backgroundColor: "#fff"
            }}>
                <span>Select video...</span>
                <button onClick={onOpenFile}>Open video</button>
            </div>
        );
    }

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div ref={containerRef} style={{
            position: "relative", width: "100%", height: "100%",
            backgroundColor: "#fff", overflow: "hidden"
        }}>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
                        backgroundColor: "#000",
                        cursor: "inherit"
                    }}
                />

                <div
                    onClick={togglePlay}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "auto", // или "none", если не нужно перехватывать клики
                        backgroundColor: "transparent",
                        zIndex: 10
                    }}
                >
                    {/* Тут можно разместить любые элементы: кнопки, тултипы, overlay UI */}
                </div>
            </div>


            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    padding: "10px",
                    display: "flex", // всегда flex
                    flexDirection: "column",
                    gap: "6px",
                    zIndex: 1000,
                    opacity: showControls ? 1 : 0,
                    transition: "opacity 0.3s ease, visibility 0.3s ease"
                }}
            >

                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={handleProgressChange}
                    style={{ width: "100%", accentColor: "#fff", cursor: "pointer" }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#fff" }}>
                    <button onClick={togglePlay} style={{
                        background: "transparent", color: "#fff",
                        fontSize: "18px", border: "none", cursor: "pointer"
                    }}>
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
                        style={{ width: "100px", accentColor: "#fff", cursor: "pointer" }}
                    />

                    <button onClick={() => electronService.toggleFullScreen()} style={{
                        background: "transparent", color: "#fff",
                        fontSize: "18px", border: "none", cursor: "pointer"
                    }}>
                        ⛶
                    </button>
                </div>
            </div>
        </div>
    );
}
