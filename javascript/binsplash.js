const { execSync } = require('child_process');
const CC = require('color-convert');
const { getColorHexRGB } = require('electron-color-picker');
const { clipboard } = require('electron');
let FileHistory = []
let RecolorMode = document.getElementById('Mode')
let RecolorTarget = document.getElementById('Target')

const PickScreen = async () => {
  const color = await getColorHexRGB().catch((error) => {
    console.warn('[ERROR] getColor', error)
    return ''
  })
  let ColorInput = document.getElementById('Hex')
  ColorInput.value = color
  let SubmitEvent = new Event('change')
  ColorInput.dispatchEvent(SubmitEvent)
}

function CreatePicker(Target) {
  if (document.getElementById('Pop-Up') == undefined) {
    let temp = Target.style.backgroundColor.match(/\d+/g)

    let ColorPicker = document.createElement('div')
    ColorPicker.className = "Flex-Col Outline"
    ColorPicker.id = "Pop-Up"
    ColorPicker.position = "absolute";
    ColorPicker.top = "11em";


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
    ColorInput.oninput = (E) => {
      Hex.value = E.target.value
      Target.style.backgroundColor = E.target.value
    }
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
      if (!Event.target.value.startsWith('#')) {
        Event.target.value = '#' + Event.target.value
      }
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

    document.getElementById('Slider-Container').appendChild(ColorPicker)
  } else {
    document.getElementById('Pop-Up').remove()
    CreatePicker(Target)
  }
}

var FileSaved = true
window.onerror = function (msg, error, lineNo, columnNo) {
  UTIL.CreateAlert(`Error`, `Click here to copy to clipboard`,true, () => { clipboard.writeText(`Message: ${msg}\n\nError: ${error},\n\nRaised at: ${lineNo} : ${columnNo}`) })
}


let BlankDynamic = `{"key":"dynamics","type":"pointer","value":{"items":[{"key":"times","type":"list","value":{"items":[],"valueType":"f32"}},{"key":"values","type":"list","value":{"items":[],"valueType":"vec4"}}],"name":"VfxAnimatedColorVariableData"}}`

let BlankConstant = `{"key":"constantValue","type":"vec4","value":[0.5,0.5,0.5,1]}`

let FileCache = []

let Palette = [NewRandomColor()]

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
  else { GradientIndicator.style.background = `rgb(${Palette[0].color[0]},${Palette[0].color[1]},${Palette[0].color[2]})` }
}
function OpenBin() {
  FilePath = ipcRenderer.sendSync('FileSelect', ['Select Bin to edit', 'Bin']);
  document.title = `HackSaw - ${FilePath.split('\\').pop()}`
  if (FilePath == undefined) { return 0 }
  if (fs.existsSync(FilePath.slice(0, -4) + ".json") == false) {
    ToJson()
  }
  File = UTIL.Clone(fs.readFileSync(FilePath.slice(0, -4) + ".json", 'utf-8'))

  LoadFile()
  FileCache = []
  if (!FileHistory.includes(FilePath.slice(0, -4) + ".json")) {
    FileHistory.push(FilePath.slice(0, -4) + ".json")
  }
}


