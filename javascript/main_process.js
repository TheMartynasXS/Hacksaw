const { app, BrowserWindow, clipboard } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
const isDev = require("electron-is-dev");
const Open = require("open");
const fs = require("fs");
// const diffpatch = require("jsondiffpatch");
const { execSync, exec } = require("child_process");

const PrefsPath = path.join(app.getPath("userData"), "UserPrefs.json");
const SamplesPath = path.join(app.getPath("userData"), "SampleDB.json");
const xRGBAPath = path.join(app.getPath("userData"), "xRGBADB.json");

let openedBins = new Set();

const { getWinSettings, saveBounds } = require("./settings");

//#region variables
let Prefs = fs.existsSync(PrefsPath)
  ? JSON.parse(fs.readFileSync(PrefsPath))
  : {
      PreferredMode: "random",
      IgnoreBW: true,
      RitoBinPath: "",
      FFMPEGPath: "",
      Targets: [true, true, true, true, true],
      Regenerate: false,
      GenerateMissing: false,
    };
Prefs.Dev = isDev;

let Samples = fs.existsSync(SamplesPath)
  ? JSON.parse(fs.readFileSync(SamplesPath))
  : [];
let xRGBA = fs.existsSync(xRGBAPath)
  ? JSON.parse(fs.readFileSync(xRGBAPath))
  : [];
let FileCache = [];
let currentFile = {};
let FilePath = "";
//#endregion

let window = null;

function main() {
  const bounds = getWinSettings().size;
  const position = getWinSettings().position;

  console.log(bounds);
  window = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 800,
    minHeight: 600 + 20,
    x: position ? position[0] : undefined,
    y: position ? position[1] : undefined,
    title: "Hacksaw " + app.getVersion(),
    backgroundColor: "#3a3b41",
    icon: "buildhacksaw.ico",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  window.on("moved", () => saveBounds(window.getBounds()));
  window.on("resized", () => saveBounds(window.getBounds()));

  if (Prefs?.RitoBinPath && Prefs?.RitoBinPath.length > 0) {
    window.loadFile(path.join(__dirname, "../html/binsplash.html"));
  } else {
    window.loadFile(path.join(__dirname, "../html/startup.html"));
  }
  if (isDev) {
    window.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  main();
});
ipcMain.on("get-ssx", (event) => {
  event.returnValue = [Prefs, Samples, xRGBA];
});

ipcMain.on("update-settings", (event, arg) => {
  Prefs = JSON.parse(arg);
});

ipcMain.on("update-samples", (event, arg) => {
  Samples = JSON.parse(arg);
});

ipcMain.on("update-xrgba", (event, arg) => {
  xRGBA = JSON.parse(arg);
});

ipcMain.on("AddOpened", (event, arg) => {
  openedBins.add(arg);
});

app.setAppUserModelId("Hacksaw " + app.getVersion());

app.on("window-all-closed", () => {
  fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
  fs.writeFileSync(SamplesPath, JSON.stringify(Samples, null, 2), "utf-8");
  fs.writeFileSync(xRGBAPath, JSON.stringify(xRGBA, null, 2), "utf-8");
  for (let bin of openedBins) {
    let jsonName = bin.slice(0, -4) + ".json";
    if (fs.statSync(jsonName).mtimeMs < fs.statSync(bin).mtimeMs) {
      fs.unlinkSync(jsonName);
    }
  }
  app.quit();
});

ipcMain.on("ChangeTab", (event, arg) => {
  window.loadFile(path.join(__dirname, "../html/" + arg));
  event.returnValue = "done";
});

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
      .then((val) => (event.returnValue = val.filePaths[0]));
  } else if (arg[1] == "ffmpeg") {
    dialog
      .showOpenDialog({
        title: arg[0],
        filters: [{ name: "ffmpeg", extensions: ["exe"] }],
        properties: ["openFile"],
      })
      .then((val) => (event.returnValue = val.filePaths[0]));
  }
});

ipcMain.on("UserPath", (event) => {
  event.returnValue = app.getPath("userData");
});

