const Open = require('open');
/**
 * Maps given value from one int range to another.
 * @param {List} from - initial range ex: [0,10]
 * @param {List} to - secondary range ex: [2,9]
 */
function ReMap(value, from, to) {
  if (to == [0, 255]) {
    return Math.round((value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0]);
  }
  else {
    return (value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0];
  }
}

function GetColor(ColorProp) {
  if (ColorProp == undefined) {
    return null
  }
  else {
    if (ColorProp[ColorProp.findIndex(item => item.key == "dynamics")]) {
      let TempDyn = ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items
      let Palette = []

      for (let ID = 0; ID < TempDyn[1].value.items.length; ID++) {
        Palette.push(
          {
            time: UTIL.ReMap(TempDyn[TempDyn.findIndex(item => item.key == "times")].value.items[ID], [0, 1], [0, 100]),
            color:
              [
                UTIL.ReMap(TempDyn[TempDyn.findIndex(item => item.key == "values")].value.items[ID][0], [0, 1], [0, 255]),
                UTIL.ReMap(TempDyn[TempDyn.findIndex(item => item.key == "values")].value.items[ID][1], [0, 1], [0, 255]),
                UTIL.ReMap(TempDyn[TempDyn.findIndex(item => item.key == "values")].value.items[ID][2], [0, 1], [0, 255]),
                UTIL.ReMap(TempDyn[TempDyn.findIndex(item => item.key == "values")].value.items[ID][3], [0, 1], [0, 255])
              ]
          }
        )
      }

      return Palette
    }
    else {
      let TempConst = ColorProp[ColorProp.findIndex(item => item.key == "constantValue")]

      let Palette = [
        {
          time: 0,
          color:
            [
              UTIL.ReMap(TempConst.value[0], [0, 1], [0, 255]),
              UTIL.ReMap(TempConst.value[1], [0, 1], [0, 255]),
              UTIL.ReMap(TempConst.value[2], [0, 1], [0, 255])
            ]
        }
      ]

      return Palette
    }
  }
}

function ToBG(Palette) {
  if (Palette?.length == 1) {
    return `RGB(${Math.round(Palette[0].color[0])},${Math.round(Palette[0].color[1])},${Math.round(Palette[0].color[2])})`
  } else if (Palette?.length > 1) {
    let result = []
    for (let ID = 0; ID < Palette?.length; ID++) {
      result.push(`RGB(${Math.round(Palette[ID].color[0])},${Math.round(Palette[ID].color[1])},${Math.round(Palette[ID].color[2])}) ${Math.round(Palette[ID].time)}%`)
    }
    return `linear-gradient(0.25turn,${result.join(',')})`
  }
}