function LoadFile(SkipAlert = false) {
  ParticleList.innerText = ""
  let ParticleObject = File.entries.value.items
  if (/ValueColor/.test(JSON.stringify(ParticleObject)) == false) {
    UTIL.CreateAlert('Bin Empty', 'No color values found')
    return 0
  }

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
          if (DefData[B].key == "complexEmitterDefinitionData" || DefData[B].key == "simpleEmitterDefinitionData") {

            let Color = Props[C].items.find(item => item.key == "color") != undefined ?
              UTIL.GetColor(
                Props[C].items.find(item => item.key == "color")
              ) : null
            let BirthColor = Props[C].items.find(item => item.key == "birthColor") != undefined ?
              UTIL.GetColor(
                Props[C].items.find(item => item.key == "birthColor")
              ) : null
            
            // let ReflectionColor = Props[C].items.find(item => item.key == "reflectionDefinition") != undefined ?
            //   UTIL.GetColor(
            //     Props[C].items.find(item => item.key == "reflectionDefinition").value.items
            //     .find(item => item.key == "fresnelColor").value
            //   ) : null
            let ReflectionColor = Props[C].items.find(item => item.key == "reflectionDefinition") != undefined ?
              Props[C].items.find(item => item.key == "reflectionDefinition").value.items
              .find(item => item.key == "fresnelColor") != undefined? UTIL.GetColor(
                Props[C].items.find(item => item.key == "reflectionDefinition").value.items
                .find(item => item.key == "fresnelColor").value
              ): null:null
              
            let LingerColor = Props[C].items.find(item => item.key == "lingerColor") != undefined ?
              UTIL.GetColor(
                Props[C].items.find(item => item.key == "lingerColor")
              ) : null
            
            let BG =
              UTIL.ToBG(
                Color
              )
            let BCBG =
              UTIL.ToBG(
                BirthColor
              )
            let RCBG =
              UTIL.ToBG(
                ReflectionColor
              )
            let LCBG = 
              UTIL.ToBG(
                LingerColor
              )

            let Emitter = document.createElement('div')

            Emitter.className = "Flex Emitter-Div"
            let Input = document.createElement('input')
            Input.type = "checkbox"
            Input.className = `${BG == null && BCBG == null && RCBG == null && LCBG == null? "Blank-Obj" : null}`
            Input.disabled = BG == null && BCBG == null && RCBG == null && LCBG == null? true : false
            Emitter.appendChild(Input)
            let Title = document.createElement('div')
            Title.className = "Label Flex-1 Ellipsis"
            Title.innerText = Props[C].items[Props[C].items.findIndex(item => item.key == "emitterName")]?.value
            Emitter.appendChild(Title)

            let FresnelDiv = document.createElement('div')
            FresnelDiv.className = `Prop-Block-Secondary ${RCBG == null ? "Blank-Obj" : "Pointer"}`
            FresnelDiv.style = `height:24px;${RCBG == null ? null : "background:" + RCBG}`
            FresnelDiv.innerHTML = '<div>Fresnel<div>'
            Emitter.appendChild(FresnelDiv)
            if (RCBG != null) {
              FresnelDiv.onclick = () => {
                Palette = UTIL.Clone(ReflectionColor)
                MapPalette()
                document.getElementById('Slider-Input').value = Palette.length
              }
            }

            let BirthDiv = document.createElement('div')
            BirthDiv.className = `Prop-Block-Secondary ${BCBG == null ? "Blank-Obj" : "Pointer"}`
            BirthDiv.style = `height:24px;${BCBG == null ? null : "background:" + BCBG}`
            BirthDiv.innerHTML = '<div>Birth<div>'

            if (BCBG != null) {
              BirthDiv.onclick = () => {
                Palette = UTIL.Clone(BirthColor)
                MapPalette()
                document.getElementById('Slider-Input').value = Palette.length
              }
            }
            Emitter.appendChild(BirthDiv)

            let LingerDiv = document.createElement('div')
            LingerDiv.className = `Prop-Block-Secondary ${LCBG == null ? "Blank-Obj" : "Pointer"}`
            LingerDiv.style = `height:24px;${LCBG == null ? null : "background:" + LCBG}`
            LingerDiv.innerHTML = '<div>Linger<div>'

            if (LCBG != null) {
              LingerDiv.onclick = () => {
                Palette = UTIL.Clone(LingerColor)
                MapPalette()
                document.getElementById('Slider-Input').value = Palette.length
              }
            }
            Emitter.appendChild(LingerDiv)

            let ColorDiv = document.createElement('div')
            ColorDiv.className = `Prop-Block ${BG == null ? "Blank-Obj" : "Pointer"} ${Color?.length > 1 ? "Dynamic" : "Solid"}`
            ColorDiv.style = `height:24px;width:100px;${BG == null ? null : "background:" + BG}`
            ColorDiv.innerHTML = '<div>COPY<div>'

            if (BG != null) {
              ColorDiv.onclick = () => {
                Palette = UTIL.Clone(Color)
                MapPalette()
                document.getElementById('Slider-Input').value = Palette.length
              }
            }
            Emitter.appendChild(ColorDiv)

            let BMID = Props[C].items.findIndex(item => item.key == "blendMode")

            let BlendMode = document.createElement('input')
            BlendMode.className = `Blend-Mode`
            BlendMode.type = 'number'
            BlendMode.min = 0
            BlendMode.max = 9
            BlendMode.disabled = BMID >= 0 ? false : true
            if (BMID >= 0) {
              BlendMode.placeholder = Props[C].items[BMID].value
              BlendMode.onchange = (Event) => {
                Props[C].items[BMID].value = parseInt(Event.target.value)
              }
            }
            Emitter.appendChild(BlendMode)

            DefDataDiv.appendChild(Emitter)
          }
        }
      }
      ParticleList.appendChild(ParticleDiv)
    }
  }
  if(!SkipAlert){
    UTIL.CreateAlert('Success', 'File Loaded Successfully')
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
    if (Particle.children[J].style.visibility != "hidden" && Particle.children[J].children[0].disabled != true) {
      Particle.children[J].children[0].checked = State
    }
  }
}

