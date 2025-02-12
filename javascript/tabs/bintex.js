const { execSync } = require("child_process");
const sorter = require("path-sort").standalone("/");
const {
  Tab,
  Prefs,
  CreateMessage,
  getAllFiles,
  extendPrototypes,
} = require("../javascript/utils.js");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const UnlinkList = document.getElementById("Unlink-List");
let Progress = document.getElementById("Progress-Range");
let BinCount = document.getElementById("Bin-Count");

let UnusedButton = document.getElementById("Delete-Unused");

let Files2Delete = [];

let WadPath = "";
let AssetFiles = [];
let BinFiles = [];
let BTXFiles = [];
let SeparateOutput = [];
let CombinedOutput = [];
let MissingOutput = [];

let pathRegExp = new RegExp(/ASSETS.+(?:dds|skn|skl|sco|scb|tex)/gi);

extendPrototypes();

const { spawn } = require("child_process");
const { StringDecoder } = require("string_decoder");

function ritobinConv(inputFileBytes, inputFormat, outputFormat, errorCallback) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder("utf8");
    const process = spawn(
      Prefs.obj.RitoBinPath,
      [
        "--input-format",
        inputFormat,
        "--output-format",
        outputFormat,
        "--verbose",
        "-k", //keep hashed names
        "-", // input as -
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    process.stdin.write(inputFileBytes);
    process.stdin.end();

    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);

    process.stdout.on("data", (data) => {
      stdout = Buffer.concat([stdout, data]);
    });

    process.stderr.on("data", (data) => {
      stderr = Buffer.concat([stderr, data]);
    });

    process.on("close", (code) => {
      if (code !== 0) {
        errorCallback(decoder.write(stderr));
        errors.write(decoder.write(stderr));
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
}
// const inputFilePath = process.env.INPUT_FILE_PATH || "C:\\Users\\mxs\\Desktop\\TestMod\\data\\characters\\neeko\\skins\\skin0.bin";
// ritobinConv(fs.readFileSync(inputFilePath), "bin", "json", (err) => console.log(err)).then(
//   buffer => {
//     console.log(buffer.toString())
//   }
// )



// SelectWadFolder("c:\\users\\mxs\\desktop\\hwei.wad.client");
function SelectWadFolder(Path = undefined) {
  UnlinkList.innerText = "";
  WadPath =
    Path ??
    ipcRenderer.sendSync("FileSelect", ["Select wad folder", "Folder"])[0];

  if (!(fs.existsSync(WadPath) && path.join(WadPath, "assets"))) {
    CreateMessage({
      type: "info",
      title: "Error",
      message:
        "Invalid Path.\nFolder name must end in '.wad.client' or '.wad' for the sake of safety.",
    });
    return 0;
  }
  BinFiles = getAllFiles(WadPath, BinFiles).filter((file) =>
    file.endsWith(".bin")
  );
  console.time("Conversion");
  console.log(BinFiles)
  for(let i = 0; i < BinFiles.length; i++) {
    const buffer = fs.readFileSync(BinFiles[i]);
    ritobinConv(buffer, "bin", "json", (err) => console.log(err)).then(
      buffer => {
        console.log(buffer.toString())
        console.timeLog("Conversion")
      }
    )
  }

  // ipcRenderer.send("Bin2Json", WadPath);
  // console.timeLog("Conversion");
  // AssetFiles = getAllFiles(WadPath, AssetFiles).filter(file => /\.(?:dds|skn|skl|sco|scb|tex)/gi.test(file))
  // console.log(AssetFiles[1000])
  // console.log(path.relative(WadPath, AssetFiles[1000]))
}

// function Undo() {
//   if (FileCache.length > 0) {
//     File = JSON.parse(JSON.stringify(FileCache[FileCache.length - 1]))
//     FileCache.pop();
//     LoadFile(true);
//   }
//   FilterParticles(document.getElementById("Filter").value);
// }

// async function SelectWadFolder(Path = undefined) {
//   UnlinkList.innerText = ""
//   WadPath = Path ?? ipcRenderer.sendSync("FileSelect", [
//     "Select wad folder",
//     "Folder",
//   ])[0];
//   if (!fs.existsSync(WadPath) || !(WadPath.toLowerCase().endsWith(".wad.client")||WadPath.toLowerCase().endsWith(".wad"))) {
//     CreateMessage({
//       type: "info",
//       title: "Error",
//       message: "Invalid Path.\nFolder name must end in \'.wad.client\' or \'.wad\' for the sake of safety."
//     })
//     return 0;
//   }

//   Progress.classList.remove('Progress-Complete')
//   AssetFiles = [];
//   BinFiles = [];
//   BTXFiles = [];
//   SeparateOutput = []
//   CombinedOutput = []
//   MissingOutput = []
//   AssetFiles = getAllFiles(WadPath, AssetFiles).filter(file => /\.(?:dds|skn|skl|sco|scb|tex)/gi.test(file))
//   BinFiles = getAllFiles(WadPath, BinFiles).filter(file => file.endsWith(".bin"))

//   Progress.max = BinFiles.length

//   ipcRenderer.send("Bin2Json", WadPath)

//   BTXFiles = getAllFiles(WadPath, BTXFiles).filter(file => file.endsWith(".json"))
//   Progress.classList.add('Progress-Complete')

//   for (let i = 0; i < BTXFiles.length; i++) {
//     let currentFile = JSON.parse(fs.readFileSync(BTXFiles[i], "utf-8"))
//     let Matches = JSON.stringify(currentFile, null, 2).match(pathRegExp)
//     if (Matches?.length > 0) {

//       for (let j = 0; j < Matches.length; j++) {
//         fixedMatch = Matches[j].toLowerCase()
//         if (!CombinedOutput.includes(fixedMatch)) {
//           CombinedOutput.push(fixedMatch)
//         }
//       }
//     }
//   }

//   for (let i = 0; i < BTXFiles.length; i++) {
//     let currentFile = JSON.parse(fs.readFileSync(BTXFiles[i], "utf-8"))
//     let ParticleObject = currentFile.entries.value.items
//     for (let PO_ID = 0; PO_ID < ParticleObject.length; PO_ID++) {
//       if (ParticleObject[PO_ID].value.name.fnv("vfxsystemdefinitiondata")) {

//         let tempname = ParticleObject[PO_ID].value.items.find((item) => {
//           if (item.key.fnv("particlename")) { return item }
//         })?.value.toString().toLowerCase()

//         SeparateOutput.push({
//           Particle: tempname,
//           Bin: BTXFiles[i].replace(/\.json$/, ".bin").replace(/\\/g, "/"),
//           Files: []
//         })

//         let DefData = ParticleObject[PO_ID].value.items.filter(item =>
//           item.key.fnv("complexemitterdefinitiondata") ||
//           item.key.fnv("simpleemitterdefinitiondata"))
//         for (let B = 0; B < DefData.length; B++) {
//           let Props = DefData[B].value.items
//           for (let C = 0; C < Props.length; C++) {
//             if (DefData[B].key.fnv("complexemitterdefinitiondata") ||
//               DefData[B].key.fnv("simpleemitterdefinitiondata")) {
//               let StringObj = JSON.stringify(DefData[B], null, 2)
//               let Matches = StringObj.match(pathRegExp)
//               Matches?.forEach(Match => {
//                 fixedMatch = Match.toLowerCase()
//                 if (!SeparateOutput[SeparateOutput.length - 1].Files.includes(fixedMatch)) {
//                   SeparateOutput[SeparateOutput.length - 1].Files.push(fixedMatch)
//                 }
//               })
//             }
//           }
//         }
//       }
//       else {
//         let tempname = ParticleObject[PO_ID].value.key != undefined ? ParticleObject[PO_ID].value.key.toString().toLowerCase() : ParticleObject[PO_ID].value.name.toString().toLowerCase()

//         let MiscIndex = SeparateOutput.findIndex(item => item.Particle == tempname
//           && item.Bin == BTXFiles[i].replace(/\.json$/, ".bin").replace(/\\/g, "/"));

//         if (MiscIndex < 0) {
//             SeparateOutput.push({
//                 Particle: `${tempname}`,
//                 Bin: BTXFiles[i].replace(/\.json$/, ".bin").replace(/\\/g, "/"),
//                 Files: []
//             });
//             MiscIndex = SeparateOutput.length - 1;
//         }
//         let MatData = ParticleObject[PO_ID].value.items
//         let StringObj = JSON.stringify(MatData, null, 2)
//         let Matches = StringObj.match(pathRegExp)
//         Matches?.forEach(Match => {
//           fixedMatch = Match.toLowerCase()
//           if (!SeparateOutput[MiscIndex].Files.includes(fixedMatch)) {
//             SeparateOutput[MiscIndex].Files.push(fixedMatch)
//           }
//         })
//       }
//     }
//   }

//   Files2Delete = AssetFiles.filter(item => {
//     slice = item.slice(WadPath.length + 1).toLowerCase()
//     return !CombinedOutput.includes(slice) && !slice.split("/").slice(-1)[0].startsWith("2x_") && !slice.split("/").slice(-1)[0].startsWith("4x_") && !slice.includes("\/hud\/")
//   })

//   //Files2Delete = Files2Delete.filter(item => !item.endsWith(".anm"))
//   Files2Delete = [...Files2Delete, ...BTXFiles]

//   Files2Delete.sort((a, b) => (a.Particle > b.Particle) ? 1 : ((b.Particle > a.Particle) ? -1 : 0))
//   Files2Delete.map(item => {
//     let FileName = document.createElement('div')
//     FileName.innerText = item.slice(WadPath.length + 1)
//     UnlinkList.appendChild(FileName)
//   })

//   BinCount.innerText = `Detected Unused - ${Files2Delete.length}`
//   UnusedButton.disabled = false

//   SeparateOutput.sort((a, b) => (a.Particle > b.Particle) ? 1 : ((b.Particle > a.Particle) ? -1 : 0))

//   for (let i = 0; i < SeparateOutput.length; i++) {
//     SeparateOutput[i].Files.sort(sorter)
//   }

//   fs.writeFileSync(`${WadPath}\\Separate.jsonc`, JSON.stringify(SeparateOutput, null, 2))
//   CombinedOutput.sort((a, b) => (a > b) ? 1 : ((b > a) ? -1 : 0))
//   fs.writeFileSync(`${WadPath}\\Combined.jsonc`, JSON.stringify(CombinedOutput, null, 2))
//   for (let i = 0; i < CombinedOutput.length; i++) {
//     if (!fs.existsSync(path.join(WadPath, CombinedOutput[i]))) {
//       MissingOutput.push(CombinedOutput[i])
//     }
//   }
//   fs.writeFileSync(`${WadPath}\\Missing.jsonc`, JSON.stringify(MissingOutput, null, 2))
//   //get empty folders
//   let EmptyFolders = getAllFiles(WadPath, []).filter(file => fs.lstatSync(file).isDirectory() && fs.readdirSync(file).length == 0)

// }

// let Confirm = 0
// async function DeleteUnused() {
//   switch (Confirm) {
//     case 2:
//     case 1:
//     case 0:
//       UnusedButton.classList.add(`Confirm-${Confirm}`)
//       Confirm++
//       return 0
//     default:
//       Confirm = 0
//       break;
//   }
//   UnusedButton.className = "Flex-1"

//   Progress.classList.replace('Progress-Complete', 'Progress-Delete')
//   Progress.max = Files2Delete.length
//   BinCount.innerText = `Deleting Unused - 0/${Progress.max}`

//   if (Files2Delete.length > 0) {
//     for (let i = 0; i < Files2Delete.length; i++) {
//       Progress.value = i + 1
//       UnlinkList.removeChild(UnlinkList.firstChild)
//       fs.unlinkSync(Files2Delete[i])
//       BinCount.innerText = `Deleting Unused - ${i + 1}/${Progress.max}`
//     }
//   } else {
//     CreateMessage({
//       type: "info",
//       title: "Clean",
//       message: "No files to delete"
//     })
//   }
//   UnlinkList.innerText = ""
//   Progress.classList.replace('Progress-Delete', 'Progress-Complete')

//   let EmptyFolders = [];
//   EmptyFolders = getAllFiles(WadPath, []).filter(file => fs.lstatSync(file).isDirectory() && fs.readdirSync(file).length == 0)
//   console.log(EmptyFolders);
// }
