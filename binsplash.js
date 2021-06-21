const { exec } = require('child_process');
const { ipcRenderer, clipboard, app} = require('electron');
const fs = require('fs');
const path = require('path');
const { config } = require('process');

let filesaved = true
let persistant = false
window.onerror = function (msg, error, lineNo, columnNo) {
  createAlert(`Message: ${msg}\n\nError: ${error},\n\nRaised at: ${lineNo} : ${columnNo}`)
}
let appconfig = {};
let file = {};
let filebackup = {}
let filepath = "";
let palette = [{time:0,color:`#${Math.floor(Math.random()*16777215).toString(16)}`}]
function dismissAlert(){
  let alert = document.getElementById("dim-bg")
  alert.remove()
}
function createAlert(message){
  let dim = document.createElement("div")
  dim.className = "dim-bg"
  dim.id = "dim-bg"
  document.body.appendChild(dim)
  let alertdiv = document.createElement("div")
  let alerttext = document.createElement("div")
  let dismissbuttondiv = document.createElement("div")
  let alertdismiss = document.createElement("button")
  dismissbuttondiv.className = "div"

  alertdismiss.className = "ButtonC1"
  alertdismiss.textContent = "OK"
  alertdismiss.style.marginBottom = "0px"
  alerttext.className = "alert-text"
  alerttext.innerText = message
  alertdiv.appendChild(alerttext)
  alertdismiss.onclick= dismissAlert
  alertdiv.appendChild(dismissbuttondiv)
  dismissbuttondiv.appendChild(alertdismiss)
  alertdiv.className = "alert-box"
  dim.appendChild(alertdiv)
}
const appconfigpath = path.join(ipcRenderer.sendSync('ConfigPath') + '\\binsplash\\' + 'config.json')
function checkConfig(){
  let isExists = fs.existsSync(appconfigpath, 'utf8')
  if (isExists == false){
    createAlert("You have to select Ritobin_cli.exe for the program to work")
    settingsMenu()
  }else{
    appconfig = require(appconfigpath)
    document.getElementById("bwvalues").checked = appconfig.ignoreBW
    document.getElementById("linear").checked = appconfig.linear
    if(!appconfig.linear){
      document.getElementById("gradient-indicator").style.display = "none"
      document.getElementById("time-container").style.display = "none"
    }else{
      document.getElementById("gradient-indicator").style.display = "block"
      document.getElementById("time-container").style.display = "block"
    }
  }
}
checkConfig()
function saveConfig(ignore=false){
  appconfig.ignoreBW = document.getElementById("bwvalues").checked
  appconfig.linear = document.getElementById("linear").checked
  fs.writeFileSync(appconfigpath,JSON.stringify(appconfig,null,2),"utf8")
  saveJson()
  if(!ignore){
    mainMenu()
  }
  checkConfig()
}

