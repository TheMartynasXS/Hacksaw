const {Tab, Prefs, CreateAlert} = require('../javascript/utils.js');

function SelectRitoBin(){
    Prefs.RitoBinPath();
}

document.getElementById("Mode").value = Prefs.obj.PreferredMode;
document.getElementById("IgnoreBW").checked = Prefs.obj.IgnoreBW;
document.getElementById("RememberTargets").checked = Prefs.obj.RememberTargets;

document.getElementById("Mode").addEventListener("change",(Event)=>{
    Prefs.SetMode(Event.target.value)
});
document.getElementById("IgnoreBW").addEventListener("change",(Event)=>{Prefs.IgnoreBW(Event.target.checked)});
document.getElementById("RememberTargets").addEventListener("change",(Event)=>{Prefs.RememberTargets(Event.target.checked)});
