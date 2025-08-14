import { useEffect, useRef } from "react";

export function useWebAudio(videoRef, videoPath, volume, playbackRate) {
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);

    useEffect(() => {
        const vid = videoRef.current;
        if (!videoPath || !vid) return;

        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch { }
            audioContextRef.current = null;
            gainNodeRef.current = null;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        try {
            audioContextRef.current = new AudioCtx();
            gainNodeRef.current = audioContextRef.current.createGain();

            const source = audioContextRef.current.createMediaElementSource(vid);
            source.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioContextRef.current.destination);

            gainNodeRef.current.gain.value = (volume || 0) / 100;
        } catch (err) {
            console.warn("Failed to setup WebAudio for video:", err);
            audioContextRef.current = null;
            gainNodeRef.current = null;
        }

        if (typeof playbackRate === "number") {
            vid.playbackRate = playbackRate;
        }

        return () => {
            if (audioContextRef.current) {
                try { audioContextRef.current.close(); } catch { }
                audioContextRef.current = null;
                gainNodeRef.current = null;
            }
        };
    }, [videoPath]);

    useEffect(() => {
        if (gainNodeRef.current) {
            try {
                gainNodeRef.current.gain.value = (volume || 0) / 100;
            } catch { }
        }
    }, [volume]);

    useEffect(() => {
        const vid = videoRef.current;
        if (vid && typeof playbackRate === "number") {
            vid.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    return { audioContextRef, gainNodeRef };
}
