let { ipcRenderer } = require('electron')
let fs = require('fs')
let path = require('path')
let CssPath = `${ipcRenderer.sendSync('UserPath')}\\Customize.css`
let CustomCss = fs.existsSync(CssPath) == true ? fs.readFileSync(CssPath, "utf-8") : null


const UTIL = require('../javascript/utilities');

const PrefsPath = `${ipcRenderer.sendSync('UserPath')}\\config.json`

let Prefs = fs.existsSync(PrefsPath) ? require(PrefsPath) : {
    "Version": ipcRenderer.sendSync('Version'),
    "Advanced": false,
    "ColorSamples": [],
    "RitoBinPath": ""
}

let SideBar = document.getElementById('Vertical-Menu')
SideBar.onmouseover = (Event) =>{
    if (Event.target.classList.contains('Vertical-Menu-Hidden') == true) {
        Event.target.classList.remove('Vertical-Menu-Hidden')
    }
}
SideBar.onmouseleave = (Event) => {
    if (Event.target.classList.contains('Vertical-Menu-Hidden') != true) {
        Event.target.classList.add('Vertical-Menu-Hidden')
    }
}

function Tab(Location) {
    if (typeof(FileSaved) != 'undefined') {
        if (FileSaved == true) {
            window.location.href = Location
        }
        else {
            UTIL.CreateAlert('You may have forgotten to save your bin.\n\nSave before proceeding please.')
            FileSaved = true
        }
    }else{
        window.location.href = Location
    }
}



if (document.location.href.endsWith('settings.html')) {
    if (Prefs.Advanced) {
        document.getElementById('Advanced').checked = true
    }
} else if (document.location.href.endsWith('binsplash.html')) {
    if (Prefs.Advanced) {
        GradientIndicator.style.display = "flex"
        TimeContainer.style.display = "flex"
    }
    else {
        GradientIndicator.style.display = "none"
        TimeContainer.style.display = "none"
    }
}

if (CustomCss == undefined || Prefs.Version != ipcRenderer.sendSync('Version')) {
    fs.writeFileSync(CssPath, `:root {
    --bg-one: #3a3b41;
    --bg-two: #303136;
    --bg-three: #28292e;
    --bg-accent: #484950;
    --accent: #ffc24f;
    --accent-success: #7BBA9C;
    --text-one: #eee;
}
*{
    font-size:14px;
}`)
    CustomCss = fs.readFileSync(CssPath, "utf-8")
    Prefs.Version = ipcRenderer.sendSync('Version')
    UTIL.SavePrefs()
}
let link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = CssPath;
document.head.appendChild(link)