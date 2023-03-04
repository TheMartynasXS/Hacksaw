const { Tab } = require('../javascript/shared.js');
window.onerror = function (msg, file, lineNo, columnNo) {
  ipcRenderer.send("Message", {
    type: "error",
    title: file + " @ line: " + lineNo + " col: " + columnNo,
    Message: msg
  })
};
File = require('../skin0.json')
OpenPrimaryBin()
OpenSecondaryBin()
function Stitch() {
  FileSaved = false
  Persist = true
  // FileCache.push(UTIL.Clone(File))
  let ParticleObject = File.entries.value.items;
  let FirstIndex = ParticleObject.findIndex(item => item.value.name == "VfxSystemDefinitionData")


  for (let PO_ID = 0; PO_ID < Secondary.children.length; PO_ID++) {
    let DefData = ParticleObject[PO_ID + FirstIndex].value.items
    let DomDefData = Secondary.children[PO_ID].children
    for (let B = 1; B < Secondary.children[PO_ID].children.length; B++) {
      for (let C = DomDefData[B].children.length - 1; C >= 0; C--) {
        let DomEmitter = DomDefData[B].children[C].children
        if (DomEmitter[0].checked) {

          DefData[B - 1].value.items.slice(C)
          let Props = DefData[B - 1].value.items[C].items
          Primary.children[Active].appendChild(DomDefData[B].children[C])
          DomDefData[B].children[C].remove()
        }
      }
    }
  }
}
let Active = null
function RadioSelect(Target) {
  Active = UTIL.GetChildIndex(Target.parentNode.parentNode)
}
function OpenPrimaryBin() {
  let Target = document.getElementById('Primary')
  Target.innerText = ""
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
          <input type="radio" onchange="RadioSelect(this)" name="Primary"/>
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

            let Emitter = document.createElement('div')

            Emitter.className = "Flex Emitter-Div"
            let Input = document.createElement('button')
            Input.innerText = "Delete"
            Input.onclick = (Event) => {
              console.log(ParticleObject[PO_ID].value.items)
              Props.splice(C, 1)
              Event.target.parentNode.remove()
              for (let i = 0; i < DefData.length; i++) {
                ParticleObject[PO_ID].value.items[i] = DefData[i]
              }
              //   ParticleObject[PO_ID].value.items.splice(0,DefData.length)

              //   ParticleObject[PO_ID].value.items.unshift(DefData)
            }
            Emitter.appendChild(Input)
            let Title = document.createElement('div')
            Title.className = "Label Flex-1 Ellipsis"
            Title.innerText = Props[C].items[Props[C].items.findIndex(item => item.key == "emitterName")]?.value
            Emitter.appendChild(Title)


            DefDataDiv.appendChild(Emitter)
          }
        }
      }
      Target.appendChild(ParticleDiv)
    }
  }
}
function OpenSecondaryBin() {
  let Target = document.getElementById('Secondary')
  Target.innerText = ""
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
          if (DefData[B].key == "complexEmitterDefinitionData" || DefData[B].key == "simpleEmitterDefinitionData") {

            let Emitter = document.createElement('div')

            Emitter.className = "Flex Emitter-Div"
            let Input = document.createElement('input')
            Input.type = "checkbox"
            Emitter.appendChild(Input)
            let Title = document.createElement('div')
            Title.className = "Label Flex-1 Ellipsis"
            Title.innerText = Props[C].items[Props[C].items.findIndex(item => item.key == "emitterName")]?.value
            Emitter.appendChild(Title)


            DefDataDiv.appendChild(Emitter)
          }
        }
      }
      Target.appendChild(ParticleDiv)
    }
  }
}