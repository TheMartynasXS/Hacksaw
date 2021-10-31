const { execSync } = require('child_process');
const UTIL = require('../javascript/utilities');
const CC = require('color-convert');
const { getColorHexRGB } = require('electron-color-picker');

const PickScreen = async () => {
  const color = await getColorHexRGB().catch((error) => {
    console.warn('[ERROR] getColor', error)
    return ''
  })
  let ColorInput = document.getElementById('Hex')
  ColorInput.value = color
  let SubmitEvent = new Event('change')
  ColorInput.dispatchEvent(SubmitEvent)
  // document.getElementById('Color-Picker').remove()
  // Palette[getChildIndex(Target)].color = CC.hex.rgb(ColorInput.value)
  // MapPalette()
}

function CreatePicker(Target) {
  if (document.getElementById('Color-Picker') == undefined) {
    let temp = Target.style.backgroundColor.match(/\d+/g)
    let ColorPicker = document.createElement('div')
    ColorPicker.className = "Flex-Col"
    ColorPicker.id = "Color-Picker"

    let ColorPickerInputs = document.createElement('div')
    ColorPickerInputs.className = "Input-Group"

    let EyeDropper = document.createElement('button')
    EyeDropper.innerText = "EyeDropper"
    EyeDropper.onclick = () => PickScreen()
    ColorPickerInputs.appendChild(EyeDropper)

    let ColorInput = document.createElement('input')
    ColorInput.id = "RGB"
    ColorInput.type = "color"
    ColorInput.value = `#${CC.rgb.hex([temp[0], temp[1], temp[2]])}`
    ColorInput.onchange = (E) => {
      Hex.value = E.target.value
      let SubmitEvent = new Event('change')
      Hex.dispatchEvent(SubmitEvent)
    }
    ColorPickerInputs.appendChild(ColorInput)

    let Label = document.createElement('div')
    Label.innerText = "Hex:"
    Label.className = "Label"
    ColorPickerInputs.appendChild(Label)

    let Hex = document.createElement('input')
    Hex.id = "Hex"
    Hex.value = `#${CC.rgb.hex([temp[0], temp[1], temp[2]])}`
    Hex.maxLength = 7
    Hex.oninput = (Event) => {
      ColorInput.value = Event.target.value
    }
    ColorPickerInputs.appendChild(Hex)

    ColorPicker.appendChild(ColorPickerInputs)

    Hex.onchange = (Event) => {
      ColorInput.value = Event.target.value
      Target.style.backgroundColor = ColorInput.value
      ColorPicker.remove()
      Palette[UTIL.GetChildIndex(Target)].color = CC.hex.rgb(ColorInput.value)
      MapPalette()
    }

    document.getElementById('Root').appendChild(ColorPicker)
  } else {
    document.getElementById('Color-Picker').remove()
    CreatePicker(Target)
  }
}

let FileSaved = true
let Persist = true
window.onerror = function (msg, error, lineNo, columnNo) {
  UTIL.CreateAlert(`Message: ${msg}\n\nError: ${error},\n\nRaised at: ${lineNo} : ${columnNo}`)
}


let BlankDynamic = `{"key":"dynamics","type":"pointer","value":{"items":[{"key":"times","type":"list","value":{"items":[],"valueType":"f32"}},{"key":"values","type":"list","value":{"items":[],"valueType":"vec4"}}],"name":"VfxAnimatedColorVariableData"}}`

let BlankConstant = `{"key":"constantValue","type":"vec4","value":[]}`

let FileCache = []

let Palette = [NewRandomColor(), NewRandomColor()]

let ColorContainer = document.getElementById("Color-Container")
let GradientIndicator = document.getElementById("Gradient-Indicator")
let TimeContainer = document.getElementById("Time-Container")
let ParticleList = document.getElementById("Particle-List")
let SampleContainer = document.getElementById("SampleContainer")

MapPalette()

function NewRandomColor() { return { time: 0, color: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)] } }

function ChangeColorCount(Count) {
  let TempLenght = parseInt(Palette.length)
  if (TempLenght < Count) {
    for (let ID = 0; ID < Count - TempLenght; ID++) {
      Palette.push(NewRandomColor())
    }
  }
  else if (TempLenght > Count) {
    for (let ID = 0; ID < TempLenght - Count; ID++) {
      Palette.pop()
    }
  }
  Palette.map((PaletteColor, index) => {
    PaletteColor.time = Math.round(100 / (Palette.length - 1) * index)
  })
  MapPalette()
}

