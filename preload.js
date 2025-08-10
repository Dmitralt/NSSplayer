const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    selectVideo: () => ipcRenderer.invoke("select-video"),
    startSharing: () => ipcRenderer.invoke("start-sharing"),
    stopSharing: () => ipcRenderer.invoke("stop-sharing"),
});
