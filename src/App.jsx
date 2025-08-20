import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setVideoPath } from "./store/settingsSlice";
import VideoPlayer from "./components/VideoPlayer";
import SettingsPanel from "./components/SettingsPanel";
import useMouseVisibility from "./hooks/useMouseVisibility";
import { electronService } from './services/electronService';


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
    const [ignoreHoverUntilLeave, setIgnoreHoverUntilLeave] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    const videoRef = useRef(null);

    const isMouseVisible = useMouseVisibility(3000);

    React.useEffect(() => {
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

    const openFile = async () => {
        const file = await electronService.selectVideo();
        if (!file) return;

        const vid = videoRef.current;
        if (vid) {
            vid.pause();

            vid.removeAttribute("src");
            vid.load();
        }

        dispatch(setVideoPath(file));
        setShareURL(null);
        setIsSharing(false);
    };

    const toggleSharing = async () => {
        if (!isSharing) {
            const result = await electronService.startSharing();
            if (result.success) {
                setShareURL(result.url);
                setIsSharing(true);
            }
        } else {
            const result = await electronService.stopSharing();
            if (result.success) {
                setShareURL(null);
                setIsSharing(false);
            }
        }
    };

    const handleSpeedChange = (e) => {
        const newRate = parseFloat(e.target.value);
        setPlaybackRate(newRate);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseInt(e.target.value, 10);
        setVolume(newVolume);
    };

    const handlePiP = async () => {
        try {
            if (!videoRef.current) return;
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                electronService.restoreMainWindow();
            } else {
                await videoRef.current.requestPictureInPicture();
                electronService.minimizeMainWindow();
            }
        } catch (err) {
            console.error("PiP error:", err);
        }
    };

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
                overflow: "hidden",
                cursor: isMouseVisible ? "default" : "none"
            }}
        >
            <VideoPlayer
                key={videoPath}
                videoPath={videoPath}
                videoRef={videoRef}
                onOpenFile={openFile}
                isFlipped={isFlipped}
                volume={volume}
                onVolumeChange={handleVolumeChange}
                playbackRate={playbackRate}
            />

            {showSettingsButton && (
                <button
                    id="settings-btn"
                    onClick={() => {
                        if (isPanelOpen) {
                            setIsPanelOpen(false);
                            setIgnoreHoverUntilLeave(true);
                        } else {
                            setIsPanelOpen(true);
                        }
                    }}
                    onMouseLeave={() => {
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
                isFlipped={isFlipped}
                onFlipChange={handleFlipChange}
            />
        </div>
    );
}
