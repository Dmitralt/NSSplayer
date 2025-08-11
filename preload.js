const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    selectVideo: () => ipcRenderer.invoke("select-video"),
    startSharing: () => ipcRenderer.invoke("start-sharing"),
    stopSharing: () => ipcRenderer.invoke("stop-sharing"),
    minimizeMainWindow: () => ipcRenderer.send("minimize-main-window"),
    restoreMainWindow: () => ipcRenderer.send("restore-main-window"),
    onExitPiP: (callback) => ipcRenderer.on("exit-pip", callback),
    removeExitPiP: (callback) => ipcRenderer.removeListener("exit-pip", callback)
});