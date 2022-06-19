
window.location.href = "C:/Projects/hacksaw/html/binsplash.html"
// let SavedColorDiv = document.getElementById("Saved-Color-List");
//     SavedColorDiv.innerHTML = null;
// Prefs.SavedColors?.map((item, ID) => {
//     let SampleDom = document.createElement("div");
//     SampleDom.className = "Input-Group Sample";
//     SampleDom.style.background = item;

//     let SwapDiv = document.createElement("div");
//     SwapDiv.className = "Flex";
    
//     SampleDom.appendChild(SwapDiv);

//     let Delete = document.createElement("button");
//     Delete.innerText = "Delete";
//     Delete.onclick = (Event) => {
//         Prefs.SavedColors.splice(ID, 1);
//         Event.target.parentNode.remove();
//         UTIL.SavePrefs();
//         PerTabInit(true);
//     };
//     SampleDom.appendChild(Delete);

//     SavedColorDiv.appendChild(SampleDom);
// });

// const CC = require('color-convert')
// const { getColorHexRGB } = require('electron-color-picker');
// let ColorPicker = document.getElementById('Color-Picker')
// let ColorInput = document.getElementById('RGB')
// let Hex = document.getElementById('Hex')
// let EyeDropper = document.getElementById('Eye-Dropper')

// const {Tab} = require('../javascript/shared.js');

// let XRGB = document.getElementById('XRGB')
// let XR = document.getElementById('XR')
// let XG = document.getElementById('XG')
// let XB = document.getElementById('XB')

// ColorInput.value = '#' + CC.rgb.hex(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255))

// const PickScreen = async () => {
//     const color = await getColorHexRGB().catch((error) => {
//         console.warn('[ERROR] getColor', error)
//         return ''
//     })
//     ColorInput.value = color

//     Hex.value = color
//     let temp = CC.hex.rgb(color)
//     temp[0] = parseFloat(UTIL.ReMap(temp[0], [0, 255], [0, 1]).toPrecision(6))
//     temp[1] = parseFloat(UTIL.ReMap(temp[1], [0, 255], [0, 1]).toPrecision(6))
//     temp[2] = parseFloat(UTIL.ReMap(temp[2], [0, 255], [0, 1]).toPrecision(6))
//     XRGB.value = `${temp[0]} , ${temp[1]} , ${temp[2]}`
//     XR.value = temp[0]
//     XG.value = temp[1]
//     XB.value = temp[2]
// }
// EyeDropper.onclick = () => PickScreen()
// // ColorPickerInputs.appendChild(EyeDropper)
// ColorInput.oninput = (E) => {
//     Hex.value = E.target.value
//     let temp = CC.hex.rgb(E.target.value)
//     temp[0] = parseFloat(UTIL.ReMap(temp[0], [0, 255], [0, 1]).toPrecision(6))
//     temp[1] = parseFloat(UTIL.ReMap(temp[1], [0, 255], [0, 1]).toPrecision(6))
//     temp[2] = parseFloat(UTIL.ReMap(temp[2], [0, 255], [0, 1]).toPrecision(6))
//     XRGB.value = `${temp[0]} , ${temp[1]} , ${temp[2]}`
//     XR.value = temp[0]
//     XG.value = temp[1]
//     XB.value = temp[2]
// }
// Hex.oninput = (Event) => {
//     if (!Event.target.value.startsWith('#')) {
//         Event.target.value = '#' + Event.target.value
//     }

//     ColorInput.value = Event.target.value

//     let temp = CC.hex.rgb(Event.target.value)
//     temp[0] = parseFloat(UTIL.ReMap(temp[0], [0, 255], [0, 1]).toPrecision(6))
//     temp[1] = parseFloat(UTIL.ReMap(temp[1], [0, 255], [0, 1]).toPrecision(6))
//     temp[2] = parseFloat(UTIL.ReMap(temp[2], [0, 255], [0, 1]).toPrecision(6))
//     XRGB.value = `${temp[0]} , ${temp[1]} , ${temp[2]}`
//     XR.value = temp[0]
//     XG.value = temp[1]
//     XB.value = temp[2]
// }
// Hex.onchange = (Event) => {
//     ColorInput.value = Event.target.value

//     let temp = CC.hex.rgb(Event.target.value)
//     temp[0] = parseFloat(UTIL.ReMap(temp[0], [0, 255], [0, 1]).toPrecision(6))
//     temp[1] = parseFloat(UTIL.ReMap(temp[1], [0, 255], [0, 1]).toPrecision(6))
//     temp[2] = parseFloat(UTIL.ReMap(temp[2], [0, 255], [0, 1]).toPrecision(6))
//     XRGB.value = `${temp[0]} , ${temp[1]} , ${temp[2]}`
//     XR.value = temp[0]
//     XG.value = temp[1]
//     XB.value = temp[2]
// }
// XRGB.oninput = (Event) => {
//     let temp = Event.target.value.split(",")
//     XR.value = temp[0]
//     XG.value = temp[1]
//     XB.value = temp[2]
//     temp[0] = UTIL.ReMap(temp[0], [0, 1], [0, 255])
//     temp[1] = UTIL.ReMap(temp[1], [0, 1], [0, 255])
//     temp[2] = UTIL.ReMap(temp[2], [0, 1], [0, 255])
//     Hex.value = `#${CC.rgb.hex(temp[0], temp[1], temp[2])}`
//     ColorInput.value = Hex.value
// }

// function SaveColor() {
//     if (Prefs.SavedColors == undefined) {
//         Prefs.SavedColors = []
//     }
//     else {
//         Prefs.SavedColors.push(ColorInput.value)
//     }
//     UTIL.SavePrefs()
//     PerTabInit(true)
// }