ipcMain.on(
  "Message",
  (event, props = { title: "untitled", message: "unknownerror" }) => {
    switch (props.type) {
      case "error":
        dialog
          .showMessageBox(null, {
            type: props.type,
            title: "error",
            message: "Please check for an update on Github.",
            detail: `${props.message}\n${props.title}`,
            buttons: ["Copy Error", "Open Github", "OK"],
          })
          .then((result) => {
            if (result.response == 1) {
              Open("https://github.com/TheMartynasXS/Hacksaw/releases");
            } else if (result.response == 0) {
              clipboard.writeText(`${props.message}\n${props.title}`);
            }
          });
        break;
      default:
        dialog
          .showMessageBox(null, {
            type: props.type,
            title: props.title,
            defaultId: props.defaultId,
            cancelId: props.cancelId,
            buttons: props.buttons,
            message: props.message,
            detail: props.detail,
            checkboxLabel: props.checkboxLabel,
            checkboxChecked: props.checkboxChecked,
          })
          .then((result) => (event.returnValue = result));
        break;
    }
  }
);

ipcMain.on("Bin2Json", (event, path) => {
  if (
    path.endsWith(".bin") &&
    fs.existsSync(path) &&
    fs.existsSync(path.slice(0, -4) + ".json") &&
    Prefs.Regenerate
  ) {
    execSync(
      `"${Prefs.RitoBinPath}" -o json "${FilePath}" ${isDev ? "" : "-k"}`
    );
  } else if (fs.lstatSync(path).isDirectory() && fs.existsSync(path)) {
    console.time("binning");
    execSync(
      `"${Prefs.RitoBinPath}" -r -i bin -o json "${path}" ${isDev ? "" : "-k"}`
    );
    console.timeLog("binning");
  }
  event.returnValue = 0;
});

ipcMain.on("Json2Bin", (event, path) => {
  if (path.endsWith(".json") && fs.existsSync(path) && path.includes(".wad")) {
    execSync(`"${Prefs.RitoBinPath}" -o bin "${path}" ${isDev ? "" : "-k"}`);
  } else if (fs.lstatSync(path).isDirectory() && fs.existsSync(path)) {
    console.time("binning");
    execSync(
      `"${Prefs.RitoBinPath}" -r -i json -o bin "${path}" ${isDev ? "" : "-k"}`
    );
    console.timeLog("binning");
  }
  event.returnValue = 0;
});

ipcMain.on("OpenBin", (event) => {
  try {
    FilePath = dialog.showOpenDialogSync({
      title: "Select Bin",
      filters: [{ name: "bin", extensions: ["bin"] }],
      properties: ["openFile"],
      message: "Select a bin file",
    })[0];
    FileCache = [];
    openedBins.add(FilePath);
  } catch (error) {
    event.returnValue = undefined;
    console.log(FilePath);
    return 0;
  }

  if (
    (fs.existsSync(FilePath.slice(0, -4) + ".json") && Prefs.Regenerate) ||
    !fs.existsSync(FilePath.slice(0, -4) + ".json")
  ) {
    execSync(
      `"${Prefs.RitoBinPath}" -o json "${FilePath}" ${isDev ? "" : "-k"}`
    );
  }

  currentFile = JSON.parse(
    fs.readFileSync(FilePath.slice(0, -4) + ".json"),
    null,
    2
  );

  currentFile.entries.value.items.unshift({
    key: 2193555760,
    value: {
      items: new Array(0),
      name: 2021448597,
    },
  });
  let cz = currentFile.entries.value.items
  cz.unshift({ key: 2193555760 });

  cz[0].value.items = new Array(0);
  cz[0].value.name = 2021448597;


  event.returnValue = {
    Path: FilePath,
    File: currentFile,
  };
});

ipcMain.on("PushHistory", (event, arg) => {
  FileCache.push(arg);
  event.returnValue = 0;
});

ipcMain.on("PopHistory", (event) => {
  if (FileCache.length > 0) {
    currentFile = FileCache.pop();
    event.returnValue = {
      Path: FilePath,
      File: currentFile,
    };
  } else {
    event.returnValue = 0;
  }
});

ipcMain.on("PullBin", (event) => {
  event.returnValue = {
    Path: FilePath,
    File: currentFile,
  };
});

ipcMain.on("UpdateBin", (event, arg) => {
  currentFile = arg;
  event.returnValue = 0;
});

ipcMain.on("SaveBin", (event) => {
  fs.writeFileSync(
    FilePath.slice(0, -4) + ".json",
    JSON.stringify(currentFile, null, 2)
  );
  let before = fs.statSync(FilePath).mtimeMs;
  execSync(`"${Prefs.RitoBinPath}" -o bin "${FilePath.slice(0, -4) + ".json"}`);
  let after = fs.statSync(FilePath).mtimeMs;
  if (after > before) {
    dialog.showMessageBox(null, {
      type: "info",
      title: "Success",
      message: "Bin saved successfully!",
    });
    event.returnValue = 0;
  }
  event.returnValue = 1;
});
