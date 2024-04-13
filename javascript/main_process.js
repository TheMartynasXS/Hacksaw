const { app, BrowserWindow, clipboard } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
const isDev = require("electron-is-dev");
const Open = require("open");
const fs = require("fs");
const { execSync, exec } = require("child_process");


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
    // if (!fs.existsSync(SamplesPath)) {
    //     fs.writeFileSync(SamplesPath, "[]", "utf8")
    // }
    // if (!fs.existsSync(xRGBAPath)) {
    //     fs.writeFileSync(xRGBAPath, "[]", "utf8")
    // }
    // if (!fs.existsSync(PrefsPath) || Prefs?.RitoBinPath == undefined || Prefs?.RitoBinPath?.length == 0) {
    //     let button = dialog.showMessageBoxSync(null, {
    //         type: "warning",
    //         title: "Ritobin Missing",
    //         defaultId: 2,
    //         buttons: ["Continue", "cancel"],
    //         message: "Select Ritobin_cli.exe before continuing."
    //     })
    //     if (button == 0) {
    //         Prefs.RitoBinPath = dialog.showOpenDialogSync({
    //             title: "Select ritobin_cli.exe!",
    //             filters: [{ name: "ritobin_cli", extensions: ["exe"] }],
    //             properties: ["openFile"],
    //         })[0]
    //         fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
    //     }
    //     else {
    //         fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
    //         fs.writeFileSync(SamplesPath, JSON.stringify(Samples, null, 2), "utf-8");
    //         fs.writeFileSync(xRGBAPath, JSON.stringify(xRGBA, null, 2), "utf-8");
    //         app.quit();
    //         return 0;
    //     }
    // }
    // if (!Prefs.hasOwnProperty("Regenerate")) {
    //     Prefs.Regenerate = false;
    // }
    createWindow("../html/binsplash.html");
});

// ipcMain.on('get-ssx', (event) => {
//     event.returnValue = [Prefs, Samples, xRGBA]
// })
// ipcMain.on("update-settings", (event, arg) => {
//     Prefs = JSON.parse(arg);
// });
// ipcMain.on("update-samples", (event, arg) => {
//     Samples = JSON.parse(arg);
// });
// ipcMain.on("update-xrgba", (event, arg) => {
//     xRGBA = JSON.parse(arg);
// });

app.setAppUserModelId("Hacksaw " + app.getVersion());
app.on("window-all-closed", () => {
    // fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
    // fs.writeFileSync(SamplesPath, JSON.stringify(Samples, null, 2), "utf-8");
    // fs.writeFileSync(xRGBAPath, JSON.stringify(xRGBA, null, 2), "utf-8");
    app.quit();
});

// const DefaultPreferences = JSON.stringify(
//     {
//         PreferredMode: 'random',
//         IgnoreBW: true,
//         RitoBinPath: "",
//         Targets: [true, true, true, true, true],
//         Regenerate: false,
//     }
//     , null, 4)

// ipcMain.on("FileSelect", (event, arg) => {
//     if (arg[1] == "Bin") {
//         dialog
//             .showOpenDialog({
//                 title: arg[0],
//                 filters: [{ name: "bin", extensions: ["bin"], multiSelections: false}],
//                 properties: ["openFile"],
//             })
//             .then(
//                 // (val) => (event.returnValue = val.filePaths[0]),
//                 // (val) => console.log("error")
                
//                 (val)=> { 
//                     if (val.filePaths) {
//                         event.returnValue = val.filePaths;
//                     }
//                     else {
//                         console.log("error")
//                     }
//                 },
//             );
//     } else if (arg[1] == "Json") {
//         dialog
//             .showOpenDialog({
//                 title: arg[0],
//                 filters: [{ name: "bin", extensions: ["json"] , multiSelections: false}],
//                 properties: ["openFile"],
//             })
//             .then(
//                 (val)=> { 
//                     if (val.filePaths) {
//                         event.returnValue = val.filePaths;
//                     }
//                     else {
//                         console.log("error")
//                     }
//                 },
//             );
//     } else if (arg[1] == "Folder") {
//         dialog
//             .showOpenDialog({ title: arg[0], properties: ["openDirectory"] })
//             .then(
//                 (val)=> { 
//                     if (val.filePaths[0]) {
//                         event.returnValue = val.filePaths;
//                     }
//                     else {
//                         console.log("error")
//                     }
//                 },
//             );
//     } else if (arg[1] == "RitoBin") {
//         dialog
//             .showOpenDialog({
//                 title: arg[0],
//                 filters: [{ name: "ritobin_cli", extensions: ["exe"] }],
//                 properties: ["openFile"],
//             })
//             .then(
//                 (val) => (event.returnValue = val.filePaths[0]),
//             );
//     }
//     else if (arg[1] == "ffmpeg") {
//         dialog
//             .showOpenDialog({
//                 title: arg[0],
//                 filters: [{ name: "ffmpeg", extensions: ["exe"] }],
//                 properties: ["openFile"],
//             })
//             .then(
//                 (val) => (event.returnValue = val.filePaths[0]),
//             )
//     }
// });

