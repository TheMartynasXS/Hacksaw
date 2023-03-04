

const { execSync, exec } = require("child_process");
const sorter = require("path-sort").standalone('/');
const { Tab, Prefs } = require('../javascript/utils.js');
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

async function SelectWadFolder(Path = undefined) {
  WadPath = Path ?? ipcRenderer.sendSync("FileSelect", [
    "Select wad folder",
    "Folder",
  ])[0];
  if (!fs.existsSync(path.join(WadPath, "data")) &&
    !fs.existsSync(path.join(WadPath, "assets"))) {
    CreateMessage({
      type: "info",
      title: "Error",
      message: "Invalid Path"
    })
    return 0;
  }
  UnusedButton.disabled = true
  let Progress = document.getElementById('Progress-Range')
  let BinCount = document.getElementById('Bin-Count')
  Progress.classList.remove('Progress-Complete')
  AllFiles = []

  AllFiles = getAllFiles(WadPath, AllFiles)
  BinFiles = getAllFiles(WadPath, BinFiles).filter(file => file.endsWith(".bin"))
  Progress.max = BinFiles.length
  for (let i = 0; i < BinFiles.length; i++) {
    ToJson(BinFiles[i])
    Progress.value = i + 1
    BinCount.innerText = `Converting Bins - ${Progress.value}/${Progress.max}`
    await sleep(20)
  }
  Progress.classList.add('Progress-Complete')
  BTXFiles = getAllFiles(WadPath, BTXFiles).filter(file => file.endsWith(".btx"))
  await ReadBTX()
}

let SeparateOutput = []
let CombinedOutput = []
let MissingOutput = []

async function ReadBTX() {
  SeparateOutput = []
  CombinedOutput = []
  MissingOutput = []

  for (let i = 0; i < BTXFiles.length; i++) {
    let ParticleObject = JSON.parse(fs.readFileSync(BTXFiles[i])).entries.value.items
    for (let PO_ID = 0; PO_ID < ParticleObject.length; PO_ID++) {
      if (ParticleObject[PO_ID].value.name == "VfxSystemDefinitionData") {

        let tempname = ParticleObject[PO_ID].value.items.find((item) => {
          if (item.key == "particleName") { return item }
        }).value.toLowerCase()
        SeparateOutput.push({
          Particle: tempname,
          Bin: BTXFiles[i].replace(/\.btx$/, ".bin"),
          Files: []
        })

        let DefData = ParticleObject[PO_ID].value.items.filter(item => item.key == "complexEmitterDefinitionData" || item.key == "simpleEmitterDefinitionData")
        for (let B = 0; B < DefData.length; B++) {
          let Props = DefData[B].value.items
          for (let C = 0; C < Props.length; C++) {
            if (DefData[B].key == "complexEmitterDefinitionData" || DefData[B].key == "simpleEmitterDefinitionData") {

              let StringObj = JSON.stringify(DefData[B], null, 2)
              let RegStr = new RegExp(/\"ASSETS.+\.(?:dds|skn|skl|sco|scb|anm)\"/gi)

              let Matches = StringObj.match(RegStr)

              Matches?.forEach(Match => {
                if (!CombinedOutput.includes(Match.replace(/"/g, '').toLowerCase())) {
                  CombinedOutput.push(Match.replace(/"/g, '').toLowerCase())
                }
                if (!SeparateOutput[SeparateOutput.length - 1].Files.includes(Match.replace(/"/g, '').toLowerCase())) {
                  SeparateOutput[SeparateOutput.length - 1].Files.push(Match.replace(/"/g, '').toLowerCase())
                }
              })
            }
          }
        }
      }
    }
  }
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

  await GetUnused()
}

async function GetUnused() {
  let Assets
  Assets = getAllFiles(WadPath, Assets).filter(
    file => file.endsWith(".dds") || file.endsWith(".skn") || file.endsWith(".skl") || file.endsWith(".sco") || file.endsWith(".scb") || file.endsWith(".anm") || file.endsWith(".btx")
  )

  for (let i = 0; i < CombinedOutput.length; i++) {
    CombinedOutput[i] = path.join(WadPath, CombinedOutput[i])
  }



  Progress.value = Progress.max
  for (let i = 0; i < Assets.length; i++) {
    if (!CombinedOutput.includes(Assets[i]) && /(\\particles\\|\\mod\\|shared\\|\.btx)/gi.test(Assets[i])) {
      Files2Delete.push(Assets[i])
      let FileName = document.createElement('div')
      FileName.innerText = Assets[i].slice(WadPath.length + 1)
      UnlinkList.appendChild(FileName)
    }
  }

  BinCount.innerText = `Detected Unused - ${Files2Delete.length}`
  UnusedButton.disabled = false
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
      await sleep(20)
      Progress.value = i
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

function getAllFiles(dir, files_) {
  files_ = files_ || [];
  var files = fs.readdirSync(dir);
  for (var i in files) {
    let name = dir + "\\" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getAllFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
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