function mainMenu(){
  document.getElementById("Main").style.display = "block"
  document.getElementById("Settings").style.display = "none"
  document.getElementById("pmcontainer").style.display = "none"
}
function settingsMenu(){
  document.getElementById("Main").style.display = "none"
  document.getElementById("Settings").style.display = "block"
  document.getElementById("pmcontainer").style.display = "none"

}
function paletteMenu(){
  document.getElementById("Main").style.display = "none"
  document.getElementById("Settings").style.display = "none"
  document.getElementById("pmcontainer").style.display = "block"
  loadPalettes()
}
let colorcontainer = document.getElementById("color-container")
let gradientindicator = document.getElementById("gradient-indicator")
let timecontainer = document.getElementById("time-container")
function updateTime(event){
  let length = event.target.parentNode.childNodes.length
  for(let i = 0; i < length; i++){
    if(event.target.parentNode.childNodes[i] == event.target){
      palette[i].time = parseInt(event.target.value)
      timecontainer.childNodes[i].style.borderBottom = `4px solid ${palette[i].time}`
      
      timecontainer.childNodes[i].value = palette[i].time
    }
  }

  updateGradient(gradientindicator,palette)
}
renderfields()
updateGradient(gradientindicator,palette)
function loadPalettes(){
  
  if(appconfig.savedpalettes != undefined && appconfig.savedpalettes[0]?.value != undefined){
    let paletteContainer = document.getElementById("PaletteManager")
    paletteContainer.innerText = null
    appconfig.savedpalettes.map((item,id) => {
      let palettediv = document.createElement("div")
      palettediv.innertext = "yikes"
      palettediv.className = "div"
      palettediv.style.display = "flex"
      paletteContainer.appendChild(palettediv)
      if(item.value.length > 1){
        updateGradient(palettediv,item.value,true)
      } else{
        palettediv.style.backgroundColor = item.value[0].color
      }
      let selectbutton = document.createElement("button")
      selectbutton.className="ButtonC2"
      selectbutton.innerText="USE THIS"
      selectbutton.onclick = ()=>{
        palette = JSON.parse(JSON.stringify([...appconfig.savedpalettes[id].value]))
        document.getElementById("slider-input").value = palette.length
        renderfields()
        updateGradient(gradientindicator,palette)
      }
      palettediv.appendChild(selectbutton)
      let removebutton = document.createElement("button")
      removebutton.className="ButtonC2"
      removebutton.innerText="DELETE"
      removebutton.onclick = ()=>{
        appconfig.savedpalettes.splice(id,1)
        saveConfig(true)
        paletteContainer.childNodes[id] = null
        loadPalettes()
      }
      palettediv.appendChild(removebutton)

      let paletteName = document.createElement("input")
      paletteName.value = item?.name
      paletteName.className = "InputC2"
      paletteName.onchange = (event)=>{
        item.name = event.target.value
        saveConfig(true)
      }
      palettediv.appendChild(paletteName)
    })
  } else if (appconfig.savedpalettes != undefined){
    appconfig.savedpalettes.map((item,id)=>{
      let temp = JSON.parse(JSON.stringify(item))
      appconfig.savedpalettes[id] = JSON.parse(`{"name": "unnamed ${id}","value":${JSON.stringify(temp)}}`)
    })
    saveConfig(true)
    loadPalettes()
  }
}
function updateColor(event){
  temp = hexToRgb(event.target.value)
  let length = event.target.parentNode.childNodes.length
  for(let i = 0; i < length; i++){
    if(event.target.parentNode.childNodes[i] == event.target){
      palette[i].color = event.target.value
      timecontainer.childNodes[i].style.borderBottom = `4px solid ${palette[i].color}`
      
      colorcontainer.childNodes[i].value = palette[i].color
    }
  }

  updateGradient(gradientindicator,palette)
}
function updateGradient(indicator,palette,fromconfig=false){
  let length = palette.length
  if(length > 1){
    let colorString = ''
    for (let id = 0; id < length; id++) {
      if(!fromconfig){
        if(timecontainer.childNodes[id].value.length == 0){
          palette[id].time = parseInt(timecontainer.childNodes[id].placeholder)
        }
        if(timecontainer.childNodes.length-1 == id){
          palette[id].time = 100
        }else if(id == 0){
          palette[id].time = 0
        }
      }
      colorString += `${palette[id].color} ${palette[id].time}%,`
    }
    indicator.style.backgroundImage = `linear-gradient(0.25turn,`+ colorString.slice(0, -1) +`)`
  }else{
    indicator.style.backgroundImage = `linear-gradient(0.25turn,${colorcontainer.childNodes[0].value},${colorcontainer.childNodes[0].value})`
  }
}
function colorFields(value){
  let length = palette.length
  if (value > length){
    for(let i = 0; i < value - length;i++){
      palette.push({time:0,color:`#${Math.floor(Math.random()*16777215).toString(16)}`})
    }
  } else if(value < length){
    for(let i = 1; i < (length - value)+1; i++){
      palette.pop(palette[length-(i)])
    }
  }
  palette.map((item)=>{
    item.time = null
  })
  renderfields()
  updateGradient(gradientindicator,palette)
}
function renderfields(){
  colorcontainer.innerText = null
  timecontainer.innerText = null
  palette.map((item,id)=>{
    let rgb = document.createElement("input")
    rgb.type = "color"
    rgb.value = item.color
    rgb.onchange = updateColor
    rgb.classList.add("rgb");
    colorcontainer.appendChild(rgb);
    item.color = rgb.value
    let time = document.createElement("input")
    time.type = "number"
    time.min = 0
    time.max = 100
    time.classList.add("time")
    time.placeholder = Math.floor(1/(palette.length-1)*(id)*100)
  
    if(time.placeholder != item.time && item.time){
      time.value = item.time
    }
    time.onchange = updateTime
    time.style.borderBottom = `4px solid ${item.color}`
    timecontainer.appendChild(time)
  })
}
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseFloat(parseInt(result[1], 16)),
    g: parseFloat(parseInt(result[2], 16)),
    b: parseFloat(parseInt(result[3], 16))
  } : null;
}
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r,g,b) {
  return "#" + componentToHex(parseInt(r)) + componentToHex(parseInt(g)) + componentToHex(parseInt(b));
}
function selectFiles(){
  if(!filesaved && !persistant){
    persistant = true
    return createAlert("You may have forgotten to save the .bin file,\nsave cause next time I won't warn you.")
  }
  filepath = ipcRenderer.sendSync('fileselect')[0]
  if(filepath == undefined){
    return 0
  }
  document.title = `BinSplash - ${filepath.substring(filepath.lastIndexOf('\\') + 1)}`
  const checkTime = 100;
  
  if(fs.existsSync((filepath.slice(0,-4) + ".json"), 'utf8') == false){
    exec(`"${appconfig.ritoBinPath}" -o json "${filepath}"`)
  }
  const timerId = setInterval(() => {
    if(fs.existsSync((filepath.slice(0,-4) + ".json"), 'utf8')) {
      loadTheFile()
      clearInterval(timerId)
    }
  }, checkTime)
}
function useThis(EmitterColor){
  let parentid = EmitterColor.parentNode.parentNode.parentNode.id
  let childid
  for(let i = 0; i < EmitterColor.parentNode.parentNode.childNodes.length;i++){
    if(EmitterColor.parentNode.parentNode.childNodes[i] == EmitterColor.parentNode){
      childid = i
    }
  }
  
  let itemsA = file.entries.value.items

  itemsZero = itemsA[parentid].value.items
  itemsB = itemsZero[0].value.items
  let itemsC = itemsB[childid].items;
  let colorIndex = null
  let birthColorIndex = null

  for (let C = 0; C < itemsC.length; C++){
    if (itemsC[C].key == "color"){
      let itemsD = itemsC[C].value.items;
      for (let D = 0; D < itemsD.length; D++) {
        if(itemsD[D].key == "constantValue" || itemsD[D].key == "dynamics"){
          colorIndex = C
        }
      }
    } else if (itemsC[C].key == "birthColor"){
      birthColorIndex = C
    }
  }
  
  if (colorIndex != null){
    let itemsD = itemsC[colorIndex].value.items;
    if(itemsD[itemsD.length-1].key == "constantValue"){
      palette = [{time:0,color:rgbToHex(itemsD[itemsD.length -1].value[0]*256,itemsD[itemsD.length -1].value[1]*256,itemsD[itemsD.length -1].value[2]*256)}]
    }else{
      let E = itemsD[itemsD.length-1].value.items.length - 1 
      let itemsE = itemsD[itemsD.length -1].value.items
      palette = []
      for(let F = 0; F< itemsE[E].value.items.length; F++){
        itemsF = itemsE[E].value.items
        palette.push({time:parseInt(itemsE[E-1].value.items[F]*100),color:rgbToHex(itemsF[F][0]*256,itemsF[F][1]*256,itemsF[F][2]*256)})
      }
    } 
  }else{
    if(birthColorIndex != null){
      let itemsD = itemsC[birthColorIndex].value.items;
      for (let D = 0; D < itemsD.length; D++) {
        if(itemsD[D].key == "constantValue"){
          palette = [{time:0,color:rgbToHex(itemsD[D].value[0]*256,itemsD[D].value[1]*256,itemsD[D].value[2]*256)}]
        }
      }
    }
  }
  
  document.getElementById("slider-input").value = palette.length
  renderfields()
  updateGradient(gradientindicator,palette)
}
function loadTheFile(backup=false){
  file = backup ? filebackup : require((filepath.slice(0,-4) + ".json"))
  saveJson(true)
  let complexEmitterList = document.getElementById("complexEmitterList")
  
  complexEmitterList.textContent = ''
  let itemsA = file.entries.value.items
  function createEmitterItem(EmitterList,EmitterName){
    let EmitterItem = document.createElement('li')
    EmitterItem.className = "EmitterItem"
    EmitterList.appendChild(EmitterItem)
    let EmitterInput = document.createElement('input')
    EmitterInput.type = "checkbox"
    EmitterInput.className = "EmitterInput"
    EmitterItem.appendChild(EmitterInput)
    let EmitterTitle = document.createElement('div')
    EmitterTitle.className = "EmitterTitle"
    EmitterTitle.innerText = EmitterName
    EmitterItem.appendChild(EmitterTitle)
    let EmitterColor = document.createElement('div')
    EmitterColor.className = "color"
    EmitterItem.appendChild(EmitterColor)
    EmitterColor.onclick = (event) => useThis(event.target)
  }
  let foundemitters = false
  for (let A = 0; A < itemsA.length; A++) {
    if (itemsA[A].value.items[0].key == "complexEmitterDefinitionData"){
      itemsZero = itemsA[A].value.items
      itemsZero.forEach(itemZero => {
        if(itemZero.key == "particleName"){
          let complexEmitterItem = document.createElement('li')
          complexEmitterItem.className = "complexEmitterItem"
          complexEmitterItem.id = A
          complexEmitterList.appendChild(complexEmitterItem)
          let complexEmitterHeader = document.createElement('div')
          complexEmitterHeader.className = "complexEmitterHeader"
          let complexEmitterTitle = document.createElement('div')
          complexEmitterTitle.className = "complexEmitterTitle"
          complexEmitterTitle.innerText = itemZero.value

          let complexEmitterInput = document.createElement('input')
          complexEmitterInput.type = "checkbox"
          complexEmitterInput.className = "ComplexEmitterInput"
          complexEmitterInput.onclick = function(){checkchildren(this.parentNode.parentNode,false)}
          complexEmitterItem.appendChild(complexEmitterHeader)
          complexEmitterHeader.appendChild(complexEmitterInput)
          complexEmitterHeader.appendChild(complexEmitterTitle)

          let EmitterList = document.createElement('ol')
          EmitterList.style = "list-style: none"
          EmitterList.className = "EmitterList"
          complexEmitterItem.appendChild(EmitterList)
          let itemsB = itemsZero[0].value.items
          for (let B = 0; B < itemsB.length; B++) {
            let itemsC = itemsB[B].items;
            let tempName = `unnamed ${A}-${B}`
            for (let C = 0; C < itemsC.length; C++) {
              if (itemsC[C].key == "emitterName"){
                tempName = itemsC[C].value
              } 
            }
            createEmitterItem(EmitterList,tempName)
            foundemitters = true
          }
        }
      });
    }
  }
  if(foundemitters == false){
    filesaved = true
    return createAlert("This Bin has no color values")
  }
  for (let A = 0; A < complexEmitterList.childNodes.length; A++) {
    let ComplexEmitter = complexEmitterList.childNodes[A]
    let id = complexEmitterList.childNodes[A].id
    let itemsA = file.entries.value.items
    if (itemsA[id].value.items[0].key == "complexEmitterDefinitionData"){
      itemsZero = itemsA[id].value.items
      itemsB = itemsZero[0].value.items
      for (let B = 0; B < itemsB.length; B++) {
        let EmitterColor = ComplexEmitter.childNodes[1].childNodes[B].childNodes[2]
        let itemsC = itemsB[B].items;

        let colorIndex = null
        let birthColorIndex = null

        for (let C = 0; C < itemsC.length; C++){
          if (itemsC[C].key == "color"){
            let itemsD = itemsC[C].value.items;
            for (let D = 0; D < itemsD.length; D++) {
              if(itemsD[D].key == "constantValue" || itemsD[D].key == "dynamics"){
                colorIndex = C
              }
            }
          } else if (itemsC[C].key == "birthColor"){
            birthColorIndex = C
          }
        }
        if (colorIndex != null){
          let itemsD = itemsC[colorIndex].value.items;
          if(itemsD[itemsD.length-1].key == "constantValue"){
            EmitterColor.classList.add("color-solid")
            EmitterColor.style.backgroundColor = `RGB(${itemsD[itemsD.length -1].value[0]*256},${itemsD[itemsD.length -1].value[1]*256},${itemsD[itemsD.length -1].value[2]*256})`
          }else{
            let E = itemsD[itemsD.length-1].value.items.length - 1 
            let itemsE = itemsD[itemsD.length -1].value.items
            let array = null
            let colorString = ""
            for (let F = 0; F < itemsE[E].value.items.length; F++) {
              array = itemsE[E].value.items[F]
              colorString += `RGB(${array[0]*256},${array[1]*256},${array[2]*256}) ${itemsE[E-1].value.items[F]*100}%,`
            }
            EmitterColor.style.backgroundImage = `linear-gradient(0.25turn,`+ colorString.slice(0, -1) +`)`
          } 
        }else{
          if(birthColorIndex != null){
            let itemsD = itemsC[birthColorIndex].value.items;
            for (let D = 0; D < itemsD.length; D++) {
              if(itemsD[D].key == "constantValue"){
                EmitterColor.classList.add("color-solid")
                EmitterColor.style.backgroundColor = `RGB(${itemsD[D].value[0]*256},${itemsD[D].value[1]*256},${itemsD[D].value[2]*256})`
              }
            }
          }
        }
        if (colorIndex == null && birthColorIndex == null){
          EmitterColor.style.display = "none";
          EmitterColor.parentNode.childNodes[1].style.color = "#9a9a9a"
          EmitterColor.parentNode.firstChild.style.visibility = "hidden"
        }
      }
    }
  }
}
function selectRitobin(){
  appconfig.ritoBinPath = ipcRenderer.sendSync('ritobinselect')[0]
}
function checkchildren(object,invert){
  for (let J = 0; J < object.childNodes[1].childNodes.length; J++) {
    if(invert){
      object.childNodes[1].childNodes[J].childNodes[0].checked = !object.childNodes[1].childNodes[J].childNodes[0].checked
    }else{
      if(object.childNodes[1].childNodes[J].childNodes[0].style.visibility != "hidden"){
        object.childNodes[1].childNodes[J].childNodes[0].checked=object.childNodes[0].childNodes[0].checked
      }
    }
  }
}
function check(){
  let complexEmitterList = document.getElementById("complexEmitterList").childNodes
  for (let I = 0; I < complexEmitterList.length; I++) {
    if (complexEmitterList[I].style.display != "none") {
      complexEmitterList[I].childNodes[0].childNodes[0].checked = true;
      checkchildren(complexEmitterList[I],false)
    }
  }
}
function unCheck(){
  
  let complexEmitterList = document.getElementById("complexEmitterList").childNodes
  for (let I = 0; I < complexEmitterList.length; I++) {
    if (complexEmitterList[I].style.display != "none") {
      complexEmitterList[I].childNodes[0].childNodes[0].checked = false;
      checkchildren(complexEmitterList[I],false)
    }
  }
}
function invert(){
  
  let complexEmitterList = document.getElementById("complexEmitterList").childNodes
  for (let I = 0; I < complexEmitterList.length; I++) {
    if (complexEmitterList[I].style.display != "none") {
      complexEmitterList[I].childNodes[0].childNodes[0].checked = !complexEmitterList[I].childNodes[0].childNodes[0].checked;
      checkchildren(complexEmitterList[I],true)
    }
  }
}