function MapPalette() {
  ColorContainer.innerText = null
  TimeContainer.innerText = null
  let indicatorColor = []
  Palette.map((PaletteColor, ID) => {

    let ColorDiv = document.createElement('div')
    ColorDiv.className = "Color Flex-1"
    ColorDiv.onclick = (Event) => {
      CreatePicker(Event.target)
    }

    ColorDiv.style.backgroundColor = `#${CC.rgb.hex(PaletteColor.color[0], PaletteColor.color[1], PaletteColor.color[2])}`

    ColorContainer.appendChild(ColorDiv)

    TimeInput = document.createElement('input')
    TimeInput.type = "number"
    TimeInput.className = "Time Flex-Auto"
    TimeInput.value = PaletteColor.time
    TimeInput.max = 100
    TimeInput.min = 0
    TimeInput.onchange = (Event) => {
      PaletteColor.time = parseInt(Event.target.value)
      MapPalette()
    }
    if (ID == 0 || ID == Palette.length - 1) { TimeInput.disabled = true }
    TimeContainer.appendChild(TimeInput)

    indicatorColor.push(`rgb(${PaletteColor.color[0]},${PaletteColor.color[1]},${PaletteColor.color[2]}) ${PaletteColor.time}%`)
  })
  if (Palette.length > 1) { GradientIndicator.style.background = `linear-gradient(0.25turn,${indicatorColor.join(",")})` }
  else { GradientIndicator.style.background = 'none' }
}
function OpenBin() {
  // if (FileSaved == false && Persist == true) {
  //   UTIL.CreateAlert("You might have forgotten to save bin")
  //   Persist = false
  //   return 0
  // }
  FilePath = ipcRenderer.sendSync('FileSelect', 'Bin');
  if (FilePath == undefined) { return 0 }
  // ParticleList.innerText = null
  if (fs.existsSync(FilePath.slice(0, -4) + ".json") == false) {
    ToJson()
  }
  File = require(FilePath.slice(0, -4) + ".json")
  // document.getElementById('appTitle').innerText =
  //   `Hacksaw - ${FilePath.substring(FilePath.lastIndexOf('\\') + 1)}`
  LoadFile()
}
// File = require('../skin0.json')
// LoadFile()

// function OpenBin() {
//   if (FileSaved == false && Persist == true) {
//     UTIL.CreateAlert("You might have forgotten to save bin")
//     Persist = false
//     return 0
//   }
//   FilePath = ipcRenderer.sendSync('FileSelect', 'Bin');
//   if (FilePath == undefined) { return 0 }
//   ParticleList.innerText = null
//   if (fs.existsSync(FilePath.slice(0, -4) + ".json") == false) {
//     ToJson()
//   }
//   File = require(FilePath.slice(0, -4) + ".json")
//   document.getElementById('appTitle').innerText =
//     `BinSplash - ${FilePath.substring(FilePath.lastIndexOf('\\') + 1)}`
//   LoadFile()
// }
// File = require('../skin0.json')
// LoadFile()

function LoadFile() {
  ParticleList.innerText = ""
  let ParticleObject = File.entries.value.items
  for (let PO_ID = 0; PO_ID < ParticleObject.length; PO_ID++) {
    if (ParticleObject[PO_ID].value.name == "VfxSystemDefinitionData") {
      ParticleName =
        ParticleObject[PO_ID].value.items.find((item) => {
          if (item.key == "particleName") { return item }
        }).value

      let ParticleDiv = document.createElement("div")
      ParticleDiv.id = ParticleObject[PO_ID].key
      ParticleDiv.className = "Particle-Div"
      ParticleDiv.innerHTML =
        `<div class="Particle-Title-Div Flex">
          <input type="checkbox" onclick="CheckChildren(this.parentNode.parentNode.children[1],this.checked)"/>
          <div class="Label Ellipsis Flex-1">${ParticleName}</div>
        </div>`
      let DefData = ParticleObject[PO_ID].value.items.filter(item => item.key == "complexEmitterDefinitionData" || item.key == "simpleEmitterDefinitionData")
      for (let B = 0; B < DefData.length; B++) {
        let DefDataDiv = document.createElement('div')
        DefDataDiv.className = "DefDataDiv"
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

            Emitter.className = "Flex Emitter-Div"
            let Input = document.createElement('input')
            Input.type = "checkbox"
            Input.style = `${BG == null ? "visibility:hidden" : null}`
            Emitter.appendChild(Input)
            let Title = document.createElement('div')
            Title.className = "Label Flex-1 Ellipsis"
            Title.innerText = Props[C].items[Props[C].items.findIndex(item => item.key == "emitterName")]?.value
            Emitter.appendChild(Title)
            let ColorDiv = document.createElement('div')
            ColorDiv.className = `Color-Block ${Color?.length > 1 ? "Dynamic" : "Solid"}`
            ColorDiv.style = `height:24px;width:80px;${BG == null ? "visibility:hidden" : "background:" + BG}`
            ColorDiv.innerHTML = '<div class="Copy">COPY<div>'
            ColorDiv.onclick = () => {
              Palette = Color
              MapPalette()
            }
            Emitter.appendChild(ColorDiv)

            DefDataDiv.appendChild(Emitter)
          }
        }
      }
      ParticleList.appendChild(ParticleDiv)
    }
  }
}

