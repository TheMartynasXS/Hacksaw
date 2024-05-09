const { app, BrowserWindow, clipboard } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
const isDev = require("electron-is-dev");
const Open = require("open");
const fs = require("fs");

const PrefsPath = path.join(app.getPath("userData"), "UserPrefs.json")

const SamplesPath = path.join(app.getPath("userData"), "SampleDB.json")
const xRGBAPath = path.join(app.getPath("userData"), "xRGBADB.json")

let Prefs = fs.existsSync(PrefsPath)
    ? JSON.parse(fs.readFileSync(PrefsPath))
    : {
        PreferredMode: "random",
        IgnoreBW: true,
        RitoBinPath: "",
        Targets: [true, true, true, true, true],
        Regenerate: false,
    };
let Samples = fs.existsSync(SamplesPath)
    ? JSON.parse(fs.readFileSync(SamplesPath))
    : [];
let xRGBA = fs.existsSync(xRGBAPath)
    ? JSON.parse(fs.readFileSync(xRGBAPath))
    : [];
let mainWindow
const createWindow = (htmlDir) => {
    mainWindow = new BrowserWindow({
        width: 800,
        minWidth: 800,
        minHeight: 500,
        height: 600,
        title: "Hacksaw " + app.getVersion(),
        backgroundColor: "#3a3b41",
        icon: "buildhacksaw.ico",
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, htmlDir));
    isDev || process.argv.includes("--dev") ? mainWindow.webContents.openDevTools({ mode: "detach" }) : mainWindow.removeMenu();
};


app.whenReady().then(() => {
    if (!fs.existsSync(SamplesPath)) {
        fs.writeFileSync(SamplesPath, "[]", "utf8")
    }
    if (!fs.existsSync(xRGBAPath)) {
        fs.writeFileSync(xRGBAPath, "[]", "utf8")
    }
    if (!fs.existsSync(PrefsPath) || Prefs?.RitoBinPath == undefined || Prefs?.RitoBinPath?.length == 0) {
        let button = dialog.showMessageBoxSync(null, {
            type: "warning",
            title: "Ritobin Missing",
            defaultId: 2,
            buttons: ["Continue", "cancel"],
            message: "Select Ritobin_cli.exe before continuing."
        })
        if (button == 0) {
            Prefs.RitoBinPath = dialog.showOpenDialogSync({
                title: "Select ritobin_cli.exe!",
                filters: [{ name: "ritobin_cli", extensions: ["exe"] }],
                properties: ["openFile"],
            })[0]
            fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
        }
        else {
            fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
            fs.writeFileSync(SamplesPath, JSON.stringify(Samples, null, 2), "utf-8");
            fs.writeFileSync(xRGBAPath, JSON.stringify(xRGBA, null, 2), "utf-8");
            app.quit();
            return 0;
        }
    }
    if (!Prefs.hasOwnProperty("Regenerate")) {
        Prefs.Regenerate = false;
    }
    createWindow("../html/binsplash.html");
});

ipcMain.on('get-ssx', (event) => {
    event.returnValue = [Prefs, Samples, xRGBA]
})
ipcMain.on("update-settings", (event, arg) => {
    Prefs = JSON.parse(arg);
});
ipcMain.on("update-samples", (event, arg) => {
    Samples = JSON.parse(arg);
});
ipcMain.on("update-xrgba", (event, arg) => {
    xRGBA = JSON.parse(arg);
});

app.setAppUserModelId("Hacksaw " + app.getVersion());
app.on("window-all-closed", () => {
    fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
    fs.writeFileSync(SamplesPath, JSON.stringify(Samples, null, 2), "utf-8");
    fs.writeFileSync(xRGBAPath, JSON.stringify(xRGBA, null, 2), "utf-8");
    app.quit();
});

const DefaultPreferences = JSON.stringify(
    {
        PreferredMode: 'random',
        IgnoreBW: true,
        RitoBinPath: "",
        Targets: [true, true, true, true, true],
        Regenerate: false,
    }
    , null, 4)

ipcMain.on("ChangeTab", (event, arg) => {
    mainWindow.loadFile(path.join(__dirname, "../html/"+arg));
    event.returnValue = "done";
})

ipcMain.on("FileSelect", (event, arg) => {
    if (arg[1] == "Bin") {
        dialog
            .showOpenDialog({
                title: arg[0],
                filters: [{ name: "bin", extensions: ["bin"] }],
                properties: ["openFile"],
            })
            .then(
                (val) => (event.returnValue = val.filePaths[0]),
                (val) => console.log("error")
            );
    } else if (arg[1] == "Json") {
        dialog
            .showOpenDialog({
                title: arg[0],
                filters: [{ name: "bin", extensions: ["json"] }],
                properties: ["openFile"],
            })
            .then(
                (val) => (event.returnValue = val.filePaths[0]),
                (val) => console.log("error")
            );
    } else if (arg[1] == "Folder") {
        dialog
            .showOpenDialog({ title: arg[0], properties: ["openDirectory"] })
            .then(
                (val) => (event.returnValue = val.filePaths),
                (val) => console.log("error")
            );
    } else if (arg[1] == "RitoBin") {
        dialog
            .showOpenDialog({
                title: arg[0],
                filters: [{ name: "ritobin_cli", extensions: ["exe"] }],
                properties: ["openFile"],
            })
            .then(
                (val) => (event.returnValue = val.filePaths[0]),
            );
    }
    else if (arg[1] == "ffmpeg") {
        dialog
            .showOpenDialog({
                title: arg[0],
                filters: [{ name: "ffmpeg", extensions: ["exe"] }],
                properties: ["openFile"],
            })
            .then(
                (val) => (event.returnValue = val.filePaths[0]),
            )
    }
});

ipcMain.on("UserPath", (event) => {
    event.returnValue = app.getPath("userData");
});
ipcMain.on("Message", (event, props = { title: "untitled", message: "unknownerror" }) => {
    switch (props.type) {
        case "error":
            dialog.showMessageBox(null, {
                type: props.type,
                title: "error",
                message: "Please check for an update on Github.",
                detail: `${props.message}\n${props.title}`,
                buttons: ["Copy Error", "Open Github", "OK"]
            }).then(result => {
                if (result.response == 1) {
                    Open("https://github.com/TheMartynasXS/Hacksaw/releases")
                }
                else if (result.response == 0) {
                    clipboard.writeText(`${props.message}\n${props.title}`)
                }
            })
            break;
        default:
            dialog.showMessageBox(null, {
                type: props.type,
                title: props.title,
                defaultId: props.defaultId,
                cancelId: props.cancelId,
                buttons: props.buttons,
                message: props.message,
                detail: props.detail,
                checkboxLabel: props.checkboxLabel,
                checkboxChecked: props.checkboxChecked
            }).then(result =>
                event.returnValue = result
            )
            break;
    }
});