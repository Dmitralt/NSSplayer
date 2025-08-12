import { useEffect } from "react";

export default function usePiP(videoRef) {
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
    }, [videoRef]);
}
