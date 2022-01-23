const CC = require('color-convert')
const { getColorHexRGB } = require('electron-color-picker');
let ColorPicker = document.getElementById('Color-Picker')
let ColorInput = document.getElementById('RGB')
let Hex = document.getElementById('Hex')
let EyeDropper = document.getElementById('Eye-Dropper')

let xrgb = document.getElementById('XRGB')
// let Rinput = document.getElementById('R')
// let Ginput = document.getElementById('G')
// let Binput = document.getElementById('B')

const PickScreen = async () => {
    const color = await getColorHexRGB().catch((error) => {
        console.warn('[ERROR] getColor', error)
        return ''
    })
    ColorInput.value = color
    let SubmitEvent = new Event('change')
    ColorInput.dispatchEvent(SubmitEvent)

}
EyeDropper.onclick = () => PickScreen()
// ColorPickerInputs.appendChild(EyeDropper)

ColorInput.onchange = (E) => {
    Hex.value = E.target.value
    let SubmitEvent = new Event('change')
    Hex.dispatchEvent(SubmitEvent)
}

Hex.oninput = (Event) => {
    if (!Event.target.value.startsWith('#')) {
        Event.target.value = '#' + Event.target.value
    }

    ColorInput.value = Event.target.value

    let temp = CC.hex.rgb(Event.target.value)
    temp[0] = parseFloat(UTIL.ReMap(temp[0], [0, 255], [0, 1]).toPrecision(6))
    temp[1] = parseFloat(UTIL.ReMap(temp[1], [0, 255], [0, 1]).toPrecision(6))
    temp[2] = parseFloat(UTIL.ReMap(temp[2], [0, 255], [0, 1]).toPrecision(6))
    xrgb.value = `${temp[0]} , ${temp[1]} , ${temp[2]}`
}
Hex.onchange = (Event) => {
    ColorInput.value = Event.target.value

    let temp = CC.hex.rgb(Event.target.value)
    temp[0] = parseFloat(UTIL.ReMap(temp[0], [0, 255], [0, 1]).toPrecision(6))
    temp[1] = parseFloat(UTIL.ReMap(temp[1], [0, 255], [0, 1]).toPrecision(6))
    temp[2] = parseFloat(UTIL.ReMap(temp[2], [0, 255], [0, 1]).toPrecision(6))
    xrgb.value = `${temp[0]} , ${temp[1]} , ${temp[2]}`
}
xrgb.oninput = (Event) => {
    let temp = Event.target.value.split(",")
    temp[0] = UTIL.ReMap(temp[0], [0, 1], [0, 255])
    temp[1] = UTIL.ReMap(temp[1], [0, 1], [0, 255])
    temp[2] = UTIL.ReMap(temp[2], [0, 1], [0, 255])
    Hex.value = `#${CC.rgb.hex(temp[0], temp[1], temp[2])}`
    ColorInput.value = Hex.value
}