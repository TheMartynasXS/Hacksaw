const { exec } = require('child_process');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

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

ipcRenderer.on('update_available', () => {
  ipcRenderer.removeAllListeners('update_available');
  dismissAlert()
  createAlert("New version available press OK to download").then(boolean =>{if(boolean){restartApp()}})
});ipcRenderer.on('update_downloaded', () => {
  ipcRenderer.removeAllListeners('update_downloaded');
  dismissAlert()
  createAlert("New Version downloaded OK to download")
});
function restartApp() {
  ipcRenderer.sendSync('restart_app');
}
const appconfigpath = path.join(ipcRenderer.sendSync('ConfigPath') + '\\binsplash\\' + 'config.json')

let isExists = fs.existsSync(appconfigpath, 'utf8')
if (isExists == false){
  createAlert("You have to select Ritobin_cli.exe for the program to work")
  settingsMenu()
}else{
  appconfig = require(appconfigpath)
  if(appconfig.ignoreBW){
    document.getElementById("bwvalues").checked = true
  }
  if(appconfig.editBlendmodes){
    document.getElementById("bmvalues").checked = true
  }
  if(appconfig.rainbow){
    document.getElementById("slider-input-container").style.display = "none"
    document.getElementById("color-container").style.display = "none"
    document.getElementById("rainbow").checked = true
    document.getElementById("nav").style.maxHeight = "calc(100vh - 275px)"
    document.getElementById("navdiv").style.maxHeight = "calc(100vh - 205px)"
  }
}
function saveConfig(){
  appconfig.ignoreBW = document.getElementById("bwvalues").checked
  appconfig.editBlendmodes = document.getElementById("bmvalues").checked
  appconfig.rainbow = document.getElementById("rainbow").checked
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
function colorFields(value){
  container = document.getElementById("color-container")
  length = container.children.length
  if (length < value){
    for (let step = 0; step < value - length; step++) {
      rgb = document.createElement("input")
      rgb.type = "color"
      rgb.value = "#" + Math.floor(Math.random()*16777215).toString(16)
      rgb.classList.add("rgb");
      container.appendChild(rgb);
    }
  }
  else if (length > value){
    for (let step = 1; step <= length-value; step++) {
      container.removeChild(container.children[length-step])
    }
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
function colordisplay(item){
  let colorone = Math.round(item[0]*255)
  let colortwo = Math.round(item[1]*255)
  let colorthree = Math.round(item[2]*255)
  return `RGB(${colorone},${colortwo},${colorthree})`
}
function selectFiles(){
  filepath = ipcRenderer.sendSync('fileselect')[0]
  if(filepath == undefined){
    return 0
  }
  document.title = `BinSplash - ${filepath.substring(filepath.lastIndexOf('\\') + 1)}`
  const checkTime = 1000;
  
  if(fs.existsSync((filepath.slice(0,-4) + ".json"), 'utf8') == false){
    exec(`"${appconfig.ritoBinPath}" -o json "${filepath}"`)
  }
  const timerId = setInterval(() => {
    if(fs.existsSync((filepath.slice(0,-4) + ".json"), 'utf8')) {
            
      file = require((filepath.slice(0,-4) + ".json"));
      let complexEmitterList = document.getElementById("complexEmitterList")
      complexEmitterList.textContent = ''
      let itemsA = file.entries.value.items
      for (let A = 0; A < itemsA.length; A++) {
        if (itemsA[A].value.items[0].key == "complexEmitterDefinitionData"){
          itemsZero = itemsA[A].value.items
          itemsZero.forEach(itemZero => {
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
                for (let C = 0; C < itemsC.length; C++) {
                  if (itemsC[C].key == "emitterName"){
                    createEmitterItem(EmitterList,itemsC[C].value)
                  } 
                }
              }
            }

          });
        }
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
                EmitterColor.classList.add("color-gradient")
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
      clearInterval(timerId)
    }
  }, checkTime)
}
function selectRitobin(){
  appconfig.ritoBinPath = ipcRenderer.sendSync('ritobinselect')[0]
}
function checkchildren(object,invert){
  for (let J = 0; J < object.childNodes[1].childNodes.length; J++) {
    if(invert){
      object.childNodes[1].childNodes[J].childNodes[0].checked = !object.childNodes[1].childNodes[J].childNodes[0].checked
    }else{
      if (object.childNodes[0].childNodes[0].checked) {
        object.childNodes[1].childNodes[J].childNodes[0].checked = true
      }
      if (!object.childNodes[0].childNodes[0].checked) {
        object.childNodes[1].childNodes[J].childNodes[0].checked = false
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

  for (let I = 0; I < emitterList.length; I++) 
  {
    let search = new RegExp(filterString, "i")
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

function doColoring(){
  let colors = document.getElementById("color-container").children
  return colors[Math.floor(Math.random() * colors.length)].value
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
          if (colorIndex != null){
            let itemsD = itemsC[colorIndex].value.items;
            for (let D = 0; D < itemsD.length; D++) {
              if(itemsD[D].key == "constantValue"){
                for (let D = 0; D < itemsD.length; D++) {
                  if(itemsD[D].key == "constantValue"){
                    if(appconfig.ignoreBW){
                      if((itemsD[D].value[0] == 0 && itemsD[D].value[1] == 0 && itemsD[D].value[1] == 0) || (itemsD[D].value[0] == 1 && itemsD[D].value[1] == 1 && itemsD[D].value[2] == 1)){break}
                    }
                    if(appconfig.rainbow == false){
                      color = hexToRgb(doColoring())
                    }else{
                      color = {r:Math.floor(Math.random() * 255),g:Math.floor(Math.random() * 255),b:Math.floor(Math.random() * 255)}
                    }
                    itemsD[D].value[0] = color.r/256
                    itemsD[D].value[1] = color.g/256
                    itemsD[D].value[2] = color.b/256
                    EmitterColor.style.backgroundColor = `RGB(${color.r},${color.g},${color.b})`
                    
                  }
                }
                if(appconfig.rainbow == false){
                  color = hexToRgb(doColoring())
                }else{
                  color = {r:Math.floor(Math.random() * 255),g:Math.floor(Math.random() * 255),b:Math.floor(Math.random() * 255)}
                }
                EmitterColor.style.backgroundColor = `RGB(${color.r},${color.g},${color.b})`
                
              }else{
                let E = itemsD[D].value.items.length - 1 
                let itemsE = itemsD[D].value.items
                let array = null
                let colorString = ""
                for (let F = 0; F < itemsE[E].value.items.length; F++) {
                  if(appconfig.rainbow == false){
                    color = hexToRgb(doColoring())
                  }else{
                    color = {r:Math.floor(Math.random() * 255),g:Math.floor(Math.random() * 255),b:Math.floor(Math.random() * 255)}
                  }
                  array = itemsE[E].value.items[F]
                  if(appconfig.ignoreBW){
                    if((array[0] == 0 && array[1] == 0 && array[2] == 0) || (array[0] == 1 && array[1] == 1 && array[2] == 1)){
                      colorString += `RGB(${array[0]*255},${array[1]*255},${array[2]*255}) ${itemsE[E-1].value.items[F]*100}%,`
                      continue
                    }
                  }
                  array[0] = color.r/255
                  array[1] = color.g/255
                  array[2] = color.b/255
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
                  if(appconfig.ignoreBW){
                    if((itemsD[D].value[0] == 0 && itemsD[D].value[1] == 0 && itemsD[D].value[1] == 0) || (itemsD[D].value[0] == 1 && itemsD[D].value[1] == 1 && itemsD[D].value[2] == 1)){break}
                  }
                  if(appconfig.rainbow == false){
                    let color = hexToRgb(doColoring())
                  }else{
                    let color = {r:Math.floor(Math.random() * 255),g:Math.floor(Math.random() * 255),b:Math.floor(Math.random() * 255)}
                  }
                  itemsD[D].value[0] = color.r/256
                  itemsD[D].value[1] = color.g/256
                  itemsD[D].value[2] = color.b/256
                  EmitterColor.style.backgroundColor = `RGB(${color.r},${color.g},${color.b})`
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