function ReColor(ColorProp) {
  let DynamicsIndex = ColorProp.value.items.findIndex(item => item.key == "dynamics")
  let ConstantIndex = ColorProp.value.items.findIndex(item => item.key == "constantValue")

  if (DynamicsIndex >= 0 && Palette.length > 1) {
    let ColorValue = ColorProp.value.items.find(item => item.key == "dynamics").value.items
    if (JSON.stringify(ColorValue).match('probability') != undefined) {
      ColorValue.shift()
    }

    if (Prefs.Advanced) {
      let KeepTimings
      if (ColorValue[1].value.items.length == Palette.length) {
        KeepTimings = true
      }
      else {
        KeepTimings = false
        ColorValue[1].value.items = []
        ColorValue[0].value.items = []
      }

      Palette.map((item, i) => {
        if (KeepTimings == true) {
          ColorValue[0].value.items[i] = ReMap(item.time, [0, 100], [0, 1])

          ColorValue[1].value.items[i] =
            [
              ReMap(item.color[0], [0, 255], [0, 1]),
              ReMap(item.color[1], [0, 255], [0, 1]),
              ReMap(item.color[2], [0, 255], [0, 1]),
              (i == 0 || i == Palette.length - 1) ? 0 : 1
            ]
        }
        else {
          ColorValue[0].value.items.push(ReMap(item.time, [0, 100], [0, 1]))

          ColorValue[1].value.items.push([
            ReMap(item.color[0], [0, 255], [0, 1]),
            ReMap(item.color[1], [0, 255], [0, 1]),
            ReMap(item.color[2], [0, 255], [0, 1]),
            (i == 0 || i == Palette.length - 1) ? 0 : 1
          ])
        }
      })
      ColorProp[DynamicsIndex] = ColorValue
    }
    else {
      for (let i = 0; i < ColorValue[1].value.items.length; i++) {
        let ColorBit = ColorValue[1].value.items[i]
        if (Prefs.IgnoreBW) {
          if (!((ColorBit[0] == 0 && ColorBit[1] == 0 && ColorBit[2] == 0)
            || (ColorBit[0] == 1 && ColorBit[1] == 1 && ColorBit[2] == 1))) {
            let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color

            for (let j = 0; j < ColorBit.length - 1; j++) {
              ColorBit[j] = ReMap(NewColor[j], [0, 255], [0, 1])
            }
          }
        }
        else {
          let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color

          for (let j = 0; j < ColorBit.length - 1; j++) {
            ColorBit[j] = ReMap(NewColor[j], [0, 255], [0, 1])
          }
        }
      }
    }
    ColorProp[DynamicsIndex] = ColorValue
  }
  else if (ConstantIndex >= 0) {
    let ColorValue = ColorProp.value.items[ConstantIndex].value
    if (JSON.stringify(ColorValue).match('probability') != undefined) {
      console.log(ColorValue)
    }
    if (Prefs.IgnoreBW) {
      if (!((ColorValue[0] == 0 && ColorValue[1] == 0 && ColorValue[2] == 0)
        || (ColorValue[0] == 1 && ColorValue[1] == 1 && ColorValue[2] == 1))) {
        let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color

        ColorValue[0] = ReMap(NewColor[0], [0, 255], [0, 1])
        ColorValue[1] = ReMap(NewColor[1], [0, 255], [0, 1])
        ColorValue[2] = ReMap(NewColor[2], [0, 255], [0, 1])
      }
    }
    else {
      let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color

      ColorValue[0] = ReMap(NewColor[0], [0, 255], [0, 1])
      ColorValue[1] = ReMap(NewColor[1], [0, 255], [0, 1])
      ColorValue[2] = ReMap(NewColor[2], [0, 255], [0, 1])
    }
    ColorValue[3] = 1
    //console.log(ColorProp.value)
  }
  return ColorProp
}

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
    // let alertdiv = document.createElement("div")
    // alertdiv.className = "Margin Flex-1 Flex-Col"

    // Prefs.ColorSamples.map((Sample) => {
    //   let info = document.createElement("div")
    //   info.innerText = Sample.name
    //   info.style.background = ToBG(Sample.value)
    //   alertdiv.appendChild(info)
    // })
    // dim.appendChild(alertdiv)

    let DismissDiv = document.createElement("div")
    DismissDiv.className = "Input-Group Margin-Top"

    let Dismiss = document.createElement("button")
    Dismiss.className = "Flex-1"
    Dismiss.textContent = "OK"
    Dismiss.onclick = () => { 
      Dim.remove()
      SideBarToggle()
      document.getElementById("Nav5").click()
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

      let UseThis = document.createElement('button')
      UseThis.onclick = () => {
        Palette = UTIL.Clone(Sample.value)
        MapPalette()
        Dim.remove()
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
  Prefs.Advanced = document.getElementById("Advanced").checked
  Prefs.IgnoreBW = document.getElementById("IgnoreBW").checked
  if (Prefs.Advanced) {
    GradientIndicator.style.display = "flex"
    TimeContainer.style.display = "flex"
  }
  else {
    GradientIndicator.style.display = "none"
    TimeContainer.style.display = "none"
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

function Clone(Object) { return JSON.parse(JSON.stringify(Object)) }
module.exports = { SavePrefs, GetChildIndex, ReMap, GetColor, ToBG, Clone, ReColor, CreateAlert, CreateSampleWindow }