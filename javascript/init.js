let { ipcRenderer } = require('electron')
let fs = require('fs')
let path = require('path')
let CssPath = `${ipcRenderer.sendSync('UserPath')}\\Customize.css`
let CustomCss = fs.existsSync(CssPath) == true ? fs.readFileSync(CssPath, "utf-8") : null


const UTIL = require('../javascript/utilities');

const PrefsPath = `${ipcRenderer.sendSync('UserPath')}\\config.json`

let Prefs = fs.existsSync(PrefsPath) ? require(PrefsPath) : {
    "Version": ipcRenderer.sendSync('Version'),
    "PreferredMode": 0,
    "PreferredTarget": 0,
    "IgnoreBW" : true,
    "ColorSamples": [],
    "RitoBinPath": ""
}

function Tab(Location) {
    if (typeof (FileSaved) != 'undefined') {
        if (FileSaved == true) {
            window.location.href = Location
        }
        else {
            UTIL.CreateAlert('You may have forgotten to save your bin.','Save before proceeding please.')
            FileSaved = true
        }
    } else {
        window.location.href = Location
    }
}
window.addEventListener('load', function () {
    PerTabInit(true)
  })

function PerTabInit(Initial = false) {
    if (document.location.href.endsWith('settings.html')) {
        console.log('setts')
        document.getElementById('Mode').value = Prefs.PreferredMode
        document.getElementById('Target').value = Prefs.PreferredTarget
        document.getElementById('IgnoreBW').checked = Prefs.IgnoreBW

    } else if (document.location.href.endsWith('binsplash.html')) {
        if(Initial){
            document.getElementById('Mode').value = Prefs.PreferredMode
            document.getElementById('Target').value = Prefs.PreferredTarget
        }
        if (document.getElementById('Mode').value == 1) {
            GradientIndicator.style.display = "flex"
            TimeContainer.style.display = "flex"
        }
        else{
            GradientIndicator.style.display = "none"
            TimeContainer.style.display = "none"
        }
    } else if (document.location.href.endsWith('xrgb.html')){
        let SavedColorDiv = document.getElementById('Saved-Color-List')
        SavedColorDiv.innerHTML = null
        Prefs.SavedColors.map((item, ID) => {
            let SampleDom = document.createElement("div")
            SampleDom.className = "Input-Group Sample"
            SampleDom.style.background = item
      
            let SwapDiv = document.createElement('div')
            SwapDiv.className = "Flex"
            let UpButton = document.createElement('button')
            UpButton.innerText = "▲"
            UpButton.onclick = (Event) => {
              if (ID > 0) {
                [Prefs.SavedColors[ID - 1], Prefs.SavedColors[ID]] = [Prefs.SavedColors[ID], Prefs.SavedColors[ID - 1]]
                UTIL.SavePrefs()
                PerTabInit(true)
              }
            }
            let DownButton = document.createElement('button')
            DownButton.innerText = "▼"
            DownButton.onclick = (Event) => {
              if (ID < Prefs.ColorSamples.length - 1) {
                [Prefs.SavedColors[ID], Prefs.SavedColors[ID + 1]] = [Prefs.SavedColors[ID + 1], Prefs.SavedColors[ID]]
                UTIL.SavePrefs()
                PerTabInit(true)
              }
            }
            SwapDiv.appendChild(UpButton)
            SwapDiv.appendChild(DownButton)
            SampleDom.appendChild(SwapDiv)
      
            // let UseThis = document.createElement('button')
            // // UseThis.onclick = () => {
            // //   Palette = UTIL.Clone(Sample.value)
            // //   MapPalette()
            // //   Dim.remove()
            // //   document.getElementById('Slider-Input').value = Palette.length
            // // }
            // UseThis.innerText = "Sample"
            // SampleDom.appendChild(UseThis)
      
            
            let Delete = document.createElement('button')
            Delete.innerText = "Delete"
            Delete.onclick = (Event) => {
              Prefs.SavedColors.splice(ID, 1)
              Event.target.parentNode.remove()
              UTIL.SavePrefs()
              PerTabInit(true)
            }
            SampleDom.appendChild(Delete)
      
            SavedColorDiv.appendChild(SampleDom)
          })
    }
}



if (Prefs.Version != ipcRenderer.sendSync('Version')) {
    Prefs.Version = ipcRenderer.sendSync('Version')
    UTIL.SavePrefs()
}



// if (document.location.href.endsWith('settings.html') == false && Prefs.RitoBinPath.length == 0) {
    
//     UTIL.CreateAlert('Ritobin Installation missing',
//     `Go to settings tab to select your Ritobin_cli.exe

//     This step is 100% necessary for the conversion of bin files`)
    
//     window.location.href = './settings.html'
// }