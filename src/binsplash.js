const { execSync } = require('child_process');
const { ipcRenderer} = require('electron');
const fs = require('fs');
const path = require('path');
const UTIL = require('../src/utilities');
const Open = require('open')

let FileSaved = true
let Persist = true
window.onerror = function (msg, error, lineNo, columnNo) {
  CreateAlert(`Message: ${msg}\n\nError: ${error},\n\nRaised at: ${lineNo} : ${columnNo}`)
}
function CreateAlert(message)
{
  if (document.getElementById("dim-bg") != undefined)
  {
    document.getElementById("dim-bg").remove()
    CreateAlert(message)
  }
  else
  {
    let dim = document.createElement("div")
    dim.className = "justify-center content-center flex-1 h-full w-full flex absolute p-12 bg-black bg-opacity-50"
    dim.id = "dim-bg"
    document.getElementById("root").appendChild(dim)
    let alertdiv = document.createElement("div")
    alertdiv.className = "flex-1 rounded-md flex flex-col justify-between bg-gray-700 p-12"
  
    let info = document.createElement("div")
    info.className = "flex-1 text-white"
    info.innerText = message
    alertdiv.appendChild(info)
    dim.appendChild(alertdiv)
    
    let dismissbuttondiv = document.createElement("div")
    dismissbuttondiv.className = "mx-2 my-2 bg-black bg-opacity-20 rounded-lg flex"
    alertdiv.appendChild(dismissbuttondiv)
    let alertdismiss = document.createElement("button")
    alertdismiss.className = "btn-reg-black flex-1"
    alertdismiss.textContent = "OK"
    alertdismiss.onclick = () => {dim.remove()}
    dismissbuttondiv.appendChild(alertdismiss)  
  }
}

let BlankDynamic = `{"key":"dynamics","type":"pointer","value":{"items":[{"key":"times","type":"list","value":{"items":[],"valueType":"f32"}},{"key":"values","type":"list","value":{"items":[],"valueType":"vec4"}}],"name":"VfxAnimatedColorVariableData"}}`
let File = {};
let FileCache = []
let FilePath = ipcRenderer.sendSync('PassFile');

let Palette = [NewRandomColor()]

const PrefsPath = path.join(ipcRenderer.sendSync('ConfigPath') + '\\config.json')


let Prefs = fs.existsSync(PrefsPath) == true ? require(PrefsPath) : null

let ColorContainer = document.getElementById("ColorContainer")
let GradientIndicator = document.getElementById("GradientIndicator")
let TimeContainer = document.getElementById("TimeContainer")
let ParticleList = document.getElementById("ParticleList")
let SampleContainer = document.getElementById("SampleContainer")
let Tabs = document.getElementsByClassName('Tab')

if(Prefs != null)
{
  if(Prefs.Version != ipcRenderer.sendSync('Version'))
  {
    if(Prefs.ritoBinPath != null)
    {
      Prefs.RitoBinPath = Prefs.ritoBinPath
      delete Prefs["ritoBinPath"]
    }

    if(Prefs.linear != null)
    {
      Prefs.Advanced = Prefs.linear
      delete Prefs["linear"]
    }

    if(Prefs.ignoreBW != null)
    {
      Prefs.IgnoreBW = Prefs.ignoreBW
      delete Prefs["ignoreBW"]
    }

    if(Prefs.savedpalettes != null)
    {
      Prefs.ColorSamples = Prefs.savedpalettes
      delete Prefs["savedpalettes"]
      Prefs.ColorSamples.map(Sample => {
        Sample.value.map(Item => {
          Item.color = UTIL.HEXtoRGB(Item.color)
        })
      })
    }

    Prefs.Version = ipcRenderer.sendSync('Version')
    SavePrefs()
  }
  document.getElementById('IgnoreBW').checked = Prefs.IgnoreBW
  document.getElementById('Advanced').checked = Prefs.Advanced
}
else
{ 
  Prefs = {}
  Prefs.Version = ipcRenderer.sendSync('Version')
  Prefs.IgnoreBW = true
  Prefs.Advanced = document.getElementById("Advanced").checked
  Prefs.ColorSamples = []
  fs.writeFileSync(PrefsPath,JSON.stringify(Prefs,null,2),"utf8")
  CreateAlert("You have to select Ritobin_cli.exe for the program to work")
  SwitchTab("Preferences")
  SavePrefs()
}

