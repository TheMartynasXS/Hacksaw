const Open = require('open');

/**
 * Maps given value from one int range to another.
 * @param {List} from - initial range ex: [0,10]
 * @param {List} to - secondary range ex: [2,9]
 */
function ReMap(value, from, to) {
  if (to == [0, 255]) {
    return (Math.round((value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0]))
  }
  else {
    return (value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0];
  }
}

function GetColor(ColorProp) {
  //return [{ time: 0, color: [0, 255, 0, 1] }]
  let ColorIndex = ColorProp.value.items.findIndex(item => item.key == "dynamics") >= 0 ?
    ColorProp.value.items.findIndex(item => item.key == "dynamics") :
    ColorProp.value.items.findIndex(item => item.key == "constantValue")

  let ColorValue = ColorProp.value.items[ColorIndex].key == "dynamics" ? ColorProp.value.items[ColorIndex].value.items : ColorProp.value.items[ColorIndex].value
  if (JSON.stringify(ColorValue).match('probability') != undefined) {
    ColorValue.shift()
  }
  if (typeof (ColorValue[0]) == 'number') {
    let Palette = [
      {
        time: 0,
        color:
          [
            UTIL.ReMap(ColorValue[0], [0, 1], [0, 255]),
            UTIL.ReMap(ColorValue[1], [0, 1], [0, 255]),
            UTIL.ReMap(ColorValue[2], [0, 1], [0, 255])
          ]
      }
    ]
    return Palette
  }
  else {
    let Palette = []
    for (let ID = 0; ID < ColorValue[0].value.items.length; ID++) {
      Palette.push(
        {
          time: parseFloat(UTIL.ReMap(ColorValue[ColorValue.findIndex(item => item.key == "times")].value.items[ID], [0, 1], [0, 100]).toPrecision(6)),
          color:
            [
              UTIL.ReMap(ColorValue[ColorValue.findIndex(item => item.key == "values")].value.items[ID][0], [0, 1], [0, 255]),
              UTIL.ReMap(ColorValue[ColorValue.findIndex(item => item.key == "values")].value.items[ID][1], [0, 1], [0, 255]),
              UTIL.ReMap(ColorValue[ColorValue.findIndex(item => item.key == "values")].value.items[ID][2], [0, 1], [0, 255]),
              UTIL.ReMap(ColorValue[ColorValue.findIndex(item => item.key == "values")].value.items[ID][3], [0, 1], [0, 255])
            ]
        }
      )
    }
    return Palette
  }

}

function ToBG(Palette) {
  if (Palette?.length == 1) {
    return `RGB(${Math.round(Palette[0].color[0])},${Math.round(Palette[0].color[1])},${Math.round(Palette[0].color[2])})`
  } else if (Palette?.length > 1) {
    let result = []
    for (let ID = 0; ID < Palette?.length; ID++) {
      result.push(`RGB(${Math.round(Palette[ID].color[0])},${Math.round(Palette[ID].color[1])},${Math.round(Palette[ID].color[2])}) ${parseInt(Palette[ID].time, 10)}%`)
    }

    return `linear-gradient(0.25turn,${result.join(',')})`
  }
}

