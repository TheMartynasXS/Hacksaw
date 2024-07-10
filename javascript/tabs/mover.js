const { execSync } = require("child_process");
const sorter = require("path-sort").standalone('/');
const { Tab, Prefs, CreateMessage, getAllFiles } = require('../javascript/utils.js');
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const OriginList = document.getElementById("Origin-List");
const RedirectList = document.getElementById("Redirect-List");
let Progress = document.getElementById('Progress-Range')
let BinCount = document.getElementById('Bin-Count')

let UnusedButton = document.getElementById('Delete-Unused')

let AllFiles;
let JsonFiles = [];
let WadPath = "";
let NewPath = "";

let pathRegExp = new RegExp(/ASSETS.+?(particles|shared).+?\.(?:bnk|wpk|dds|skn|skl|sco|scb|anm|tex)/gi)

function Undo() {
    if (FileCache.length > 0) {
        File = JSON.parse(JSON.stringify(FileCache[FileCache.length - 1]))
        FileCache.pop();
        LoadFile(true);
    }
    FilterParticles(document.getElementById("Filter").value);
}

function OpenLocation() {
    if (WadPath == "") throw new Error("Please select wad folder first");
    NewPath = ipcRenderer.sendSync("FileSelect", [
        "Select wad folder",
        "Folder",
    ])[0]?.replace(/\\/g, "/") + "/";
    if (!fs.existsSync(NewPath) || !NewPath.toLowerCase().includes(".wad.client")) {
        CreateMessage({
            type: "info",
            title: "Error",
            message: "Invalid Path.\nPath must contain \'.wad.client\' for the sake of safety."
        })
        return 0;
    }
    document.getElementById("Title").innerText = (NewPath.split(".wad.client/").pop()).replace(/\\/g, "/")

    let Origin = OriginList.innerText//.split("\n")
    RedirectList.innerText = Origin.replace(pathRegExp, (match) => { return NewPath.split(".wad.client/").pop() + match.split("/").pop() })
}

async function SelectWadFolder(Path = undefined) {
    RedirectList.innerText = ""
    WadPath = Path == undefined? ipcRenderer.sendSync("FileSelect", [
        "Select wad folder",
        "Folder",
    ])[0]: Path;
    AllFiles = new Set();
    if (!fs.existsSync(WadPath) || !(WadPath.toLowerCase().endsWith(".wad.client") || WadPath.toLowerCase().endsWith(".wad"))) {
        CreateMessage({
            type: "info",
            title: "Error",
            message: "Invalid Path.\nPath must contain \'.wad.client\' for the sake of safety."
        })
        return 0;
    }
    OriginList.innerText = ""
    let BinFiles = getAllFiles(WadPath, []).filter(file => file.endsWith(".bin"))

    for (let i = 0; i < BinFiles.length; i++) {
        ToJson(BinFiles[i])
    }
    JsonFiles = getAllFiles(WadPath, JsonFiles).filter(file => file.endsWith(".json"))

    for (let i = 0; i < JsonFiles.length; i++) {
        let TargetFile = JSON.parse(fs.readFileSync(JsonFiles[i], "utf8"));
        let Container = TargetFile.entries.value.items;
        for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
            let StringProp = JSON.stringify(Container[PO_ID], null, 2)
            AllFiles.add(...(StringProp.match(pathRegExp) || []))
        }
    }
    OriginList.innerHTML = [...AllFiles].sort(sorter).join("<br>")
}

let Confirm = 0
let TargetFile
let TargetPath

function MoveParticles() {
    for (let i = 0; i < JsonFiles.length; i++) {
        TargetPath = JsonFiles[i]
        TargetFile = JSON.parse(fs.readFileSync(JsonFiles[i], "utf8"));
        let Container = TargetFile.entries.value.items;
        for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
            let StringProp = JSON.stringify(Container[PO_ID], null, 2)
            StringProp = StringProp.replace(pathRegExp,
                (match) => { return NewPath.split(".wad.client/").pop() + match.split("/").pop() })
            Container[PO_ID] = JSON.parse(StringProp)
        }
        Save(true)
    }
    CreateMessage({
        type: "info",
        title: "Done",
        message: "Particles Moved Successfully"
    })
}

function ToJson(FilePath) {
    if (Prefs.obj.Regenerate || !fs.existsSync(FilePath.replace(".bin", ".json"))) {
        execSync(`"${Prefs.obj.RitoBinPath}" -o json "${FilePath}" -k`);
    }
}
function Save(skip = false) {
    FileSaved = true;
    fs.writeFileSync(
        TargetPath,
        JSON.stringify(TargetFile, null, 2),
        "utf8"
    );
    try {
        let res = execSync(
            `"${Prefs.obj.RitoBinPath}" -o bin "${TargetPath}"`
        );
        if (skip) return 0;
        CreateMessage({
            type: "info",
            title: "File Saved Successfully",
            message: "Don't forget to delete the json files."
        })

    }
    catch (err) {
        CreateMessage({
            type: "error",
            title: "Error Converting to bin",
            message: err.stderr.toString()
        })
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}