if(Prefs.Advanced == false)
{
  GradientIndicator.style.display = "none"
  TimeContainer.style.display = "none"
}

MapPalette()


if(FilePath != undefined ){
  ToJson()
  if(fs.existsSync(FilePath.slice(0,-4) + ".json") == false)
  {
    ToJson()
  }
  File = require(FilePath.slice(0,-4) + ".json")
  LoadFile()
}

function NewRandomColor(){return {time:0,color:[Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)]} }

function ChangeColorCount(Count){
  let TempLenght = parseInt(Palette.length)
  if(TempLenght < Count)
  {
    for(let ID = 0; ID < Count - TempLenght; ID++)
    {
      Palette.push(NewRandomColor())
    }
  }
  else if (TempLenght > Count)
  {
    for(let ID = 0; ID <  TempLenght - Count; ID++)
    {
      Palette.pop()
    }
  }
  Palette.map((PaletteColor, index) => {
    PaletteColor.time = Math.round(100/(Palette.length - 1) * index)
  })
  MapPalette()
}

function MapPalette()
{
  ColorContainer.innerText = null
  TimeContainer.innerText = null
  let indicatorColor = []
  Palette.map((PaletteColor,ID) => {
    let ColorInput = document.createElement('input')
    ColorInput.type = "color"
    ColorInput.className = "flex-1 mx-0.5 cursor-pointer"
    ColorInput.onchange = (Event) => 
    {
      PaletteColor.color = UTIL.HEXtoRGB(Event.target.value)
      MapPalette()
    }
    ColorInput.value = UTIL.RGBtoHEX(PaletteColor.color[0],PaletteColor.color[1],PaletteColor.color[2])
    
    ColorContainer.appendChild(ColorInput)

    TimeInput = document.createElement('input')
    TimeInput.type = "number"
    TimeInput.className = "flex-1 mx-0.5"
    TimeInput.value = PaletteColor.time
    TimeInput.max = 100
    TimeInput.min = 0
    TimeInput.onchange = (Event) => 
    {
      PaletteColor.time = parseInt(Event.target.value)
      MapPalette()
    }
    if(ID == 0 || ID == Palette.length-1){TimeInput.disabled = true}
    TimeContainer.appendChild(TimeInput)  

    indicatorColor.push(`rgb(${PaletteColor.color[0]},${PaletteColor.color[1]},${PaletteColor.color[2]}) ${PaletteColor.time}%`)
  })
  if(Palette.length > 1){GradientIndicator.style.background = `linear-gradient(0.25turn,${indicatorColor.join(",")})`}
  else{GradientIndicator.style.background = 'none'}
}

function OpenBin()
{ 
  if(FileSaved == false && Persist == true)
  {
    CreateAlert("You might have forgotten to save bin")
    Persist = false
    return 0
  }
  FilePath = ipcRenderer.sendSync('FileSelect','Bin');
  if(FilePath == undefined){return 0}
  ParticleList.innerText = null
  ToJson()
  if(fs.existsSync(FilePath.slice(0,-4) + ".json") == false)
  {
    ToJson()
  }
  File = require(FilePath.slice(0,-4) + ".json")
  document.getElementById('appTitle').innerText = 
  `BinSplash - ${FilePath.substring(FilePath.lastIndexOf('\\') + 1)}`
  LoadFile()
}

