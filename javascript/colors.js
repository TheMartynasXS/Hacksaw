const {ColorTranslator} = require('colortranslator')

function Clamp (num, min = 0, max = 1){return Math.min(Math.max(num, min), max);}
let x = Math.random
function GetColor(Property){
    if(Property?.type == 'vec4') return [new ColorHandler(Property.value)]
    
    let DynID = Property.findIndex(item => item.key == 'dynamics')
    let ConstID = Property.findIndex(item => item.key == 'constantValue')
    if (DynID >= 0) {
        let ProbTableID = Property[DynID].value.items.findIndex(item => item.key == 'probabilityTables')
            if (ProbTableID >= 0) Property[DynID].value.items.shift()
    }
    let Palette = []
  
    if(DynID >= 0){
        let Dynamics = Property[DynID].value.items
        let DynTimes = Dynamics[0].value.items
        let DynColors = Dynamics[1].value.items
        for(let i = 0; i < DynTimes.length; i++){
            Palette.push(new ColorHandler(DynColors[i], DynTimes[i]))
        }
    } else if(ConstID >= 0){
        let Constant = Property[ConstID].value
        Palette.push(new ColorHandler(Constant))
    }
    return Palette
}

function ToBG(Palette){
    if(Palette.length == 1){
        return `${Palette[0].hex} ${Palette[0].time}%`
    } else if (Palette.length > 1){
        let result = []
        for(let i = 0; i < Palette.length; i++){
            result.push(`${Palette[i].hex} ${Math.round(Palette[i].time * 100)}% `)
        }
        return `linear-gradient(0.25turn,${result.join(', ')})`
    }
    
}

class ColorHandler {
    constructor(vec4 = [x(),x(),x(),x()],time = 0){
        this.vec4 = [Clamp(vec4[0]),Clamp(vec4[1]),Clamp(vec4[2]),Clamp(vec4[3])]
        this.hex = ColorTranslator.toHEX({r:vec4[0]*255,g:vec4[1]*255,b:vec4[2]*255})
        this.time = time
    }

    input(hex,alpha = this.vec4[3]){
        let temp = ColorTranslator.toRGB(hex,false)
        this.hex = hex
        this.vec4 = [
           temp.r/255,
           temp.g/255,
           temp.b/255,
           alpha
        ]
    }
}

module.exports = {
    ColorHandler, ToBG, GetColor
}