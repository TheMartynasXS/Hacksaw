const Open = require('open');
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

function ReColor(ColorProp)
{
  let DynamicsIndex = ColorProp.value.items.findIndex(item => item.key == "dynamics")
  let ConstantIndex = ColorProp.value.items.findIndex(item => item.key == "constantValue")
  if(DynamicsIndex >= 0 && Palette.length > 1)
  { 
    let ColorValue = ColorProp.value.items.find(item => item.key == "dynamics").value.items
    
    if(Prefs.Advanced)
    {
      let KeepTimings
      if(ColorValue[1].value.items.length == Palette.length){
        KeepTimings = true
      }
      else
      {
        KeepTimings = false
        ColorValue[1].value.items = []
        ColorValue[0].value.items = []
      }
      
      Palette.map((item,i)=>{
        if(KeepTimings == true)
        {
          ColorValue[0].value.items[i] = ReMap(item.time,[0,100],[0,1])
        
          ColorValue[1].value.items[i] =
            [
              ReMap(item.color[0],[0,255],[0,1]),
              ReMap(item.color[1],[0,255],[0,1]),
              ReMap(item.color[2],[0,255],[0,1]),
              (i == 0 || i == Palette.length-1) ? 0 : 1
            ]
        }
        else
        {
          ColorValue[0].value.items.push(ReMap(item.time,[0,100],[0,1]))
        
          ColorValue[1].value.items.push([
              ReMap(item.color[0],[0,255],[0,1]),
              ReMap(item.color[1],[0,255],[0,1]),
              ReMap(item.color[2],[0,255],[0,1]),
              (i == 0 || i == Palette.length-1) ? 0 : 1
            ])
        }
      })
      ColorProp[DynamicsIndex] = ColorValue
    }
    else
    {
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
    ColorProp[DynamicsIndex] = ColorValue
  }
  else if (ConstantIndex >= 0)
  {
    let ColorValue = ColorProp.value.items[ConstantIndex].value
    if(Prefs.IgnoreBW)
    {
      if(!((ColorValue[0] == 0 && ColorValue[1] == 0 && ColorValue[2] == 0)
      || (ColorValue[0] == 1 && ColorValue[1] == 1 && ColorValue[2] == 1)))
      {
        let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color
  
        ColorValue[0] = ReMap(NewColor[0],[0,255],[0,1])
        ColorValue[1] = ReMap(NewColor[1],[0,255],[0,1])
        ColorValue[2] = ReMap(NewColor[2],[0,255],[0,1])
      }
    }
    else
    {
      let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].color
  
      ColorValue[0] = ReMap(NewColor[0],[0,255],[0,1])
      ColorValue[1] = ReMap(NewColor[1],[0,255],[0,1])
      ColorValue[2] = ReMap(NewColor[2],[0,255],[0,1])
    }
    ColorValue[3] = 1
    //console.log(ColorProp.value)
  }
  return ColorProp
}

function CreateAlert(message)
{
  if (document.getElementById("dim-bg") != undefined)
  {
    document.getElementById("dim-bg").remove()
    CreateAlert(message)
  }
  else
  {
    let dim = document.createElement("div")
    dim.className = "justify-center content-center flex-1 h-full w-full flex absolute p-12 bg-black bg-opacity-50"
    dim.id = "dim-bg"
    document.getElementById("root").appendChild(dim)
    let alertdiv = document.createElement("div")
    alertdiv.className = "flex-1 rounded-md flex flex-col justify-between bg-gray-700 p-12"
  
    let info = document.createElement("div")
    info.className = "flex-1 text-white"
    info.innerText = message
    alertdiv.appendChild(info)
    dim.appendChild(alertdiv)
    
    let dismissbuttondiv = document.createElement("div")
    dismissbuttondiv.className = "mx-2 my-2 bg-black bg-opacity-20 rounded-lg flex"
    alertdiv.appendChild(dismissbuttondiv)
    let alertdismiss = document.createElement("button")
    alertdismiss.className = "btn-reg-black flex-1"
    alertdismiss.textContent = "OK"
    alertdismiss.onclick = () => {dim.remove()}
    dismissbuttondiv.appendChild(alertdismiss)  
  }
}

function OpenGitHub()
{
  Open('https://github.com/DevMarcius/binsplash')
}

function Clone(Object){return JSON.parse(JSON.stringify(Object))}
module.exports = { HEXtoRGB , RGBtoHEX , ReMap , GetColor , ToBG, Clone, ReColor, CreateAlert}