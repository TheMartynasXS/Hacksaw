const PrefsPath = `${ipcRenderer.sendSync('UserPath')}\\config.json`
let Prefs = fs.existsSync(PrefsPath) == true ? require(PrefsPath) : null

let Tabs = document.getElementsByClassName("Tab")
let NavButtons = document.getElementsByClassName("NavButton")

if (Prefs != null) {
    if (Prefs.Version != ipcRenderer.sendSync('Version')) {
        if (Prefs.ritoBinPath != null) {
            Prefs.RitoBinPath = Prefs.ritoBinPath
            delete Prefs["ritoBinPath"]
        }

        if (Prefs.linear != null) {
            Prefs.Advanced = Prefs.linear
            delete Prefs["linear"]
        }

        if (Prefs.ignoreBW != null) {
            Prefs.IgnoreBW = Prefs.ignoreBW
            delete Prefs["ignoreBW"]
        }

        if (Prefs.savedpalettes != null) {
            Prefs.ColorSamples = Prefs.savedpalettes
            delete Prefs["savedpalettes"]
            Prefs.ColorSamples.map(Sample => {
                Sample.value.map(Item => {
                    Item.color = UTIL.HEXtoRGB(Item.color)
                })
            })
        }

        Prefs.Version = ipcRenderer.sendSync('Version')
        UTIL.SavePrefs()
    }
    document.getElementById('IgnoreBW').checked = Prefs.IgnoreBW
    document.getElementById('Advanced').checked = Prefs.Advanced
}
else {
    Prefs = {}
    Prefs.Version = ipcRenderer.sendSync('Version')
    Prefs.IgnoreBW = true
    Prefs.Advanced = document.getElementById("Advanced").checked
    Prefs.ColorSamples = []
    //fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf8")
    UTIL.CreateAlert("You have to select Ritobin_cli.exe for the program to work")
    //Tab(document.getElementById("Nav2"))

}

function Tab(Target) {
    console.log(Target)
    if (JSON.stringify(Target.classList).match("Active") == null) {
        if (document.getElementById('Color-Picker') != undefined) { document.getElementById('Color-Picker').remove() }

        for (let i = 0; i < Tabs.length; i++) {
            if (Tabs[i].id == Target.innerText) {
                Tabs[i].classList.replace('Hidden', 'Flex')
            }
            else {
                Tabs[i].classList.replace('Flex', 'Hidden')
                NavButtons[i].classList.remove('Active')
            }
        }
        Target.classList.add(`Active`)
    }
}
function SideBarToggle() {
    let Menu = document.getElementById('Vertical-Menu')
    if (Menu.classList.contains('Vertical-Menu-Hidden') == true) {
        Menu.classList.remove('Vertical-Menu-Hidden')
    } else {
        Menu.classList.add('Vertical-Menu-Hidden')
    }
}
