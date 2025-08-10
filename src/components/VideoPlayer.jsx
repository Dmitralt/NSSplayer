import React from "react";
import { useSelector } from "react-redux";

export default function VideoPlayer() {
    const backgroundColor = useSelector(state => state.settings.backgroundColor);

    return (
        <div style={{ backgroundColor, height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <video
                src="http://localhost:3000/stream"
                controls
                autoPlay
                style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
        </div>
    );
}
