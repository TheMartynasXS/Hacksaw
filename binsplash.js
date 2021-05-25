const { exec } = require('child_process');
const { ipcRenderer, app } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { config } = require('process');
let filesaved = true
let persistant = false
window.onerror = function (msg, error, lineNo, columnNo) {
  ipcRenderer.sendSync('raiseError', `Message: ${msg}\n\nError: ${error}`,`Raised at: ${lineNo} : ${columnNo}` )
}
let appconfig = {};
let file = {};
let filepath = "";
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
  let alertdismiss = document.createElement("button")
  alertdismiss.className = "ButtonC1"
  alertdismiss.textContent = "OK"
  alertdismiss.style.marginBottom = "0px"
  alerttext.className = "alert-text"
  alerttext.innerText = message
  alertdiv.appendChild(alerttext)
  alertdismiss.onclick= dismissAlert
  alertdiv.appendChild(alertdismiss) 
  alertdiv.className = "alert-box"
  dim.appendChild(alertdiv)
}
const appconfigpath = path.join(ipcRenderer.sendSync('ConfigPath') + '\\binsplash\\' + 'config.json')

let isExists = fs.existsSync(appconfigpath, 'utf8')
if (isExists == false){
  createAlert("You have to select Ritobin_cli.exe for the program to work")
  settingsMenu()
}else{
  appconfig = require(appconfigpath)
  document.getElementById("bwvalues").checked = appconfig.ignoreBW
  document.getElementById("linear").checked = appconfig.linear
}
function saveConfig(){
  appconfig.ignoreBW = document.getElementById("bwvalues").checked
  appconfig.linear = document.getElementById("linear").checked
  fs.writeFileSync(appconfigpath,JSON.stringify(appconfig,null,2),"utf8")
  window.location.reload()
}

