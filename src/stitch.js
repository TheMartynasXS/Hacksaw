const { execSync } = require('child_process');
const { ipcRenderer} = require('electron');
const fs = require('fs');
const Path = require('path');
const UTIL = require('../src/utilities');

let FileSaved = true
let Persist = true
window.onerror = function (msg, error, lineNo, columnNo) {
  UTIL.CreateAlert(`Message: ${msg}\n\nError: ${error},\n\nRaised at: ${lineNo} : ${columnNo}`)
}

let File = {};
let FileCache = []
let FilePath = ipcRenderer.sendSync('PassFile');

function OpenPrimaryBin() {
  if (FileSaved == false && Persist == true) {
    UTIL.CreateAlert("You might have forgotten to save bin")
    Persist = false
    return 0
  }
  FilePath = ipcRenderer.sendSync('FileSelect', 'Bin');
  if (FilePath == undefined) { return 0 }
  ParticleList.innerText = null
  if (fs.existsSync(FilePath.slice(0, -4) + ".json") == false) {
    ToJson()
  }
  File = require(FilePath.slice(0, -4) + ".json")
  document.getElementById('appTitle').innerText =
    `BinSplash - ${FilePath.substring(FilePath.lastIndexOf('\\') + 1)}`
  LoadFile(document.getElementById("primary"))
}
File = require('../src/skin0.json')
LoadFile(document.getElementById("primary"))
LoadFile(document.getElementById("secondary"))
function LoadFile(Target) {
  Target.innerText = ""
  let ParticleObject = File.entries.value.items
  for (let PO_ID = 0; PO_ID < ParticleObject.length; PO_ID++) {
    if (ParticleObject[PO_ID].value.name == "VfxSystemDefinitionData") {
      //console.log(ParticleObject[PO_ID])
      ParticleName =
        ParticleObject[PO_ID].value.items.find((item) => {
          if (item.key == "particleName") { return item }
        }).value

      let ParticleDiv = document.createElement("div")
      ParticleDiv.id = ParticleObject[PO_ID].key
      ParticleDiv.className = "m-2 border-2 border-gray-700 rounded-md"
      ParticleDiv.innerHTML =
        `<div class="ParticleTitle flex bg-gray-700 text-gray-300 rounded-sm p-1">
          <input type="checkbox" onclick="CheckChildren(this.parentNode.parentNode.children[1],this.checked)"/>
          <div class="flex-1 text-center">${ParticleName}</div>
        </div>`
      let DefData = ParticleObject[PO_ID].value.items.filter(item => item.key == "complexEmitterDefinitionData" || item.key == "simpleEmitterDefinitionData")
      //console.log("---")
      for (let B = 0; B < DefData.length; B++) {
        //console.log(DefData[B].value.items)
        let DefDataDiv = document.createElement('div')
        ParticleDiv.appendChild(DefDataDiv)

        let Props = DefData[B].value.items
        for (let C = 0; C < Props.length; C++) {

          //console.log(Props[C])
          if (DefData[B].key == "complexEmitterDefinitionData" || DefData[B].key == "simpleEmitterDefinitionData") {
            let Color
            if (Props[C].items.find(item => item.key == "color")) {
              Color =
                UTIL.GetColor(
                  Props[C].items.find(item => item.key == "color").value.items
                )
            }
            else if (Props[C].items.find(item => item.key == "birthColor")) {
              if (Props[C].items.find(item => item.key == "birthColor").value.items.find(item => item.key == "dynamics")) {
                Color = null
              }
              else {
                Color =
                  UTIL.GetColor(
                    Props[C].items.find(item => item.key == "birthColor").value.items
                  )
              }
            }
            let BG =
              UTIL.ToBG(
                Color
              )

            let Emitter = document.createElement('div')
            Emitter.className = "flex p-2 hover:bg-black hover:bg-opacity-20 text-gray-300 hover:text-white"
            let Input = document.createElement('input')
            Input.type = "checkbox"
            Input.style = `${BG == null ? "visibility:hidden" : null}`
            Emitter.appendChild(Input)
            let Title = document.createElement('div')
            Title.className = "mx-2 flex-1 overflow-ellipsis"
            Title.innerText = Props[C].items[Props[C].items.findIndex(item => item.key == "emitterName")]?.value
            Emitter.appendChild(Title)
            let ColorDiv = document.createElement('div')
            ColorDiv.className = `mx-1 btn-reg-black text-center cursor-picker ${Color?.length > 1 ? "dynamic" : "solid"}`
            ColorDiv.style = `height:24px;width:80px;${BG == null ? "visibility:hidden" : "background:" + BG}`
            ColorDiv.innerHTML = '<span class="bg-black bg-opacity-0 hover:bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity px-5 rounded-lg py-0.5">COPY<span>'
            ColorDiv.onclick = () => {
              Palette = Color
              MapPalette()
            }
            Emitter.appendChild(ColorDiv)

            DefDataDiv.appendChild(Emitter)
          }
        }
      }
      Target.appendChild(ParticleDiv)
    }
  }
}