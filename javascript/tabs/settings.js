const {Tab, Prefs, CreateAlert} = require('../javascript/shared.js');

if(Prefs.obj.RitoBinPath == ""){
    CreateAlert("You have not selected RitoBin_cli.exe yet.", false, {Title:"Select",function:SelectRitoBin});
    
}
function SelectRitoBin(){
    Prefs.RitoBinPath();
}

document.getElementById("Mode").value = Prefs.obj.UseAdvanced;
document.getElementById("IgnoreBW").checked = Prefs.obj.IgnoreBW;

document.getElementById("Mode").addEventListener("change",(Event)=>{Prefs.UseAdvanced(Event.target.value)});
document.getElementById("IgnoreBW").addEventListener("change",(Event)=>{Prefs.IgnoreBW(Event.target.checked)});