function RecolorSelected() {
  FileSaved = false
  FileCache.push(UTIL.Clone(File))
  let ParticleObject = File.entries.value.items;

  for (let PO_ID = 0; PO_ID < ParticleList.children.length; PO_ID++) {
    let Adjusted_ID = ParticleObject.findIndex(item => item.key == ParticleList.childNodes[PO_ID].id)
    let DefData = ParticleObject[Adjusted_ID].value.items

    let DomDefData = ParticleList.children[PO_ID].children
    for (let B = 1; B < ParticleList.children[PO_ID].children.length; B++) {

      for (let C = 0; C < DomDefData[B].children.length; C++) {
        let DomEmitter = DomDefData[B].children[C].children

        if (DomEmitter[0].checked) {
          let Props = DefData[B - 1].value.items[C].items

          let ColorIndex = Props.findIndex(item => item?.key == "color")
          let BirthColorIndex = Props.findIndex(item => item.key == "birthColor")
          let ReflectionIndex = Props.findIndex(item => item?.key == "reflectionDefinition")
          let LingerIndex = Props.findIndex(item => item?.key == "lingerColor")

          let HasConstant = /constantValue/.test(JSON.stringify(Props[ColorIndex]))
          let HasDynamics = /dynamics/.test(JSON.stringify(Props[ColorIndex]))

          if (BirthColorIndex >= 0 && (RecolorTarget.value == 0 || RecolorTarget.value == 1) && /dynamics/.test(JSON.stringify(Props[BirthColorIndex]))) {
            Props[BirthColorIndex].value.items = [UTIL.Clone(BlankConstant)]
          }
          
          if (RecolorMode.value == 1) {
            if (Palette.length > 1) {
              if (ColorIndex >= 0 && HasConstant && !HasDynamics) {
                Props[ColorIndex].value.items = []
                Props[ColorIndex].value.items[0] = UTIL.Clone(BlankDynamic)
              }
              else if (ColorIndex < 0 && BirthColorIndex >= 0) {
                ColorIndex = Props.length
                Props.push({
                  key: "color",
                  type: "embed",
                  value: {
                    items: [UTIL.Clone(BlankDynamic)],
                    name: "ValueColor"
                  }
                })
              }
            }
            else {
              if (ColorIndex < 0 && BirthColorIndex >= 0) {
                ColorIndex = UTIL.Clone(Props.length)
                Props.push({
                  key: "color",
                  type: "embed",
                  value: {
                    items: [UTIL.Clone(BlankConstant)],
                    name: "ValueColor"
                  }
                })
              }
              else if (ColorIndex >= 0 && HasDynamics) {
                Props[ColorIndex].value.items = []
                Props[ColorIndex].value.items[0] = UTIL.Clone(BlankConstant)
              }
            }
          }

          if (ReflectionIndex >= 0 && (RecolorTarget.value == 0 || RecolorTarget.value == 3)) {
            let FresnelIndex = Props[ReflectionIndex].value.items.findIndex(item => item.key == 'fresnelColor')
            Props[ReflectionIndex].value.items[FresnelIndex].value = UTIL.ReColor(Props[ReflectionIndex].value.items[FresnelIndex].value)

            DomEmitter[2].style.background = UTIL.ToBG(UTIL.GetColor(Props[ReflectionIndex].value.items[FresnelIndex].value))
            DomEmitter[2].onclick = () => {
              Palette = UTIL.GetColor(Props[ReflectionIndex].value.items[FresnelIndex].value)
              MapPalette()
              document.getElementById('Slider-Input').value = Palette.length
            }
          }

          if (BirthColorIndex >= 0 && (RecolorTarget.value == 0 || RecolorTarget.value == 1)) {
            Props[BirthColorIndex] = UTIL.ReColor(Props[BirthColorIndex])
            DomEmitter[3].style.background = UTIL.ToBG(UTIL.GetColor(Props[BirthColorIndex]))
            DomEmitter[3].onclick = () => {
              Palette = UTIL.GetColor(Props[BirthColorIndex])
              MapPalette()
              document.getElementById('Slider-Input').value = Palette.length
            }
          }
          if (LingerIndex >= 0 && (RecolorTarget.value == 0 || RecolorTarget.value == 4)) {
            Props[LingerIndex] = UTIL.ReColor(Props[LingerIndex])
            DomEmitter[4].style.background = UTIL.ToBG(UTIL.GetColor(Props[LingerIndex]))
            DomEmitter[4].onclick = () => {
              Palette = UTIL.GetColor(Props[LingerIndex])
              MapPalette()
              document.getElementById('Slider-Input').value = Palette.length
            }
          }

          if (ColorIndex >= 0 && (RecolorTarget.value == 0 || RecolorTarget.value == 2)) {
            Props[ColorIndex] = UTIL.ReColor(Props[ColorIndex])
            DomEmitter[5].style.background = UTIL.ToBG(UTIL.GetColor(Props[ColorIndex]))
            DomEmitter[5].onclick = () => {
              Palette = UTIL.GetColor(Props[ColorIndex])
              MapPalette()
              document.getElementById('Slider-Input').value = Palette.length
            }
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
    LoadFile(true)
  }
  FilterParticles(document.getElementById('Filter').value)
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

function SaveBin() {
  fs.writeFileSync((FilePath.slice(0, -4) + ".json"), JSON.stringify(File, null, 2), "utf8")
  ToBin()
  FileSaved = true
  for (let i = 0; i < FileHistory.length; i++) {
    File = null
    fs.unlinkSync(FileHistory[i])
  }
  FileHistory = []
}

function ToJson() {
  execSync(`"${Prefs.RitoBinPath}" -o json "${(FilePath)}"`)
}

function ToBin() {
  execSync(`"${Prefs.RitoBinPath}" -o bin "${(FilePath.slice(0, -4) + ".json")}"`)
  UTIL.CreateAlert('Success', 'File Saved Successfully')
}

ChangeColorCount(1)