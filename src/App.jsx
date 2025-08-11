import React, { useState, useEffect, useRef } from "react";
import SettingsPanel from "./components/SettingsPanel";
import { useSelector, useDispatch } from "react-redux";
import { QRCodeSVG } from "qrcode.react";
import { setVideoPath } from "./store/settingsSlice";

export default function App() {
    const dispatch = useDispatch();
    const videoPath = useSelector(state => state.settings.videoPath);
    const backgroundColor = useSelector(state => state.settings.backgroundColor);

    const [shareURL, setShareURL] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [showSettingsButton, setShowSettingsButton] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(100);

    const hideTimerRef = useRef(null);
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);

    useEffect(() => {
        const handleLeavePiP = () => {
            window.electronAPI.restoreMainWindow();
        };
        const handleExitPiPFromMain = async () => {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            }
        };
        if (videoRef.current) {
            videoRef.current.addEventListener("leavepictureinpicture", handleLeavePiP);
        }
        window.electronAPI.onExitPiP(handleExitPiPFromMain);
        return () => {
            if (videoRef.current) {
                videoRef.current.removeEventListener("leavepictureinpicture", handleLeavePiP);
            }
            window.electronAPI.removeExitPiP(handleExitPiPFromMain);
        };
    }, []);
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.addEventListener("leavepictureinpicture", () => {
            window.electronAPI.restoreMainWindow();
        });

        return () => {
            video.removeEventListener("leavepictureinpicture", () => {
                window.electronAPI.restoreMainWindow();
            });
        };
    }, []);

    useEffect(() => {
        const handleMouseMove = () => {
            if (!isPanelOpen) {
                setShowSettingsButton(true);
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                hideTimerRef.current = setTimeout(() => {
                    setShowSettingsButton(false);
                }, 3000);
            }
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [isPanelOpen]);

    const openFile = async () => {
        const file = await window.electronAPI.selectVideo();
        if (file) {
            dispatch(setVideoPath(file));
            setShareURL(null);
            setIsSharing(false);
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
            const result = await window.electronAPI.stopSharing();
            if (result.success) {
                setShareURL(null);
                setIsSharing(false);
            } else {
                alert(result.message);
            }
        }
    };

    const handleSpeedChange = (e) => {
        const newRate = parseFloat(e.target.value);
        setPlaybackRate(newRate);
        if (videoRef.current) {
            videoRef.current.playbackRate = newRate;
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseInt(e.target.value, 10);
        setVolume(newVolume);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = newVolume / 100;
        }
    };

    useEffect(() => {
        if (!videoPath || !videoRef.current) return;

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContextRef.current.createMediaElementSource(videoRef.current);
        gainNodeRef.current = audioContextRef.current.createGain();
        source.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = volume / 100;

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
                gainNodeRef.current = null;
            }
        };
    }, [videoPath]);

    const handlePiP = async () => {
        try {
            if (!videoRef.current) return;
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                window.electronAPI.restoreMainWindow();
            } else {
                await videoRef.current.requestPictureInPicture();
                window.electronAPI.minimizeMainWindow();
            }
        } catch (err) {
            console.error("PiP error:", err);
        }
    };

    return (
        <div
            style={{
                backgroundColor,
                position: "relative",
                width: "100vw",
                height: "100vh",
                overflow: "hidden"
            }}
        >
            {videoPath ? (
                <video
                    ref={videoRef}
                    src={`file://${videoPath}`}
                    controls
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        backgroundColor: "#000",
                        zIndex: 0
                    }}
                    onPlay={() => {
                        if (audioContextRef.current?.state === "suspended") {
                            audioContextRef.current.resume();
                        }
                    }}
                />
            ) : (
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
                        color: "#aaa"
                    }}
                >
                    Select video...
                    <button onClick={openFile}>Open video</button>
                </div>
            )}

            {showSettingsButton && (
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        zIndex: 1100,
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    {isPanelOpen ? "→" : "☰"}
                </button>
            )}

            <div
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
                        onChange={handleVolumeChange}
                        style={{ width: "100%" }}
                    />
                </div>

                <button onClick={openFile}>Open video</button>
                <button onClick={toggleSharing}>
                    {isSharing ? "Stop Sharing" : "start sharing"}
                </button>
                {shareURL && (
                    <div>
                        <p>Link:</p>
                        <a href={shareURL} target="_blank" rel="noreferrer" style={{ color: "#4af" }}>
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
                        onChange={handleSpeedChange}
                        style={{ width: "100%" }}
                    />
                </div>

                <button onClick={handlePiP}>Picture in Picture</button>


                {/* <SettingsPanel /> */}
            </div>
        </div>
    );
}
