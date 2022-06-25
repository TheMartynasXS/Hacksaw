const { app, BrowserWindow } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
const isDev = require("electron-is-dev");
const fs = require("fs");

const PrefsPath = path.join(app.getPath("userData"), "UserPrefs.json")

const SamplePath = path.join(app.getPath("userData"), "SampleDB.json")
const xRGBAPath = path.join(app.getPath("userData"), "xRGBADB.json")

const createWindow = (htmlDir) => {
    const mainWindow = new BrowserWindow({
        width: 800,
        minWidth: 800,
        minHeight: 500,
        height: 600,
        backgroundColor: "#3a3b41",
        icon: "buildhacksaw.ico",
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, htmlDir));
    isDev ? mainWindow.webContents.openDevTools({ mode: "detach" }) : mainWindow.removeMenu();
};

app.whenReady().then(() => {
    if (!fs.existsSync(SamplePath)) {
        fs.writeFileSync(SamplePath, "[]", "utf8")
    }
    if (!fs.existsSync(xRGBAPath)) {
        fs.writeFileSync(xRGBAPath, "[]", "utf8")
    }
    if (!fs.existsSync(PrefsPath)) {
        fs.writeFileSync(PrefsPath, DefaultPreferences, "utf8")
        createWindow("../html/settings.html");
    }
    else{
        createWindow("../html/binsplash.html");
    }
});

app.setAppUserModelId("Hacksaw");
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

//create preference file if it doesn't exist
const DefaultPreferences = JSON.stringify(
    {
        PreferredMode: "false",
        IgnoreBW: true,
        RitoBinPath: "",
        RememberTargets: false,
        Targets:[false,false,false,false,true],
    }
,null,4)



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
                (val) => console.log("error")
            );
    }
});

ipcMain.on("UserPath", (event) => {
    event.returnValue = app.getPath("userData");
});
