export const electronService = {
    selectVideo: () => window.electronAPI.selectVideo(),
    startSharing: () => window.electronAPI.startSharing(),
    stopSharing: () => window.electronAPI.stopSharing(),
    toggleFullScreen: () => window.electronAPI.toggleFullScreen(),
    minimizeMainWindow: () => window.electronAPI.minimizeMainWindow(),
    restoreMainWindow: () => window.electronAPI.restoreMainWindow(),
    minimizeSecondWindow: () => window.electronAPI.minimizeSecondWindow(),
    restoreSecondWindow: () => window.electronAPI.restoreSecondWindow(),
};
