const { execSync } = require("child_process");
const sorter = require("path-sort").standalone('/');
const { Tab, Prefs, CreateMessage, getAllFiles } = require('../javascript/utils.js');
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const UnlinkList = document.getElementById("Unlink-List");
let Progress = document.getElementById('Progress-Range')
let BinCount = document.getElementById('Bin-Count')

let UnusedButton = document.getElementById('Delete-Unused')

let ParticleArray = [];

let Files2Delete = [];

let WadPath = "";
let ParticleTargetPath = "";
let AllFiles = []
let BinFiles = []
let BTXFiles = []
let SeparateOutput = []
let CombinedOutput = []
let MissingOutput = []

let pathRegExp = new RegExp(/ASSETS.+(?:dds|skn|skl|sco|scb|tex)/gi)

function Undo() {
  if (FileCache.length > 0) {
    File = JSON.parse(JSON.stringify(FileCache[FileCache.length - 1]))
    FileCache.pop();
    LoadFile(true);
  }
  FilterParticles(document.getElementById("Filter").value);
}

async function SelectWadFolder(Path = undefined) {
  UnlinkList.innerText = ""
  WadPath = Path ?? ipcRenderer.sendSync("FileSelect", [
    "Select wad folder",
    "Folder",
  ])[0];
  if (!fs.existsSync(WadPath) || !WadPath.toLowerCase().endsWith(".wad.client")) {
    CreateMessage({
      type: "info",
      title: "Error",
      message: "Invalid Path.\nFolder name must end in \'.wad.client\' for the sake of safety."
    })
    return 0;
  }

  Progress.classList.remove('Progress-Complete')
  AllFiles = [];
  BinFiles = [];
  SeparateOutput = []
  CombinedOutput = []
  MissingOutput = []
  AllFiles = getAllFiles(WadPath, AllFiles).filter(file => !file.endsWith(".bin"))
  BinFiles = getAllFiles(WadPath, BinFiles).filter(file => file.endsWith(".bin"))

  Progress.max = BinFiles.length
  for (let i = 0; i < BinFiles.length; i++) {
    ToJson(BinFiles[i])
    BinCount.innerText = `Converting Bins - ${Progress.value}/${Progress.max}`
    await sleep(10)
    Progress.value = i + 1
  }
  BTXFiles = getAllFiles(WadPath, BTXFiles).filter(file => file.endsWith(".btx"))
  Progress.classList.add('Progress-Complete')

  for (let i = 0; i < BTXFiles.length; i++) {
    let currentFile = JSON.parse(fs.readFileSync(BTXFiles[i], "utf-8"))
    let Matches = JSON.stringify(currentFile, null, 2).match(pathRegExp)
    if (Matches?.length > 0) {

      for (let j = 0; j < Matches.length; j++) {
        fixedMatch = Matches[j].toLowerCase()
        if (!CombinedOutput.includes(fixedMatch)) {
          CombinedOutput.push(fixedMatch)
        }
      }
    }
  }

  for (let i = 0; i < BTXFiles.length; i++) {
    let currentFile = JSON.parse(fs.readFileSync(BTXFiles[i], "utf-8"))
    let ParticleObject = currentFile.entries.value.items

    for (let PO_ID = 0; PO_ID < ParticleObject.length; PO_ID++) {
      if (ParticleObject[PO_ID].value.name.toString().toLowerCase() == "vfxsystemdefinitiondata") {
        let tempname = ParticleObject[PO_ID].value.items.find((item) => {
          if (item.key.toString().toLowerCase() == "particlename") { return item }
        }).value.toString().toLowerCase()
        SeparateOutput.push({
          Particle: tempname,
          Bin: BTXFiles[i].replace(/\.btx$/, ".bin").replace(/\\/g, "/"),
          Files: []
        })

        let DefData = ParticleObject[PO_ID].value.items.filter(item =>
          item.key.toString().toLowerCase() == "complexemitterdefinitiondata" ||
          item.key.toString().toLowerCase() == "simpleemitterdefinitiondata")
        for (let B = 0; B < DefData.length; B++) {
          let Props = DefData[B].value.items
          for (let C = 0; C < Props.length; C++) {
            if (DefData[B].key.toString().toLowerCase() == "complexemitterdefinitiondata" ||
              DefData[B].key.toString().toLowerCase() == "simpleemitterdefinitiondata") {
              let StringObj = JSON.stringify(DefData[B], null, 2)
              let Matches = StringObj.match(pathRegExp)
              Matches?.forEach(Match => {
                fixedMatch = Match.toLowerCase()
                if (!SeparateOutput[SeparateOutput.length - 1].Files.includes(fixedMatch)) {
                  SeparateOutput[SeparateOutput.length - 1].Files.push(fixedMatch)
                }
              })
            }
          }
        }
      }
      else {
        let tempname = ParticleObject[PO_ID].value.name

        let MiscIndex = SeparateOutput.findIndex(item => item.Particle == "!Misc" && item.Bin == BTXFiles[i].replace(/\.btx$/, ".bin"))

        if (MiscIndex < 0) {
          SeparateOutput.push({
            Particle: "!Misc",
            Bin: BTXFiles[i].replace(/\.btx$/, ".bin").replace(/\\/g, "/"),
            Files: []
          })
          MiscIndex = SeparateOutput.length - 1
        }
        let MatData = ParticleObject[PO_ID].value.items
        let StringObj = JSON.stringify(MatData, null, 2)
        let Matches = StringObj.match(pathRegExp)
        Matches?.forEach(Match => {
          fixedMatch = Match.toLowerCase()
          if (!SeparateOutput[MiscIndex].Files.includes(fixedMatch)) {
            SeparateOutput[MiscIndex].Files.push(fixedMatch)
          }
        })
      }
    }
  }

  Files2Delete = AllFiles.filter(item => {
    slice = item.slice(WadPath.length + 1).toLowerCase()
    return !CombinedOutput.includes(slice) && !slice.split("/").slice(-1)[0].startsWith("2x_") && !slice.split("/").slice(-1)[0].startsWith("4x_")
  })

  Files2Delete = Files2Delete.filter(item => !(item.endsWith(".json") || item.endsWith(".bnk") || item.endsWith(".wpk")))

  Files2Delete.sort((a, b) => (a.Particle > b.Particle) ? 1 : ((b.Particle > a.Particle) ? -1 : 0))
  Files2Delete.map(item => {
    let FileName = document.createElement('div')
    FileName.innerText = item.slice(WadPath.length + 1)
    UnlinkList.appendChild(FileName)
  })

  BinCount.innerText = `Detected Unused - ${Files2Delete.length}`
  UnusedButton.disabled = false

  SeparateOutput.sort((a, b) => (a.Particle > b.Particle) ? 1 : ((b.Particle > a.Particle) ? -1 : 0))

  for (let i = 0; i < SeparateOutput.length; i++) {
    SeparateOutput[i].Files.sort(sorter)
  }
  fs.writeFileSync(`${WadPath}\\Separate.json`, JSON.stringify(SeparateOutput, null, 2))
  CombinedOutput.sort((a, b) => (a > b) ? 1 : ((b > a) ? -1 : 0))
  fs.writeFileSync(`${WadPath}\\Combined.json`, JSON.stringify(CombinedOutput, null, 2))
  for (let i = 0; i < CombinedOutput.length; i++) {
    if (!fs.existsSync(path.join(WadPath, CombinedOutput[i]))) {
      MissingOutput.push(CombinedOutput[i])
    }
  }
  fs.writeFileSync(`${WadPath}\\Missing.json`, JSON.stringify(MissingOutput, null, 2))

}

