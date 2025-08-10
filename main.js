const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require("electron");
const path = require("path");
const express = require("express");
const os = require("os");
const fs = require("fs");

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
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, "public", "electron-ui", "index.html"));


    // Открывать внешние ссылки в браузере
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
    //mainWindow.setMenu(null);

    const template = [
        {
            label: "Моё меню",
            submenu: [
                {
                    label: "О программе",
                    click: () => {
                        const { dialog } = require("electron");
                        dialog.showMessageBox({
                            type: "info",
                            title: "О программе",
                            message: "NSSplayer\nВерсия 1.0.0\nАвтор: Ваше Имя",
                            buttons: ["OK"]
                        });
                    }
                },
                { type: "separator" },
                { label: "Выход", role: "quit" }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

ipcMain.handle("select-video", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        filters: [{ name: "Video", extensions: ["mp4", "webm", "ogg"] }],
        properties: ["openFile"],
    });
    if (canceled) return null;
    currentVideoPath = filePaths[0];
    console.log("Выбрано видео:", currentVideoPath);
    return filePaths[0];
});

ipcMain.handle("start-sharing", async () => {
    console.log("Запрос на старт шаринга");

    if (!currentVideoPath) {
        console.log("Видео не выбрано");
        return { success: false, message: "Сначала выберите видео" };
    }

    if (server) {
        console.log("Сервер уже работает");
        return { success: true, url: `http://${getLocalIP()}:3000/video` };
    }

    const appExpress = express();

    // Потоковая отдача видео
    appExpress.get("/video", (req, res) => {
        const range = req.headers.range;

        if (!range) {
            // Если Range нет, отдаем простую страницу с <video>
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
        res.setHeader("Content-Disposition", "inline"); // или attachment
        fs.createReadStream(currentVideoPath).pipe(res);
    });

    // Отдельный маршрут для самого потока
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

        // Отслеживаем соединения
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
            // Закрываем все соединения
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
            console.error("Ошибка при остановке сервера:", err);
            return { success: false, message: "Не удалось остановить сервер" };
        }
    } else {
        console.log("Сервер не был запущен");
        return { success: false, message: "Сервер не запущен" };
    }
});
