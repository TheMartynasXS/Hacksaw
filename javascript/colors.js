function Clamp(num, min = 0, max = 1) { return Math.min(Math.max(num, min), max); }
let x = Math.random
function GetColor(Property) {
    if (/vec4/i.test(Property?.type)) return [new ColorHandler(Property.value)]

    let DynID = Property?.findIndex(item => item.key.toString().toLowerCase() == "dynamics")
    let ConstID = Property?.findIndex(item => item.key.toString().toLowerCase() == "constantvalue")
    if (DynID >= 0) {
        let ProbTableID = Property[DynID].value.items.findIndex(item => item.key.toString().toLowerCase() == "probabilitytables")
        if (ProbTableID >= 0) Property[DynID].value.items.shift()
    }
    let Palette = []

    if (DynID >= 0) {
        let Dynamics = Property[DynID].value.items
        let DynTimes = Dynamics[0].value.items
        let DynColors = Dynamics[1].value.items
        for (let i = 0; i < DynTimes.length; i++) {
            Palette.push(new ColorHandler(DynColors[i], DynTimes[i]))
        }
    } else if (ConstID >= 0) {
        let Constant = Property[ConstID].value
        Palette.push(new ColorHandler(Constant))
    }
    return Palette
}

function ToBG(Palette) {
    if (Palette.length == 1) {
        return `${Palette[0].ToHEX()} ${Palette[0].time}%`
    } else if (Palette.length > 1) {
        let result = []
        for (let i = 0; i < Palette.length; i++) {
            result.push(`${Palette[i].ToHEX()} ${Math.round(Palette[i].time * 100)}% `)
        }
        return `linear-gradient(0.25turn,${result.join(', ')})`
    }

}

class ColorHandler {
    constructor(
        vec4 = [Math.random(), Math.random(), Math.random(), Math.random()],
        time = 0
    ) {
        this.r = Math.round(vec4[0] * 255);
        this.g = Math.round(vec4[1] * 255);
        this.b = Math.round(vec4[2] * 255);
        this.a = Math.round(vec4[3] * 100);
        this.vec4 = this.ToVec4()
        this.time = time;
    }
    InputHex(Hex) {
        this.r = parseInt(Hex.slice(1, 3), 16)
        this.g = parseInt(Hex.slice(3, 5), 16)
        this.b = parseInt(Hex.slice(5, 7), 16)

        this.vec4 = this.ToVec4()
    }
    InputAlpha(alpha) {
        this.a = alpha
        this.vec4[3] = alpha
    }
    InputVec4(vec4) {
        this.r = Math.round(vec4[0] * 255);
        this.g = Math.round(vec4[1] * 255);
        this.b = Math.round(vec4[2] * 255);
        this.a = Math.round(vec4[3] * 100);
        this.vec4 = this.ToVec4()
    }
    ToHEX() {
        let rr =
            this.r.toString(16).length > 1
                ? this.r.toString(16)
                : "0" + this.r.toString(16);
        let gg =
            this.g.toString(16).length > 1
                ? this.g.toString(16)
                : "0" + this.g.toString(16);
        let bb =
            this.b.toString(16).length > 1
                ? this.b.toString(16)
                : "0" + this.b.toString(16);
        return "#" + (rr + gg + bb);
    }
    ToVec4() {
        return [this.r / 255, this.g / 255, this.b / 255, this.a / 100];
    }
    SetTime(time) {
        this.time = time;
        this.vec4 = this.ToVec4()
    }
}

module.exports = {
    ColorHandler, ToBG, GetColor
}