function filterList(filterString){
  let emitterList = document.getElementById("complexEmitterList").childNodes
  let search = new RegExp(filterString, "i")
  for (let I = 0; I < emitterList.length; I++) 
  {
    let match = emitterList[I].textContent.match(search)

    if(match == null)
    {
      emitterList[I].style.display = "none"
      emitterList[I].childNodes[0].childNodes[0].checked = false
      for (let J = 0; J < emitterList[I].childNodes[1].childNodes.length; J++) 
      {
        emitterList[I].childNodes[1].childNodes[J].childNodes[0].checked = false;
      }
    }else{
      emitterList[I].style.display = null
    }
  }
}
function randomColoring(colors,old){
  let rgb = hexToRgb(palette[Math.floor(Math.random() * palette.length)].color)
  if(appconfig.ignoreBW){
    if((old[0] == 0 && old[1] == 0 && old[2] == 0) || (old[0] == 1 && old[1] == 1 && old[2] == 1)){
      return {
        r: old[0] *256,
        g: old[1] *256,
        b: old[2] *256
      }
    }
  }
  old[0] = rgb.r/255
  old[1] = rgb.g/255
  old[2] = rgb.b/255
  return rgb
}
function recolorSelected(){
  saveJson(true)
  let complexEmitterList = document.getElementById("complexEmitterList")
  filesaved = false
  persistant = false
  for (let A = 0; A < complexEmitterList.childNodes.length; A++) {
    let ComplexEmitter = complexEmitterList.childNodes[A]
    let id = complexEmitterList.childNodes[A].id
    let itemsA = file.entries.value.items
    if (itemsA[id].value.items[0].key == "complexEmitterDefinitionData"){
      itemsZero = itemsA[id].value.items
      itemsB = itemsZero[0].value.items
      for (let B = 0; B < itemsB.length; B++) {
        if(ComplexEmitter.childNodes[1].childNodes[B].childNodes[0].checked == true){
          let EmitterColor = ComplexEmitter.childNodes[1].childNodes[B].childNodes[2]
          
          let itemsC = itemsB[B].items;
          
          if(appconfig.linear && palette.length > 1){
            
            let gradient = [{
              key: "dynamics",
              type: "pointer",
              value: {
                items:[
                  {
                    key: "times",
                    type: "list",
                    value: {
                      items: [],
                      valueType: "f32"
                    }
                  },
                  {
                    key: "values",
                    type: "list",
                    value: {
                      items: [],
                      valueType: "vec4"
                    }
                  }
                ],
                name: "VfxAnimatedColorVariableData"
              }
            }]
            let colorIndex = itemsC.length
            itemsC.map((itemD,idD)=>{
              if(itemD.key == "color"){
                colorIndex = idD
              }
            })
            
            if(itemsC[colorIndex] == null){
              itemsC[colorIndex] = {
                key: "color",
                type: "embed",
                value:{
                  items:[...gradient],
                  name: "ValueColor"
                }
              }
            }
            let templenght = itemsC[colorIndex].value.items.length
            if(templenght == 1){
              if(itemsC[colorIndex].value.items[0].key == "constantValue"){
                itemsC[colorIndex].value.items = [...gradient]
              }
            } else{
              itemsC[colorIndex].value.items.shift()
            }
            let times = itemsC[colorIndex].value.items[0].value.items[0].value.items
            
            values = []
            if(times.length != palette.length){
              times = []
            }
            palette.map((item,id)=>{
              let tcolor = hexToRgb(JSON.parse(JSON.stringify(item.color)))
              
              let temp = (times[id] == 0 ||times[id] == 1) ? 0 : 1
              if(times.length < palette.length){
                times.push(item.time/100)
              }
              values.push([(tcolor.r/255),(tcolor.g/255),(tcolor.b/255),temp])
              
            })
            if(EmitterColor.classList.length > 1){
              EmitterColor.classList.remove('color-solid')
            }
            itemsC[colorIndex].value.items[0].value.items[0].value.items = times
            itemsC[colorIndex].value.items[0].value.items[1].value.items = values
            EmitterColor.style.backgroundImage=gradientindicator.style.backgroundImage
          }
          else if (appconfig.linear && palette.length == 1){
            let solid = [{
              key: "constantValue",
              type: "vec4",
              value: []
            }]
            let colorIndex = itemsC.length
            itemsC.map((itemD,idD)=>{
              
              if(itemD.key == "color"){
                colorIndex = idD
              }
            })
            
            if(itemsC[colorIndex] == null){
              itemsC[colorIndex] = {
                key: "color",
                type: "embed",
                value:{
                  items:[...solid],
                  name: "ValueColor"
                }
              }
            }
            let templenght = itemsC[colorIndex].value.items.length
            let tcolor = hexToRgb(JSON.parse(JSON.stringify(palette[0].color)))

            if(templenght == 1){
              if(itemsC[colorIndex].value.items[0].key == "dynamics"){
                itemsC[colorIndex].value.items = [...solid]
              }
            } else{
              itemsC[colorIndex].value.items.pop()
            }
            values = [(tcolor.r/255),(tcolor.g/255),(tcolor.b/255),1]
            itemsC[colorIndex].value.items[0].value= values
            
            EmitterColor.classList.add('color-solid')
            EmitterColor.style.backgroundImage=gradientindicator.style.backgroundImage
          }
          else{
            let colorIndex = itemsC.length
            itemsC.map((itemD,idD)=>{
              
              if(itemD.key == "color"){
                colorIndex = idD
              }
            })
            if (colorIndex != null){
              let itemsD = itemsC[colorIndex].value.items;
              for (let D = 0; D < itemsD.length; D++) {
                if(itemsD[D].key == "constantValue"){
                  let color = undefined
                  for (let D = 0; D < itemsD.length; D++) {
                    if(itemsD[D].key == "constantValue"){
                      color = randomColoring(palette,itemsD[D].value)
                      
                      EmitterColor.style.backgroundColor = `RGB(${color.r},${color.g},${color.b})`
                    }
                  }
                  EmitterColor.style.backgroundColor = `RGB(${color.r},${color.g},${color.b})`
                }else if(itemsD[D].key == "dynamics"){
                  let E = itemsD[D].value.items.length - 1 
                  let itemsE = itemsD[D].value.items
                  let array = null
                  let colorString = ""
                  for (let F = 0; F < itemsE[E].value.items.length; F++) {
                    array = itemsE[E].value.items[F]
                    let color = null
                    color = randomColoring(palette,array)
                    colorString += `RGB(${color.r},${color.g},${color.b}) ${itemsE[E-1].value.items[F]*100}%,`
                    
                  }
                  EmitterColor.style.backgroundImage = `linear-gradient(0.25turn,`+ colorString.slice(0, -1) +`)`
                }
              }
            }else{
              if(birthColorIndex != null){
                let itemsD = itemsC[birthColorIndex].value.items;
                let color = null
                for (let D = 0; D < itemsD.length; D++) {
                  if(itemsD[D].key == "constantValue"){
                    color = randomColoring(palette,itemsD[D].value)
                    EmitterColor.style.backgroundColor = `RGB(${color.r},${color.g},${color.b})`
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  saveJson()
  createAlert("Recolored Selection");
}
function savePalette(){
  if(appconfig.savedpalettes == undefined){
    appconfig.savedpalettes = []
  }
  appconfig.savedpalettes.push(JSON.parse(`{"name": "unnamed ${appconfig.savedpalettes.length}","value":${JSON.stringify(palette)}}`))
  saveConfig(true)
  loadPalettes()
}
function undoLast(){
  loadTheFile(true)
}
function saveJson(backup = false){
  if(backup){
    filebackup = JSON.parse(JSON.stringify(file,null,2))
  }else{
    fs.writeFileSync((filepath.slice(0,-4) + ".json"),JSON.stringify(file,null,2),"utf8")
  }
}
function saveBin(){
  saveJson()
  exec(`"${appconfig.ritoBinPath}" -o bin "${(filepath.slice(0,-4) + ".json")}"`)
  filesaved = true
  persistant = false
  createAlert(`File saved, dont forget to delete\n.json files from directory`);
}