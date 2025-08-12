const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require("electron");
const path = require("path");
const express = require("express");
const os = require("os");
const fs = require("fs");
const { globalShortcut } = require("electron");



let mainWindow;
let currentVideoPath = null;
let server = null;
let connections = new Set();

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let name in interfaces) {
        for (let iface of interfaces[name]) {
            if (
                iface.family === 'IPv4' &&
                !iface.internal &&
                iface.address.startsWith('192.168.0.')
            ) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreenable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, "public", "electron-ui", "index.html"));
    mainWindow.on("restore", () => {
        mainWindow.webContents.send("exit-pip");
    });

    mainWindow.on("focus", () => {
        mainWindow.webContents.send("exit-pip");
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    mainWindow.webContents.on("will-navigate", (event, url) => {
        if (url.startsWith("http")) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    const template = [
        {
            label: "Menu",
            submenu: [
                {
                    label: "Toggle Fullscreen",
                    accelerator: process.platform === "darwin" ? "Ctrl+Command+F" : "F11",
                    click: () => {
                        const isFullScreen = mainWindow.isFullScreen();
                        mainWindow.setFullScreen(!isFullScreen);
                    }
                },
                { type: "separator" },
                {
                    label: "About",
                    click: () => {
                        dialog.showMessageBox({
                            type: "info",
                            title: "About",
                            message: "NSSplayer\nVersion 1.0.0\nAuthor: Your Name",
                            buttons: ["OK"]
                        });
                    }
                },
                { type: "separator" },
                { label: "Quit", role: "quit" },
                { role: "reload" },
                { role: "forcereload" },
                { role: "toggledevtools" }
            ]
        }
    ];



    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow).then(() => {
    globalShortcut.register("Escape", () => {
        if (mainWindow && mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
    });
});

ipcMain.on("minimize-main-window", () => {
    if (mainWindow && !mainWindow.isMinimized()) {
        mainWindow.minimize();
    }
});

ipcMain.on("restore-main-window", () => {
    if (mainWindow && mainWindow.isMinimized()) {
        mainWindow.restore();
        mainWindow.focus();
    } else if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
});

// =====================================

ipcMain.handle("select-video", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        filters: [{ name: "Video", extensions: ["mp4", "webm", "ogg"] }],
        properties: ["openFile"],
    });
    if (canceled) return null;
    currentVideoPath = filePaths[0];
    console.log("Choose video:", currentVideoPath);
    return filePaths[0];
});

ipcMain.handle("start-sharing", async () => {
    console.log("Запрос на старт шаринга");

    if (!currentVideoPath) {
        console.log("Video not choosing");
        return { success: false, message: "First select a video" };
    }

    if (server) {
        console.log("Сервер уже работает");
        return { success: true, url: `http://${getLocalIP()}:3000/video` };
    }

    const appExpress = express();

    appExpress.get("/video", (req, res) => {
        const range = req.headers.range;

        if (!range) {
            return res.send(`
                <html>
                <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:black;">
                    <video src="/stream" controls autoplay style="width:100%;height:auto;"></video>
                </body>
                </html>
            `);
        }

        const videoSize = fs.statSync(currentVideoPath).size;
        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };

        res.writeHead(206, headers);
        const stream = fs.createReadStream(currentVideoPath, { start, end });
        stream.pipe(res);
    });

    appExpress.get("/fullvideo", (req, res) => {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Content-Disposition", "inline");
        fs.createReadStream(currentVideoPath).pipe(res);
    });

    appExpress.get("/stream", (req, res) => {
        const range = req.headers.range;
        if (!range) {
            return res.status(400).send("Requires Range header");
        }

        const videoSize = fs.statSync(currentVideoPath).size;
        const CHUNK_SIZE = 10 ** 6;
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };

        res.writeHead(206, headers);
        fs.createReadStream(currentVideoPath, { start, end }).pipe(res);
    });

    try {
        server = appExpress.listen(3000, () => {
            const url = `http://${getLocalIP()}:3000/video`;
            console.log(`Видео доступно по адресу: ${url}`);
        });

        server.on('connection', (conn) => {
            connections.add(conn);
            conn.on('close', () => connections.delete(conn));
        });
    } catch (err) {
        console.error("Ошибка при запуске сервера:", err);
        return { success: false, message: "Ошибка при запуске сервера" };
    }

    return { success: true, url: `http://${getLocalIP()}:3000/video` };
});

ipcMain.handle("stop-sharing", async () => {
    console.log("Запрос на остановку шаринга");

    if (server) {
        try {
            for (const conn of connections) {
                conn.destroy();
            }
            connections.clear();

            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            server = null;
            return { success: true };
        } catch (err) {
            console.error("Error while stopping the server:", err);
            return { success: false, message: "Failed to stop the server" };
        }
    } else {
        console.log("The server was not started");
        return { success: false, message: "The server is not running" };
    }
});



app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});