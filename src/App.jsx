import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { QRCodeSVG } from "qrcode.react";
import { setVideoPath } from "./store/settingsSlice";
import VideoPlayer from "./components/VideoPlayer";
import SettingsPanel from "./components/SettingsPanel";

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
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [ignoreHoverUntilLeave, setIgnoreHoverUntilLeave] = useState(false);

    // NEW: flip state
    const [isFlipped, setIsFlipped] = useState(false);

    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration || 0);
            setCurrentTime(0); // Сбрасываем время при загрузке нового видео
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        };
    }, [videoPath]); // Зависит от videoPath, чтобы сработать при смене видео

    // Автоскрытие панели

    useEffect(() => {
        let hideButtonTimer = null;
        let hidePanelTimer = null;

        const handleMouseMove = (e) => {
            const panel = document.getElementById("settings-panel");
            const settingsBtn = document.getElementById("settings-btn");

            setShowSettingsButton(true);
            if (hideButtonTimer) clearTimeout(hideButtonTimer);

            if (settingsBtn) {
                const btnRect = settingsBtn.getBoundingClientRect();
                const overBtn =
                    e.clientX >= btnRect.left &&
                    e.clientX <= btnRect.right &&
                    e.clientY >= btnRect.top &&
                    e.clientY <= btnRect.bottom;

                if (overBtn) {
                    // Если после клика на кнопку игнорируем наведение
                    if (!ignoreHoverUntilLeave) {
                        setIsPanelOpen(true);
                    }
                    return;
                }
            }

            if (!isPanelOpen) {
                hideButtonTimer = setTimeout(() => setShowSettingsButton(false), 2000);
            }

            if (isPanelOpen && panel) {
                const rect = panel.getBoundingClientRect();
                const inside =
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom;

                if (inside) {
                    if (hidePanelTimer) {
                        clearTimeout(hidePanelTimer);
                        hidePanelTimer = null;
                    }
                } else if (!hidePanelTimer) {
                    hidePanelTimer = setTimeout(() => {
                        setIsPanelOpen(false);
                        setTimeout(() => setShowSettingsButton(false), 1000);
                    }, 3000);
                }
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (hideButtonTimer) clearTimeout(hideButtonTimer);
            if (hidePanelTimer) clearTimeout(hidePanelTimer);
        };
    }, [isPanelOpen, ignoreHoverUntilLeave]);

    // PiP события
    useEffect(() => {
        const handleLeavePiP = () => window.electronAPI.restoreMainWindow();
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

    // Создание AudioContext при смене видео
    useEffect(() => {
        if (!videoPath || !videoRef.current) return;

        // Закрываем старый
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();

        const source = audioContextRef.current.createMediaElementSource(videoRef.current);
        source.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = volume / 100;

        // Восстанавливаем скорость после смены видео
        videoRef.current.playbackRate = playbackRate;

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
                gainNodeRef.current = null;
            }
        };
    }, [videoPath]);

    const openFile = async () => {
        if (audioContextRef.current) {
            try {
                await audioContextRef.current.close();
            } catch { /* ignore */ }
            audioContextRef.current = null;
            gainNodeRef.current = null;
        }

        const file = await window.electronAPI.selectVideo();
        if (file) {
            dispatch(setVideoPath(file));
            setShareURL(null);
            setIsSharing(false);
        }
    };
    const handleProgressChange = (e) => {
        const newTime = (parseFloat(e.target.value) / 100) * duration;
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        }
    };
    const toggleSharing = async () => {
        if (!isSharing) {
            const result = await window.electronAPI.startSharing();
            if (result.success) {
                setShareURL(result.url);
                setIsSharing(true);
            }
        } else {
            const result = await window.electronAPI.stopSharing();
            if (result.success) {
                setShareURL(null);
                setIsSharing(false);
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

    // NEW: flip handler
    const handleFlipChange = (e) => {
        setIsFlipped(e.target.checked);
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
            <VideoPlayer
                key={videoPath} // ← пересоздаёт элемент при смене файла
                videoPath={videoPath}
                videoRef={videoRef}
                onPlay={() => {
                    if (audioContextRef.current?.state === "suspended") {
                        audioContextRef.current.resume();
                    }
                }}
                onOpenFile={openFile}
                isFlipped={isFlipped}
                currentTime={currentTime}
                duration={duration}
                progress={(currentTime / duration) * 100 || 0}
                onProgressChange={handleProgressChange}
                onVolumeChange={handleVolumeChange}
                volume={volume}
                isPlaying={!videoRef.current?.paused}
                togglePlay={() =>
                    videoRef.current?.paused
                        ? videoRef.current.play()
                        : videoRef.current.pause()
                }
            />


            {showSettingsButton && (
                <button
                    id="settings-btn"
                    onClick={() => {
                        if (isPanelOpen) {
                            setIsPanelOpen(false);
                            setIgnoreHoverUntilLeave(true); // включаем блокировку автопоказа
                        } else {
                            setIsPanelOpen(true);
                        }
                    }}
                    onMouseLeave={() => {
                        // Когда мышь покинула кнопку — снова разрешаем автопоказ
                        if (ignoreHoverUntilLeave) {
                            setIgnoreHoverUntilLeave(false);
                        }
                    }}
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

            <SettingsPanel
                isPanelOpen={isPanelOpen}
                volume={volume}
                playbackRate={playbackRate}
                isSharing={isSharing}
                shareURL={shareURL}
                onVolumeChange={handleVolumeChange}
                onSpeedChange={handleSpeedChange}
                onOpenFile={openFile}
                onToggleSharing={toggleSharing}
                onPiP={handlePiP}
                isFlipped={isFlipped}           // <-- pass flip state
                onFlipChange={handleFlipChange} // <-- pass handler
            />
        </div>
    );
}
