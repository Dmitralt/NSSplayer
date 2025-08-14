export const styles = {
    container: {
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#fff",
        overflow: "hidden"
    },
    video: (isFlipped) => ({
        width: "100%",
        height: "100%",
        objectFit: "contain",
        transform: isFlipped ? "scaleX(-1)" : "none",
        transformOrigin: "center",
        backgroundColor: "#000"
    }),
    controlsContainer: (showControls) => ({
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        padding: "10px",
        display: showControls ? "flex" : "none",
        flexDirection: "column",
        gap: "6px",
        zIndex: 1000,
        transition: "opacity 0.3s ease"
    }),
    button: {
        background: "transparent",
        color: "#fff",
        fontSize: "18px",
        border: "none",
        cursor: "pointer"
    },
    range: {
        width: "100%",
        accentColor: "#fff",
        cursor: "pointer"
    }
};
