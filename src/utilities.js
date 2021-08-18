/**
 * Maps given value from one int range to another.
 * @param {List} from - initial range ex: [0,10]
 * @param {List} to - secondary range ex: [2,9]
 */
function ReMap(value, from, to) {
  if(to == [0,255]){
    return Math.round((value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0]);
  }
  else
  {
    return (value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]) + to[0];
  }
}

function HEXtoRGB(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
  [
    parseFloat(parseInt(result[1], 16)),
    parseFloat(parseInt(result[2], 16)),
    parseFloat(parseInt(result[3], 16))
  ]: null
}
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
function RGBtoHEX(r,g,b) {
  return "#" + componentToHex(parseInt(r)) + componentToHex(parseInt(g)) + componentToHex(parseInt(b));
}
function GetColor(ColorProp){
  if (ColorProp == undefined)
  {
    return null
  }
  else
  {
    if(ColorProp[ColorProp.findIndex( item => item.key == "dynamics")])
    {
      let TempDyn = ColorProp[ColorProp.findIndex( item => item.key == "dynamics")].value.items
      let Palette = []
      
      for(let ID = 0; ID < TempDyn[1].value.items.length; ID++)
      {
        Palette.push(
          {
            time:UTIL.ReMap(TempDyn[TempDyn.findIndex( item => item.key == "times")].value.items[ID],[0,1],[0,100]),
            color:
              [
                UTIL.ReMap(TempDyn[TempDyn.findIndex( item => item.key == "values")].value.items[ID][0],[0,1],[0,255]),
                UTIL.ReMap(TempDyn[TempDyn.findIndex( item => item.key == "values")].value.items[ID][1],[0,1],[0,255]),
                UTIL.ReMap(TempDyn[TempDyn.findIndex( item => item.key == "values")].value.items[ID][2],[0,1],[0,255]),
                UTIL.ReMap(TempDyn[TempDyn.findIndex( item => item.key == "values")].value.items[ID][3],[0,1],[0,255])
              ]
          }
        )
      }
      return Palette
    }
    else
    {
      let TempConst = ColorProp[ColorProp.findIndex( item => item.key == "constantValue")]
      let Palette = [
        {
          time:0,
          color:
            [
              UTIL.ReMap(TempConst.value[0],[0,1],[0,255]),
              UTIL.ReMap(TempConst.value[1],[0,1],[0,255]),
              UTIL.ReMap(TempConst.value[2],[0,1],[0,255])
            ]
        }
      ]
      
      return Palette
    }
  }
}

function ToBG(Palette){
  if(Palette?.length == 1){
    return `RGB(${Math.round(Palette[0].color[0])},${Math.round(Palette[0].color[1])},${Math.round(Palette[0].color[2])})`
  }else if(Palette?.length > 1){
    let result = []
    for(let ID = 0; ID < Palette?.length; ID++)
    {
      result.push(`RGB(${Math.round(Palette[ID].color[0])},${Math.round(Palette[ID].color[1])},${Math.round(Palette[ID].color[2])}) ${Math.round(Palette[ID].time)}%`)
    }
    return `linear-gradient(0.25turn,${result.join(',')})`
  }
}

function ToDynamic(Palette,ColorValue, Advanced = false)
{  
  if(Prefs.Advanced)
  {
    if(Palette.length == ColorValue[1].value.items.length)
    {
      Palette.map(
        (item,i)=>{
          ColorValue[1].value.items[i] =
          [
            ReMap(item.color[0],[0,255],[0,1]),
            ReMap(item.color[1],[0,255],[0,1]),
            ReMap(item.color[2],[0,255],[0,1]),
            (i == 0 || i == Palette.length-1) ? 0 : 1
          ]
        }
      )
      
    }
    else
    {
      ColorValue[0].value.items = []
      ColorValue[1].value.items = []
      for(let i = 0; i < Palette.length; i++)
      {
        ColorValue[0].value.items.push(ReMap(Palette[i].time,[0,100],[0,1]))
        ColorValue[1].value.items.push([
          ReMap(Palette[i].color[0],[0,255],[0,1]),
          ReMap(Palette[i].color[1],[0,255],[0,1]),
          ReMap(Palette[i].color[2],[0,255],[0,1]),
          1
        ])
      }
    }
  }
  else
  {
    // this works

    for(let i = 0; i < ColorValue[1].value.items.length; i++)
    {
      let ColorBit = ColorValue[1].value.items[i]
      if(Prefs.IgnoreBW)
      {
        if(!((ColorBit[0] == 0 && ColorBit[1] == 0 && ColorBit[2] == 0)
        || (ColorBit[0] == 1 && ColorBit[1] == 1 && ColorBit[2] == 1)))
        {
          let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color
    
          for(let j = 0; j < ColorBit.length - 1; j++)
          {
            ColorBit[j] = ReMap(NewColor[j],[0,255],[0,1])
          }
        }
      }
      else
      {
        let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color
    
          for(let j = 0; j < ColorBit.length - 1; j++)
          {
            ColorBit[j] = ReMap(NewColor[j],[0,255],[0,1])
          }
      }
    }
  }
  return ColorValue
}

function ToConstant(Palette,ColorValue)
{
  if(Prefs.Advanced)
  {
    {
      let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color

      ColorValue[0] = ReMap(NewColor[0],[0,255],[0,1])
      ColorValue[1] = ReMap(NewColor[1],[0,255],[0,1])
      ColorValue[2] = ReMap(NewColor[2],[0,255],[0,1])
    }
  }
  else{
    // this works
    if(Prefs.IgnoreBW)
    {
      if(!((ColorValue[0] == 0 && ColorValue[1] == 0 && ColorValue[2] == 0)
      || (ColorValue[0] == 1 && ColorValue[1] == 1 && ColorValue[2] == 1)))
      {
        let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color
  
        for(let j = 0; j < ColorValue.length - 1; j++)
        {
          ColorValue[j] = ReMap(NewColor[j],[0,255],[0,1])
        }
      }
    }
    else
    {
      let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color
  
      for(let j = 0; j < ColorValue.length - 1; j++)
      {
        ColorValue[j] = ReMap(NewColor[j],[0,255],[0,1])
      }
    }
  }
  return ColorValue
}
function Clone(Object){return JSON.parse(JSON.stringify(Object))}
module.exports = { HEXtoRGB , RGBtoHEX , ReMap , GetColor , ToBG, Clone, ToDynamic, ToConstant}