// ipcMain.on("UserPath", (event) => {
//     event.returnValue = app.getPath("userData");
// });
// ipcMain.on("Message", (event, props = { title: "untitled", message: "unknownerror" }) => {
//     switch (props.type) {
//         case "error":
//             dialog.showMessageBox(null, {
//                 type: props.type,
//                 title: "error",
//                 message: "Please check for an update on Github.",
//                 detail: `${props.message}\n${props.title}`,
//                 buttons: ["Copy Error", "Open Github", "OK"]
//             }).then(result => {
//                 if (result.response == 1) {
//                     Open("https://github.com/TheMartynasXS/Hacksaw/releases")
//                 }
//                 else if (result.response == 0) {
//                     clipboard.writeText(`${props.message}\n${props.title}`)
//                 }
//             })
//             break;
//         default:
//             dialog.showMessageBox(null, {
//                 type: props.type,
//                 title: props.title,
//                 defaultId: props.defaultId,
//                 cancelId: props.cancelId,
//                 buttons: props.buttons,
//                 message: props.message,
//                 detail: props.detail,
//                 checkboxLabel: props.checkboxLabel,
//                 checkboxChecked: props.checkboxChecked
//             }).then(result =>
//                 event.returnValue = result
//             )
//             break;
//     }
// });


let binPath = ""//isDev ? "C:\\Users\\mxs\\Desktop\\Jhin.wad.client\\data\\characters\\jhin\\skins\\skin5" : ""
let binData = ""//isDev ? JSON.parse(fs.readFileSync("C:\\Users\\mxs\\Desktop\\Jhin.wad.client\\data\\characters\\jhin\\skins\\skin5.json")) : {}

function ToJson(FilePath) {
    if (isDev) {
        execSync(`"${Prefs.RitoBinPath}" -o json "${FilePath}.bin"`)
    }
    else {
        execSync(`"${Prefs.RitoBinPath}" -o json "${FilePath}.bin" -k`)
    }
}
function ToBin(FilePath) {
    execSync(`"${Prefs.RitoBinPath}" -o bin "${FilePath}.json"`)
}


ipcMain.handle('open-bin', async (event) => {
    const result = await dialog.showOpenDialog({
            title: "open bin file",
            filters: [{ name: "bin", extensions: ["bin"], multiSelections: false}],
            properties: ["openFile"],
        })
    if (result.filePaths[0] != undefined) {
        binPath = result.filePaths[0].slice(0, -4)

        if (!fs.existsSync(`${binPath}.json`)) {
            ToJson(binPath)
        }
        binData = JSON.parse(fs.readFileSync(`${binPath}.json`))
        
        return { "path": binPath, "data": binData }
    }
})
ipcMain.handle('save-bin', async (event, content) => {
    fs.writeFileSync(`${binPath}.json`, JSON.stringify(content, null, 2))
    ToBin(binPath)
})

const {XXHash32,XXHash64} = require('xxhash-addon')

ipcMain.handle('merge-bin', async (event) => {
    if (binPath == ""){return 0}
    let match = binPath.match(/\.wad(\.client)?/)
    let wadPath = binPath.split(match[0])[0]+match[0]
    let newLinked = []
    for(let i = 0; i < binData.linked.value.items.length; i++) {
        let item = binData.linked.value.items[i]
        
        if (item.includes("Characters")){
            newLinked.push(item)
            continue
        }
        let unhashed = path.join(wadPath, item)
        let hashed = path.join(wadPath, Hash(wadPath, item)+".bin")
        let tempFile
        if(fs.existsSync(unhashed)){
            ToJson(unhashed.slice(0, -4))
            tempFile = JSON.parse(fs.readFileSync(unhashed.slice(0, -4)+".json"))
        }
        else if(fs.existsSync(hashed)) {
            ToJson(hashed.slice(0, -4))
            tempFile = JSON.parse(fs.readFileSync(hashed.slice(0, -4)+".json"))
        }
        else{
            continue;
        }
        tempFile.entries.value.items
        let donor = tempFile.entries.value.items
        for( let j = 0; j < donor.length; j++) {
            if (!IsValue("ContextualActionData", donor[j].value.name) && 
                findIndex(binData.entries.value.items,(item)=>{
                    item.key == donor[j].key
                }) < 0){
                binData.entries.value.items.push(donor[j])
            }
        }
    }
    binData.linked.value.items = newLinked
    fs.writeFileSync(`${binPath}.json`, JSON.stringify(binData, null, 2))
    ToBin(binPath)
})

const fnv1a = require('fnv1a');
const { findIndex } = require("lodash");

function Hash(bin){
    return XXHash64.hash(Buffer.from(bin.toLowerCase())).toString('hex')
}
function IsValue(expected, value){
    return expected == value
    || fnv1a(expected) == fnv1a(value)
}