function ReColor(ColorProp) {
  let ColorIndex = ColorProp.value.items.findIndex(item => item.key == "dynamics") >= 0 ?
    ColorProp.value.items.findIndex(item => item.key == "dynamics") :
    ColorProp.value.items.findIndex(item => item.key == "constantValue")

  let ColorValue = ColorProp.value.items[ColorIndex].key == "dynamics" ? ColorProp.value.items[ColorIndex].value.items : ColorProp.value.items[ColorIndex].value
  if (JSON.stringify(ColorValue).match('probability') != undefined) {
    ColorValue.shift()
  }
  if (!Prefs.Advanced) {
    if (typeof (ColorValue[0]) == 'number') {
      let temp = [
        ReMap(Palette[0].color[0], [0, 255], [0, 1]),
        ReMap(Palette[0].color[1], [0, 255], [0, 1]),
        ReMap(Palette[0].color[2], [0, 255], [0, 1])
      ]
      ColorValue[0] = temp[0]
      ColorValue[1] = temp[1]
      ColorValue[2] = temp[2]
    }
    else {
      for (let i = 0; i < ColorValue[0].value.items.length; i++) {
        let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color
        ColorValue[1].value.items[i][0] = ReMap(NewColor[0], [0, 255], [0, 1])
        ColorValue[1].value.items[i][1] = ReMap(NewColor[1], [0, 255], [0, 1])
        ColorValue[1].value.items[i][2] = ReMap(NewColor[2], [0, 255], [0, 1])
      }
    }
  }
  else {
    if (typeof (ColorValue[0]) == 'number') {
      let temp = [
        ReMap(Palette[0].color[0], [0, 255], [0, 1]),
        ReMap(Palette[0].color[1], [0, 255], [0, 1]),
        ReMap(Palette[0].color[2], [0, 255], [0, 1])
      ]
      ColorValue[0] = temp[0]
      ColorValue[1] = temp[1]
      ColorValue[2] = temp[2]
    }
    else {
      for (let i = 0; i < Palette.length; i++) {
        ColorValue[0].value.items[i] = ReMap(Palette[i].time, [0, 100], [0, 1])
        let NewColor = Palette[i].color
        ColorValue[1].value.items[i] = i == 0 || i == Palette.length - 1 ?
          [
            ReMap(NewColor[0], [0, 255], [0, 1]),
            ReMap(NewColor[1], [0, 255], [0, 1]),
            ReMap(NewColor[2], [0, 255], [0, 1]), 0
          ] : [
            ReMap(NewColor[0], [0, 255], [0, 1]),
            ReMap(NewColor[1], [0, 255], [0, 1]),
            ReMap(NewColor[2], [0, 255], [0, 1]), 1
          ]
      }
      ColorValue[0].value.items.length = Palette.length
      ColorValue[1].value.items.length = Palette.length
    }
  }
  return ColorProp
}
/**
 * Creates an alert popup with given message
 * @param {string} message - alert message
 */
function CreateAlert(message) {
  if (document.getElementById("Dim") != undefined) {
    document.getElementById("Dim").remove()
    CreateAlert(message)
  }
  else {
    let Dim = document.createElement("div")
    Dim.id = "Dim"
    Dim.className = "Flex-Col"
    document.getElementById("Root").appendChild(Dim)

    let Modal = document.createElement("div")
    Modal.className = "Modal Flex-1 Margin Flex-Col"
    Dim.appendChild(Modal)

    let AlertContent = document.createElement("div")
    AlertContent.className = "AlertContent Flex-1 Text"
    AlertContent.innerText = message

    Modal.appendChild(AlertContent)
    let DismissDiv = document.createElement("div")
    DismissDiv.className = "Input-Group Margin-Top"

    let Dismiss = document.createElement("button")
    Dismiss.className = "Flex-1"
    Dismiss.textContent = "OK"
    Dismiss.onclick = () => {
      Dim.remove()
      //SideBarToggle()
      //document.getElementById("Nav5").click()
    }

    DismissDiv.appendChild(Dismiss)

    Modal.appendChild(DismissDiv)
  }
}

function OpenGitHub() {
  Open('https://github.com/DevMarcius/binsplash')
}

