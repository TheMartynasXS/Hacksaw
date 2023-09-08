
const { Tab } = require('../javascript/utils.js');

const { ColorHandler, GetColor, ToBG } = require('../javascript/colors.js');
// const {ColorTranslator} = require('colortranslator')
const path = require('path');
const { ipcRenderer } = require('electron');
const fs = require('fs');

let Color = new ColorHandler();

let ColorInput = document.getElementById('RGB')
let Hex = document.getElementById('Hex')
let XRGBA = document.getElementById('XRGB')
let XR = document.getElementById('XR')
let XG = document.getElementById('XG')
let XB = document.getElementById('XB')
let XA = document.getElementById('XA')

SetFields()
function SetFields() {
  let temp = Round()
  ColorInput.value = Color.ToHEX()
  Hex.value = Color.ToHEX()
  XRGBA.value = `{ ${temp[0]}, ${temp[1]}, ${temp[2]}, ${temp[3]} }`
  XR.value = temp[0]
  XG.value = temp[1]
  XB.value = temp[2]
  XA.value = temp[3]
}

ColorInput.addEventListener('input', (e) => {
  Color.InputHex(e.target.value)
  let temp = Round()
  Hex.value = Color.ToHEX()
  XRGBA.value = `{ ${temp[0]}, ${temp[1]}, ${temp[2]}, ${temp[3]} }`
  XR.value = temp[0]
  XG.value = temp[1]
  XB.value = temp[2]
  XA.value = temp[3]
})

Hex.addEventListener('input', (e) => {
  let fixed = e.target.value
  if (fixed[0] != '#') Hex.value = `#${fixed}`
  fixed = Hex.value
  while (fixed.length < 7) fixed = fixed + '0'

  Color.input(fixed)
  let temp = Round()
  ColorInput.value = Color.ToHEX()
  XRGBA.value = `{ ${temp[0]}, ${temp[1]}, ${temp[2]}, ${temp[3]} }`
  XR.value = temp[0]
  XG.value = temp[1]
  XB.value = temp[2]
  XA.value = temp[3]
})

XRGBA.addEventListener('input', (e) => {
  let list = e.target.value.slice(1, e.target.value.length - 2).split(',')
  Color = new ColorHandler([list[0], list[1], list[2], list[3]])
  let temp = Round()
  ColorInput.value = Color.ToHEX()
  Hex.value = Color.ToHEX()
  XR.value = temp[0]
  XG.value = temp[1]
  XB.value = temp[2]
  XA.value = temp[3]
})
XR.addEventListener('input', (e) => {
  Color = new ColorHandler([e.target.value, Color.vec4[1], Color.vec4[2], Color.vec4[3]])
  let temp = Round()
  ColorInput.value = Color.ToHEX()
  Hex.value = Color.ToHEX()
  XRGBA.value = `{ ${temp[0]}, ${temp[1]}, ${temp[2]}, ${temp[3]} }`
  XG.value = temp[1]
  XB.value = temp[2]
  XA.value = temp[3]
})
XG.addEventListener('input', (e) => {
  Color = new ColorHandler([Color.vec4[0], XG.value, Color.vec4[2], Color.vec4[3]])
  let temp = Round()
  ColorInput.value = Color.ToHEX()
  Hex.value = Color.ToHEX()
  XRGBA.value = `{ ${temp[0]}, ${temp[1]}, ${temp[2]}, ${temp[3]} }`
  XR.value = temp[0]
  XB.value = temp[2]
  XA.value = temp[3]
})
XB.addEventListener('input', (e) => {
  Color = new ColorHandler([Color.vec4[0], Color.vec4[1], XB.value, Color.vec4[3]])
  let temp = Round()
  ColorInput.value = Color.ToHEX()
  Hex.value = Color.ToHEX()
  XRGBA.value = `{ ${temp[0]}, ${temp[1]}, ${temp[2]}, ${temp[3]} }`
  XR.value = temp[0]
  XG.value = temp[1]
  XA.value = temp[3]
})
XA.addEventListener('input', (e) => {
  if(Hex.length != 1) Hex.value = '#000000'
  Color.input(Hex.value, e.target.value);
  let temp = Round()
  ColorInput.value = Color.ToHEX()
  Hex.value = Color.ToHEX()
  XRGBA.value = `{ ${temp[0]}, ${temp[1]}, ${temp[2]}, ${temp[3]} }`
  XR.value = temp[0]
  XG.value = temp[1]
  XB.value = temp[2]
})

function Round() {
  let dPoint = 10000000
  return [
    Math.ceil(Color.vec4[0] * dPoint) / dPoint,
    Math.ceil(Color.vec4[1] * dPoint) / dPoint,
    Math.ceil(Color.vec4[2] * dPoint) / dPoint,
    Math.ceil(Color.vec4[3] * dPoint) / dPoint
  ]
}

const { getColorHexRGB } = require('electron-color-picker');

document.getElementById('Eye-Dropper').addEventListener('click', async (e) => {
  let NewColor = await getColorHexRGB().catch((error) => {
    return ''
  })
  Color.input(NewColor)
  SetFields()
})

const UserData = ipcRenderer.sendSync("UserPath")
const xRGBAPath = path.join(UserData, "xRGBADB.json")

let SavedColorDiv = document.getElementById("Saved-Color-List")

function SaveColor() {
  SavedColors.add(Color)
  SavedColors.render()
}
class xRGBADB {
  constructor(xRGBAPath) {
    this.obj = JSON.parse(fs.readFileSync(xRGBAPath));
  }

  render() {
    SavedColorDiv.innerHTML = ""
    for (let i = 0; i < this.obj.length; i++) {
      let SampleDom = document.createElement("div");
      SampleDom.className = "Input-Group Sample Pointer";
      SampleDom.style.backgroundColor = `RGB(${this.obj[i][0] * 255},${this.obj[i][1] * 255},${this.obj[i][2] * 255})`

      SampleDom.onclick = () => {
        Color = new ColorHandler([this.obj[i][0], this.obj[i][1], this.obj[i][2], this.obj[i][3]])
        SetFields()
      }

      let Delete = document.createElement("button");
      Delete.innerText = "Delete";
      Delete.onclick = (Event) => {
        this.obj.splice(i, 1)
        this.save()
        this.render()
      };
      SampleDom.appendChild(Delete);
      SavedColorDiv.appendChild(SampleDom)
    }
  }

  add(Color) {
		this.obj.push(
			Color.vec4
		)
		this.save()
	}

	save() { fs.writeFileSync(xRGBAPath, JSON.stringify(this.obj, null, 2)); }
}
const SavedColors = new xRGBADB(xRGBAPath);

SavedColors.render()