import { useState, useRef, useEffect } from "react";

export function useAutoHideControls(timeout = 2000) {
    const [showControls, setShowControls] = useState(true);
    const hideTimerRef = useRef(null);

    useEffect(() => {
        const resetHideTimer = () => {
            setShowControls(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setShowControls(false), timeout);
        };

        window.addEventListener("mousemove", resetHideTimer);
        window.addEventListener("keydown", resetHideTimer);

        resetHideTimer();

        return () => {
            window.removeEventListener("mousemove", resetHideTimer);
            window.removeEventListener("keydown", resetHideTimer);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [timeout]);

    return { showControls, setShowControls };
}