function CreateSampleWindow() {
  if (document.getElementById("Dim") != undefined) {
    document.getElementById("Dim").remove()
    CreateSampleWindow()
  }
  else {
    let Dim = document.createElement("div")
    Dim.id = "Dim"
    Dim.className = "Flex-Col"
    document.getElementById("Root").appendChild(Dim)

    let Modal = document.createElement("div")
    Modal.className = "Modal Flex-1 Margin Flex-Col"
    Dim.appendChild(Modal)

    let SampleFunctions = document.createElement("div")
    SampleFunctions.className = "Input-Group Margin-Bottom"

    let ExportAll = document.createElement("button")
    ExportAll.className = "Flex-1"
    ExportAll.textContent = "Export All"
    ExportAll.onclick = () => { ExportSamples() }
    SampleFunctions.appendChild(ExportAll)

    let Import = document.createElement("button")
    Import.className = "Flex-1"
    Import.textContent = "Import"
    Import.onclick = () => { ImportSample() }
    SampleFunctions.appendChild(Import)

    Modal.appendChild(SampleFunctions)

    let AlertContent = document.createElement("div")
    AlertContent.className = "AlertContent Flex-1 Text"

    Modal.appendChild(AlertContent)

    Prefs.ColorSamples.map((Sample, ID) => {
      let SampleDom = document.createElement("div")
      SampleDom.className = "Input-Group Sample"
      SampleDom.style.background = ToBG(Sample.value)

      let SwapDiv = document.createElement('div')
      SwapDiv.className = "Flex"
      let UpButton = document.createElement('button')
      UpButton.innerText = "▲"
      UpButton.onclick = (Event) => {
        if (ID > 0) {
          [Prefs.ColorSamples[ID - 1], Prefs.ColorSamples[ID]] = [Prefs.ColorSamples[ID], Prefs.ColorSamples[ID - 1]]
          SavePrefs()
          CreateSampleWindow()
        }
      }
      let DownButton = document.createElement('button')
      DownButton.innerText = "▼"
      DownButton.onclick = (Event) => {
        if (ID < Prefs.ColorSamples.length - 1) {
          [Prefs.ColorSamples[ID], Prefs.ColorSamples[ID + 1]] = [Prefs.ColorSamples[ID + 1], Prefs.ColorSamples[ID]]
          SavePrefs()
          CreateSampleWindow()
        }
      }
      SwapDiv.appendChild(UpButton)
      SwapDiv.appendChild(DownButton)
      SampleDom.appendChild(SwapDiv)

      let UseThis = document.createElement('button')
      UseThis.onclick = () => {
        Palette = UTIL.Clone(Sample.value)
        MapPalette()
        Dim.remove()
        document.getElementById('Slider-Input').value = Palette.length
      }
      UseThis.innerText = "Sample"
      SampleDom.appendChild(UseThis)

      let Export = document.createElement('button')
      Export.onclick = () => {
        ExportSamples(Prefs.ColorSamples[ID])
      }
      Export.innerText = "Export"
      SampleDom.appendChild(Export)

      let Delete = document.createElement('button')
      Delete.innerText = "Delete"
      Delete.onclick = (Event) => {
        Prefs.ColorSamples.splice(ID, 1)
        Event.target.parentNode.remove()
        SavePrefs()
      }
      SampleDom.appendChild(Delete)

      let Title = document.createElement('input')
      Title.value = Sample.name
      Title.className = "Flex-1"
      Title.onchange = (Event) => {
        Prefs.ColorSamples[ID].name = Event.target.value
        SavePrefs()
      }
      SampleDom.appendChild(Title)


      AlertContent.appendChild(SampleDom)
    })

    let DismissDiv = document.createElement("div")
    DismissDiv.className = "Input-Group Margin-Top"

    let Dismiss = document.createElement("button")
    Dismiss.className = "Flex-1"
    Dismiss.textContent = "CANCEL"
    Dismiss.onclick = () => { Dim.remove() }

    DismissDiv.appendChild(Dismiss)
    Modal.appendChild(DismissDiv)
  }
}
function SavePrefs() {
  try {

    Prefs.Advanced = document.getElementById("Advanced").checked
    Prefs.IgnoreBW = document.getElementById("IgnoreBW").checked
  } catch (error) {

  }
  fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf8")
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
  SavePrefs()
  CreateSampleWindow()
}
function GetChildIndex(Node) {
  return Array.prototype.indexOf.call(Node.parentNode.childNodes, Node);
}

function SelectRitoBin() {
  Prefs.RitoBinPath = ipcRenderer.sendSync('FileSelect', "RitoBin")
  UTIL.SavePrefs()
}

function Clone(Object) { return JSON.parse(JSON.stringify(Object)) }
module.exports = {
  SavePrefs, GetChildIndex, ReMap, GetColor, ToBG,
  Clone, ReColor, CreateAlert, CreateSampleWindow
}