let Confirm = 0
async function DeleteUnused() {
  switch (Confirm) {
    case 2:
    case 1:
    case 0:
      UnusedButton.classList.add(`Confirm-${Confirm}`)
      Confirm++
      return 0
    default:
      Confirm = 0
      break;
  }
  UnusedButton.className = "Flex-1"

  Progress.classList.replace('Progress-Complete', 'Progress-Delete')
  Progress.max = Files2Delete.length
  BinCount.innerText = `Deleting Unused - 0/${Progress.max}`

  if (Files2Delete.length > 0) {
    for (let i = 0; i < Files2Delete.length; i++) {
      await sleep(10)
      Progress.value = i + 1
      UnlinkList.removeChild(UnlinkList.firstChild)
      fs.unlinkSync(Files2Delete[i])
      BinCount.innerText = `Deleting Unused - ${i + 1}/${Progress.max}`
    }
  } else {
    CreateMessage({
      type: "info",
      title: "Clean",
      message: "No files to delete"
    })
  }
  UnlinkList.innerText = ""
  Progress.classList.replace('Progress-Delete', 'Progress-Complete')
}

function ToJson(FilePath) {
  let TempFile = FilePath.replace(/\.bin$/, ".btx")
  if (!fs.existsSync(TempFile)) {
    execSync(`"${Prefs.obj.RitoBinPath}" -o json "${FilePath}" "${TempFile}"`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}