function FilterParticles(FilterString) {
  let ParticleListChildren = ParticleList.children
  let search = new RegExp(FilterString, "i")
  for (let I = 0; I < ParticleListChildren.length; I++) {

    let match = ParticleListChildren[I].children[0].children[1].textContent.match(search)

    if (match == null) {

      ParticleListChildren[I].style.display = "none"
      ParticleListChildren[I].children[0].children[0].checked = false
      for (let J = 0; J < ParticleListChildren[I].children[1]?.children.length; J++) {
        ParticleListChildren[I].children[1].children[J].children[0].checked = false;
      }
    }
    else {
      ParticleListChildren[I].style.display = null
    }
  }
}

function CheckAll() {
  let ParticleListChildren = ParticleList.children
  for (let I = 0; I < ParticleListChildren.length; I++) {
    if (ParticleListChildren[I].style.display != "none") {
      ParticleListChildren[I].children[0].children[0].checked = true;
      CheckChildren(ParticleListChildren[I].children[1], ParticleListChildren[I].children[0].children[0].checked)
    }
  }
}

function UnCheckAll() {
  let ParticleListChildren = ParticleList.children
  for (let I = 0; I < ParticleListChildren.length; I++) {
    if (ParticleListChildren[I].style.display != "none") {
      ParticleListChildren[I].children[0].children[0].checked = false;
      CheckChildren(ParticleListChildren[I].children[1], ParticleListChildren[I].children[0].children[0].checked)
    }
  }
}

function CheckChildren(Particle, State) {
  if (Particle == undefined) { return 0 }
  for (let J = 0; J < Particle.children.length; J++) {
    if (Particle.children[J].style.visibility != "hidden") {
      Particle.children[J].children[0].checked = State
    }
  }
}

function RecolorSelected() {
  FileSaved = false
  Persist = true
  FileCache.push(UTIL.Clone(File))

  let ParticleObject = File.entries.value.items;
  let FirstIndex = ParticleObject.findIndex(item => item.value.name == "VfxSystemDefinitionData")

  for (let PO_ID = 0; PO_ID < ParticleList.children.length; PO_ID++) {
    let DefData = ParticleObject[PO_ID + FirstIndex].value.items

    let DomDefData = ParticleList.children[PO_ID].children
    for (let B = 1; B < ParticleList.children[PO_ID].children.length; B++) {
      for (let C = 0; C < DomDefData[B].children.length; C++) {
        let DomEmitter = DomDefData[B].children[C].children
        if (DomEmitter[0].checked) {
          let Props = DefData[B - 1].value.items[C].items

          let ColorIndex = Props.findIndex(item => item?.key == "color")
          let BirthColorIndex = Props.findIndex(item => item.key == "birthColor")
          if (ColorIndex >= 0) {
            Props[ColorIndex] = UTIL.ReColor(Props[ColorIndex])
            DomEmitter[2].onclick = () => {
              Palette = UTIL.GetColor(Props[ColorIndex].value.items)
              MapPalette()
            }
            DomEmitter[2].style.background = UTIL.ToBG(UTIL.GetColor(Props[ColorIndex].value.items))
          }
          else if (BirthColorIndex >= 0) {
            Props.push({
              key: "color",
              type: "embed",
              value:
              {
                items: [JSON.parse(BlankConstant)],
                name: "ValueColor"
              }
            })

            ColorIndex = Props.length - 1
            Props[ColorIndex] = UTIL.ReColor(Props[ColorIndex])
            DomEmitter[2].onclick = () => {
              Palette = UTIL.GetColor(Props[ColorIndex].value.items)
              MapPalette()
            }
            DomEmitter[2].style.background = UTIL.ToBG(UTIL.GetColor(Props[ColorIndex].value.items))
          }
        }
      }
    }
  }
}