function LoadFile()
{
  ParticleList.innerText = null
    File.entries.value.items.map(Particle => {
    let ParticleDiv = document.createElement("div")
    ParticleDiv.id = Particle.key
    ParticleDiv.className = "m-2 border-2 border-gray-700 rounded-md"
    
    
    ParticleList.appendChild(ParticleDiv)
      let ParticleName = Particle.value.items.find((item) =>{
        return item.key == "particleName"
      })
      
      ParticleDiv.innerHTML = 
      `<div class="ParticleTitle flex bg-gray-700 text-gray-300 rounded-sm p-1 ">
      <input type="checkbox" onclick="CheckChildren(this.parentNode.parentNode.children[1],this.checked)"/><div class="flex-1 text-center">${ParticleName.value}</div>
      </div>`
      
      Particle.value.items.map(DefData => {
        if(DefData.key == "simpleEmitterDefinitionData" || DefData.key == "complexEmitterDefinitionData")
        {
          let DefDataDiv = document.createElement("div")
          //console.log(DefData)
          
          DefDataDiv.id = DefData.key
          ParticleDiv.appendChild(DefDataDiv)

          DefData.value.items.map(VfxDefData => {
              let Color
              if(VfxDefData.items[VfxDefData.items.findIndex( item => item.key == "color")])
              {
                Color =
                UTIL.GetColor(
                  VfxDefData.items[VfxDefData.items.findIndex( item => item.key == "color")].value.items
                )
              }
              else if(VfxDefData.items[VfxDefData.items.findIndex( item => item.key == "birthColor")])
              {
                Color =
                UTIL.GetColor(
                  VfxDefData.items[VfxDefData.items.findIndex( item => item.key == "birthColor")].value.items
                )
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
                Title.innerText = VfxDefData.items[VfxDefData.items.findIndex( item => item.key == "emitterName")]?.value
              Emitter.appendChild(Title)
                let ColorDiv = document.createElement('div')
                ColorDiv.className = `mx-1 btn-reg-black text-center cursor-picker ${Color?.length > 1 ? "dynamic" : "solid"}`
                ColorDiv.style = `height:24px;width:80px;${BG == null ? "visibility:hidden" : "background:" + BG}`
                ColorDiv.innerHTML = '<span class="bg-black bg-opacity-0 hover:bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity px-5 rounded-lg py-0.5">COPY<span>'
                ColorDiv.onclick = ()=>{
                  Palette = Color;
                  MapPalette()
                }
              Emitter.appendChild(ColorDiv)
              
              DefDataDiv.appendChild(Emitter)
            })
          
        }
      })
    }
  )
}

function FilterParticles(FilterString)
{
  let ParticleListChildren = ParticleList.children
  let search = new RegExp(FilterString, "i")
  for (let I = 0; I < ParticleListChildren.length; I++) 
  {
    
    let match = ParticleListChildren[I].children[0].children[1].textContent.match(search)
    
    if(match == null)
    {
      
      ParticleListChildren[I].style.display = "none"
      ParticleListChildren[I].children[0].children[0].checked = false
      for (let J = 0; J < ParticleListChildren[I].children[1]?.children.length; J++) 
      {
        ParticleListChildren[I].children[1].children[J].children[0].checked = false;
      }
    }
    else
    {
      ParticleListChildren[I].style.display = null
    }
  }
}

function CheckAll()
{
  let ParticleListChildren = ParticleList.children
  for (let I = 0; I < ParticleListChildren.length; I++)
  {
    if(ParticleListChildren[I].style.display != "none")
    {
      ParticleListChildren[I].children[0].children[0].checked = true;
      CheckChildren(ParticleListChildren[I].children[1],ParticleListChildren[I].children[0].children[0].checked)
    }
  }
}

function UnCheckAll()
{
  let ParticleListChildren = ParticleList.children
  for (let I = 0; I < ParticleListChildren.length; I++)
  {
    if(ParticleListChildren[I].style.display != "none")
    {
      ParticleListChildren[I].children[0].children[0].checked = false;
      CheckChildren(ParticleListChildren[I].children[1],ParticleListChildren[I].children[0].children[0].checked)
    }
  }
}

function CheckChildren(Particle,State)
{
  if(Particle == undefined){return 0}
  for (let J = 0; J < Particle.children.length; J++)
  {
    if(Particle.children[J].style.visibility != "hidden")
    {
      Particle.children[J].children[0].checked = State
    }
  }
}

function RecolorSelected()
{
  FileSaved = false
  Persist = true
  FileCache.push(UTIL.Clone(File))

  let BinParticles = File.entries.value.items;
  [...ParticleList.children].map( Particle => {   
    if(Particle.style.display != "none")
    {
      let CurrentParticle = BinParticles[BinParticles.findIndex(BinParticle => {
        if(BinParticle.key == Particle.id){return true}
      })].value.items

      CurrentParticle.map(DefData => {
        if(DefData.key == "complexEmitterDefinitionData" || DefData.key == "simpleEmitterDefinitionData")
        {
          [...Particle.children[[...Particle.children].findIndex(item => item.id == DefData.key)].children]
          .map((Emitter,ID) =>{
            if(Emitter.children[0].style.visibility != "hidden" && Emitter.children[0].checked)
            {
              let DefDataItems = DefData.value.items[ID].items
              
              let ColorProp
              if(DefDataItems[DefDataItems.findIndex(Prop => Prop.key == "color")])
              {
                ColorProp = DefDataItems[DefDataItems.findIndex(Prop => Prop.key == "color")].value.items
                if(ColorProp[ColorProp.findIndex(item => item.key == "dynamics")])
                {
                  //this works

                  let ColorValue = ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items 
                  ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items = UTIL.ToDynamic(Palette,UTIL.Clone(ColorValue))
                }
                else 
                {
                  if(Prefs.Advanced && Palette.length > 1)
                  {
                    ColorProp.push(JSON.parse(BlankDynamic))
                    let ColorValue = ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items
                    ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items = UTIL.ToDynamic(Palette,UTIL.Clone(ColorValue))
                  }
                  else
                  {
                    //thisworks

                    let ColorValue = ColorProp[ColorProp.findIndex(item => item.key == "constantValue")].value
                    ColorProp[ColorProp.findIndex(item => item.key == "constantValue")].value = UTIL.ToConstant(Palette,UTIL.Clone(ColorValue))
                  }
                }
                Emitter.children[2].onclick = ()=>{
                  Palette = UTIL.GetColor(ColorProp);
                  MapPalette()
                }
                Emitter.children[2].style.background = UTIL.ToBG(UTIL.GetColor(ColorProp))
              }
              else if(DefDataItems[DefDataItems.findIndex(Prop => Prop.key == "birthColor")])
              {
                ColorProp = DefDataItems[DefDataItems.findIndex(Prop => Prop.key == "birthColor")].value.items
                if(ColorProp[ColorProp.findIndex(item => item.key == "dynamics")])
                {
                  //this works
                  let ColorValue = ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items
                  ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items = UTIL.ToDynamic(Palette,UTIL.Clone(ColorValue))
                }
                else
                {
                  if(Prefs.Advanced && Palette.length > 1)
                  {
                    ColorProp.push(JSON.parse(BlankDynamic))
                    let ColorValue = ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items
                    ColorProp[ColorProp.findIndex(item => item.key == "dynamics")].value.items = UTIL.ToDynamic(Palette,UTIL.Clone(ColorValue))
                  }
                  else
                  {
                    // this works

                    let ColorValue = ColorProp[ColorProp.findIndex(item => item.key == "constantValue")].value
                    ColorProp[ColorProp.findIndex(item => item.key == "constantValue")].value = UTIL.ToConstant(Palette,UTIL.Clone(ColorValue))
                  }
                }
                Emitter.children[2].onclick = ()=>{
                  Palette = UTIL.GetColor(ColorProp);
                  MapPalette()
                }
                Emitter.children[2].style.background = UTIL.ToBG(UTIL.GetColor(ColorProp))
              }
            }
          })
        }
      })
    }
  })
}

function Undo()
{
  if(FileCache.length > 0)
  {
    File = UTIL.Clone(FileCache[FileCache.length-1])
    FileCache.pop()
    LoadFile()
  }
}

function SelectRitoBin()
{
  Prefs.RitoBinPath = ipcRenderer.sendSync('FileSelect',"RitoBin")
  SavePrefs()
}

function SwitchTab(Tab)
{
  for (let ID = 0; ID < Tabs.length; ID++)
  {
    if(Tabs[ID].id == Tab)
    {
      Tabs[ID].style.display = "flex"
    }
    else
    {
      Tabs[ID].style.display = "none"
    }
  }
}

function LoadSamples()
{
  SampleContainer.innerText = null
  Prefs.ColorSamples.map((Sample,ID) => {
    let SampleDiv = document.createElement('div')
    SampleDiv.className = "flex m-2 p-1 rounded-lg"
    SampleDiv.style.background = UTIL.ToBG(Sample.value)
    
    SampleContainer.appendChild(SampleDiv)
      let SampleButton = document.createElement("button")
      SampleButton.className="btn-reg-black bg-opacity-20 px-3"
      SampleButton.innerText="Sample" 
      SampleButton.onclick = ()=>
      {
        Palette = UTIL.Clone(Sample.value)
        MapPalette()
      }
      SampleDiv.appendChild(SampleButton)

      let SampleExport = document.createElement("button")
      SampleExport.className="btn-reg-black bg-opacity-20 px-3"
      SampleExport.innerText="Export" 
      SampleExport.onclick = ()=>
      {
        ExportSamples(Sample)
      }
      SampleDiv.appendChild(SampleExport)

      let SampleDelete = document.createElement("button")
      SampleDelete.className="btn-reg-black bg-opacity-20 px-3"
      SampleDelete.innerText="Delete" 
      SampleDelete.onclick = () =>
      {
        Prefs.ColorSamples.splice(ID,1)
        SavePrefs()
        LoadSamples()
      }
      SampleDiv.appendChild(SampleDelete)

      let SampleTitle = document.createElement('input')
      SampleTitle.className = "bg-black flex-1 bg-opacity-20 rounded-lg text-center text-gray-300"
      SampleTitle.value = Sample.name
      SampleTitle.onchange = (event) =>
      {
        Sample.name = event.target.value
        SavePrefs()
      }
      SampleDiv.appendChild(SampleTitle)
  })
}
  
function SaveSample()
{
  Prefs.ColorSamples.push(
    {
      "name": `unnamed ${Prefs.ColorSamples.length}`,
      "value": UTIL.Clone(Palette)
    }
  )
  SavePrefs()
  LoadSamples()
}

function SavePrefs()
{
  Prefs.Advanced = document.getElementById("Advanced").checked
  Prefs.IgnoreBW = document.getElementById("IgnoreBW").checked
  if(Prefs.Advanced){
    GradientIndicator.style.display = "flex"
    TimeContainer.style.display = "flex"
  }
  else{
    GradientIndicator.style.display = "none"
    TimeContainer.style.display = "none"
  }
  fs.writeFileSync(PrefsPath,JSON.stringify(Prefs,null,2),"utf8")
}

function ExportSamples(Samples = null)
{
  let Folder = ipcRenderer.sendSync('FileSelect','Folder')
  if (Folder == ""){return 0}

  if(Samples == null)
  {
    fs.writeFileSync(
      Folder + "\\AllSamples.json"
      ,JSON.stringify(Prefs.ColorSamples,null,2),"utf8"
    )
  }
  else
  {
    fs.writeFileSync(
      Folder + "\\" + Samples.name + ".json"
      ,JSON.stringify(Samples,null,2),"utf8"
    )
  }
}

function ImportSample()
{
  let Samples = JSON.parse(fs.readFileSync(ipcRenderer.sendSync('FileSelect',"Json")).toString())
  
  if(Samples.constructor == [].constructor)
  {
    Samples.map(Sample => {
      Prefs.ColorSamples.push(Sample)
    })
  }
  else
  {
    Prefs.ColorSamples.push(Samples)
  }
  
  SavePrefs()
  LoadSamples()
}

function SaveBin()
{
  fs.writeFileSync((FilePath.slice(0,-4) + ".json"),JSON.stringify(File,null,2),"utf8")
  ToBin()
  FileSaved = true
}

function ToJson()
{
  execSync(`"${Prefs.RitoBinPath}" -o json "${(FilePath)}"`)
}

function ToBin()
{
  execSync(`"${Prefs.RitoBinPath}" -o bin "${(FilePath.slice(0,-4) + ".json")}"`)
}

function OpenURL()
{
  Open('https://github.com/DevMarcius/binsplash')
}

function SelectRitoBin()
{
  Prefs.RitoBinPath = ipcRenderer.sendSync('FileSelect',"RitoBin")
}

LoadSamples()