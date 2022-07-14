const {Tab, Prefs, CreateAlert} = require('../javascript/utils.js');

if(Prefs.obj.RitoBinPath == ""){
    CreateAlert("You have not selected RitoBin_cli.exe yet.", false, {Title:"Select",function:SelectRitoBin});
    
}
function SelectRitoBin(){
    Prefs.RitoBinPath();
}

document.getElementById("Mode").value = String(Prefs.obj.UseAdvanced);
document.getElementById("IgnoreBW").checked = Prefs.obj.IgnoreBW;
document.getElementById("RememberTargets").checked = Prefs.obj.RememberTargets;

document.getElementById("Mode").addEventListener("change",(Event)=>{
    if(Event.target.value == 'true'){
        Prefs.UseAdvanced(true)
    }else{
        Prefs.UseAdvanced(false)
    }
});
document.getElementById("IgnoreBW").addEventListener("change",(Event)=>{Prefs.IgnoreBW(Event.target.checked)});
document.getElementById("RememberTargets").addEventListener("change",(Event)=>{Prefs.RememberTargets(Event.target.checked)});