function mainMenu(){
  document.getElementById("Main").style.display = "block"
  document.getElementById("Settings").style.display = "none"
}
function settingsMenu(){
  document.getElementById("Main").style.display = "none"
  document.getElementById("Settings").style.display = "block"
}
let colorcontainer = document.getElementById("color-container")
let gradientindicator = document.getElementById("gradient-indicator")
function updateGradient(){
  let length = colorcontainer.children.length
  if(length > 1){
    let colorString = ''
    for (let id = 0; id < length; id++) {
      colorString += `${colorcontainer.childNodes[id].value},`
    }
    gradientindicator.style.backgroundImage = `linear-gradient(0.25turn,`+ colorString.slice(0, -1) +`)`
  }else{
    gradientindicator.style.backgroundImage = `linear-gradient(0.25turn,${colorcontainer.childNodes[0].value},${colorcontainer.childNodes[0].value})`
  }

}
function colorFields(value){
  let length = colorcontainer.children.length
  if (length < value){
    for (let step = 0; step < value - length; step++) {
      rgb = document.createElement("input")
      rgb.type = "color"
      rgb.value = "#" + Math.floor(Math.random()*16777215).toString(16)
      rgb.onchange = updateGradient
      rgb.classList.add("rgb");
      colorcontainer.appendChild(rgb);
    }
  }
  else if (length > value){
    for (let step = 1; step <= length-value; step++) {
      colorcontainer.removeChild(colorcontainer.children[length-step])
    }
  }
  if(appconfig.linear){
    updateGradient()
  }
}
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result ? {
    r: parseFloat(parseInt(result[1], 16)),
    g: parseFloat(parseInt(result[2], 16)),
    b: parseFloat(parseInt(result[3], 16))
  } : null;
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
  filesaved = false
  persistant = false
}
function loadTheFile(){
  file = require((filepath.slice(0,-4) + ".json"));
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
            EmitterColor.style.backgroundColor = `RGB(${itemsD[itemsD.length -1].value[0]*255},${itemsD[itemsD.length -1].value[1]*255},${itemsD[itemsD.length -1].value[2]*255})`
          }else{
            let E = itemsD[itemsD.length-1].value.items.length - 1 
            let itemsE = itemsD[itemsD.length -1].value.items
            let array = null
            let colorString = ""
            for (let F = 0; F < itemsE[E].value.items.length; F++) {
              array = itemsE[E].value.items[F]
              colorString += `RGB(${array[0]*255},${array[1]*255},${array[2]*255}) ${itemsE[E-1].value.items[F]*100}%,`
            }
            EmitterColor.style.backgroundImage = `linear-gradient(0.25turn,`+ colorString.slice(0, -1) +`)`
          } 
        }else{
          if(birthColorIndex != null){
            let itemsD = itemsC[birthColorIndex].value.items;
            for (let D = 0; D < itemsD.length; D++) {
              if(itemsD[D].key == "constantValue"){
                EmitterColor.classList.add("color-solid")
                EmitterColor.style.backgroundColor = `RGB(${itemsD[D].value[0]*255},${itemsD[D].value[1]*255},${itemsD[D].value[2]*255})`
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
function linearColoring(){

}
function randomColoring(colors,old){
  let rgb = hexToRgb(colors[Math.floor(Math.random() * colors.length)].value)
  if(appconfig.ignoreBW){
    if((old[0] == 0 && old[1] == 0 && old[2] == 0) || (old[0] == 1 && old[1] == 1 && old[2] == 1)){
      return {
        r: old[0] *255,
        g: old[1] *255,
        b: old[2] *255
      }
    }
  }
  old[0] = rgb.r/256
  old[1] = rgb.g/256
  old[2] = rgb.b/256
  return rgb
}
function fetchColors(){
  return document.getElementById("color-container").children
}
function recolorSelected(){
  let complexEmitterList = document.getElementById("complexEmitterList")

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
          if(appconfig.linear){
            if (colorIndex != null){
              
            }else{
              colorIndex = itemsC.length
              itemsC[colorIndex] = {
                key: "color",
                type: "embed",
                value:{
                  items:[{},{}],
                  name: "ValueColor"
                }
              }
              
            }
            let itemsD = itemsC[colorIndex].value.items;
            let dynid = itemsD.length-1
            let colorcount = colorcontainer.childNodes.length
            let times =  []
            let values = []
            
            for (let id = 0; id < colorcount; id++) {
              let color = hexToRgb(colorcontainer.childNodes[id].value)
              values.push([(color.r/256),(color.g/256),(color.b/256),255])
              times.push(1/(colorcount-1)*id)
            }
            itemsD[dynid].key = "dynamics"
            itemsD[dynid].type = "pointer"
            itemsD[dynid].value = {
              items:[
                {
                  key: "times",
                  type: "list",
                  value: {
                    items: times,
                    valueType: "f32"
                  }
                },
                {
                  key: "values",
                  type: "list",
                  value: {
                    items: values,
                    valueType: "vec4"
                  }
                }
              ],
              name: "VfxAnimatedColorVariableData"
            }
            
            if(EmitterColor.classList.length > 1){
              EmitterColor.classList.remove('color-solid')
            }
            EmitterColor.style.backgroundImage=gradientindicator.style.backgroundImage
          }else{
            if (colorIndex != null){
              let itemsD = itemsC[colorIndex].value.items;
              for (let D = 0; D < itemsD.length; D++) {
                if(itemsD[D].key == "constantValue"){
                  let color = undefined
                  for (let D = 0; D < itemsD.length; D++) {
                    if(itemsD[D].key == "constantValue"){
                      color = randomColoring(fetchColors(),itemsD[D].value)
                      
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
                    color = randomColoring(fetchColors(),array)
                    colorString += `RGB(${color.r},${color.g},${color.b}) ${itemsE[E-1].value.items[F]*100}%,`
                    
                  }
                  EmitterColor.style.backgroundImage = `linear-gradient(0.25turn,`+ colorString.slice(0, -1) +`)`
                }
              }
            }else{
              if(birthColorIndex != null){
                let itemsD = itemsC[birthColorIndex].value.items;
                for (let D = 0; D < itemsD.length; D++) {
                  if(itemsD[D].key == "constantValue"){
                    let color = null
                    color = randomColoring(fetchColors(),itemsD[D].value)
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
  createAlert("Recolored Selection");
}
function saveBin(){
  jsonfile = JSON.stringify(file,null,2)
  fs.writeFileSync((filepath.slice(0,-4) + ".json"),jsonfile,"utf8")
  exec(`"${appconfig.ritoBinPath}" -o bin "${(filepath.slice(0,-4) + ".json")}"`)
  createAlert(`File saved, dont forget to delete\n.json files from directory`);
}