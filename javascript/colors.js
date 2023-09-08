function Clamp(num, min = 0, max = 1) { return Math.min(Math.max(num, min), max); }
let x = Math.random
function GetColor(Property) {
    if (/vec4/i.test(Property?.type)) return [new ColorHandler(Property.value)]

    let DynID = Property?.findIndex(item => item.key == 3154345447)
    let ConstID = Property?.findIndex(item => item.key == 3031705514)
    if (DynID >= 0) {
        let ProbTableID = Property[DynID].value.items.findIndex(item => item.key == 2802337561)
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
    ToHSL() {
        let [r, g, b] = [this.vec4[0], this.vec4[1], this.vec4[2]]
        let max = Math.max(r, g, b)
        let min = Math.min(r, g, b)
        let h = 0, s, l = (max + min) / 2
        if (max == min) {
            h = s = 0
        } else {
            let d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6
        }
        return [h, s, l]
    }
    HSLShift(hue = 0, sat = 0, lig = 0) {
        let hsl = (this.ToHSL());
        hue = Math.abs(hue) >= 360 ? hue % 360 : hue;
        hsl[0] += hue / 360;
        let [h, s, l] = hsl;
        s = Math.min(Math.max(s + (sat / 100), 0.01), 1);
        l = Math.min(Math.max(l + (lig / 100), 0.01), 1);
        this.InputHSL([h, s, l])
    }
    InputHSL(hsl) {
        let h = hsl[0]
        let s = hsl[1]
        let l = hsl[2]
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        this.InputVec4([r, g, b, this.a])
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