function Undo() {
  if (FileCache.length > 0) {
    File = UTIL.Clone(FileCache[FileCache.length - 1])
    FileCache.pop()
    LoadFile()
  }
}

function SelectRitoBin() {
  Prefs.RitoBinPath = ipcRenderer.sendSync('FileSelect', "RitoBin")
  UTIL.SavePrefs()
}

function SwitchTab(Tab) {
  for (let ID = 0; ID < Tabs.length; ID++) {
    if (Tabs[ID].id == Tab) {
      Tabs[ID].style.display = "flex"
    }
    else {
      Tabs[ID].style.display = "none"
    }
  }
}
function LoadSamples() {
  SampleContainer.innerText = null
  Prefs.ColorSamples.map((Sample, ID) => {
    let SampleDiv = document.createElement('div')
    SampleDiv.className = "flex m-2 p-1 rounded-lg"
    SampleDiv.style.background = UTIL.ToBG(Sample.value)

    SampleContainer.appendChild(SampleDiv)
    let SampleButton = document.createElement("button")
    SampleButton.className = "btn-reg-black bg-opacity-20 px-3"
    SampleButton.innerText = "Sample"
    SampleButton.onclick = () => {
      Palette = UTIL.Clone(Sample.value)
      MapPalette()
    }
    SampleDiv.appendChild(SampleButton)

    let SampleExport = document.createElement("button")
    SampleExport.className = "btn-reg-black bg-opacity-20 px-3"
    SampleExport.innerText = "Export"
    SampleExport.onclick = () => {
      ExportSamples(Sample)
    }
    SampleDiv.appendChild(SampleExport)

    let SampleDelete = document.createElement("button")
    SampleDelete.className = "btn-reg-black bg-opacity-20 px-3"
    SampleDelete.innerText = "Delete"
    SampleDelete.onclick = () => {
      Prefs.ColorSamples.splice(ID, 1)
      UTIL.SavePrefs()
      LoadSamples()
    }
    SampleDiv.appendChild(SampleDelete)

    let SampleTitle = document.createElement('input')
    SampleTitle.className = "bg-black flex-1 bg-opacity-20 rounded-lg text-center text-gray-300"
    SampleTitle.value = Sample.name
    SampleTitle.onchange = (event) => {
      Sample.name = event.target.value
      UTIL.SavePrefs()
    }
    SampleDiv.appendChild(SampleTitle)
  })
}

function SaveSample() {
  Prefs.ColorSamples.push(
    {
      "name": `unnamed ${Prefs.ColorSamples.length}`,
      "value": UTIL.Clone(Palette)
    }
  )
  UTIL.SavePrefs()
}
function OpenSampleWindow() {
  UTIL.CreateSampleWindow()
}


function ExportSamples(Samples = null) {
  let Folder = ipcRenderer.sendSync('FileSelect', 'Folder')
  if (Folder == "") { return 0 }

  if (Samples == null) {
    fs.writeFileSync(
      Folder + "\\AllSamples.json"
      , JSON.stringify(Prefs.ColorSamples, null, 2), "utf8"
    )
  }
  else {
    fs.writeFileSync(
      Folder + "\\" + Samples.name + ".json"
      , JSON.stringify(Samples, null, 2), "utf8"
    )
  }
}

function ImportSample() {
  let Samples = JSON.parse(fs.readFileSync(ipcRenderer.sendSync('FileSelect', "Json")).toString())

  if (Samples.constructor == [].constructor) {
    Samples.map(Sample => {
      Prefs.ColorSamples.push(Sample)
    })
  }
  else {
    Prefs.ColorSamples.push(Samples)
  }

  UTIL.SavePrefs()
  LoadSamples()
}

function SaveBin() {
  fs.writeFileSync((FilePath.slice(0, -4) + ".json"), JSON.stringify(File, null, 2), "utf8")
  ToBin()
  FileSaved = true
}

function ToJson() {
  execSync(`"${Prefs.RitoBinPath}" -o json "${(FilePath)}"`)
}

function ToBin() {
  execSync(`"${Prefs.RitoBinPath}" -o bin "${(FilePath.slice(0, -4) + ".json")}"`)
}

function SelectRitoBin() {
  Prefs.RitoBinPath = ipcRenderer.sendSync('FileSelect', "RitoBin")
}

ChangeColorCount(2)
//LoadSamples()
