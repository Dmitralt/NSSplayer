import { useEffect, useRef, useState } from "react";

export default function useMouseVisibility(timeoutMs = 3000) {
    const [isMouseVisible, setIsMouseVisible] = useState(true);
    const timerRef = useRef(null);

    useEffect(() => {
        const showAndScheduleHide = () => {
            setIsMouseVisible(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setIsMouseVisible(false);
            }, timeoutMs);
        };

        const events = ["mousemove", "mousedown", "touchstart"];
        events.forEach(ev => window.addEventListener(ev, showAndScheduleHide));

        showAndScheduleHide();

        return () => {
            events.forEach(ev => window.removeEventListener(ev, showAndScheduleHide));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timeoutMs]);

    return isMouseVisible;
}
