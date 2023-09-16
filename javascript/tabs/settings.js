const { Tab, Prefs, CreateAlert } = require('../javascript/utils.js');

function SelectRitoBin() {
    Prefs.RitoBinPath();
}
function SelectFFMPEG() {
    Prefs.FFMPEGPath();
}

document.getElementById("Mode").value = Prefs.obj.PreferredMode;
document.getElementById("IgnoreBW").checked = Prefs.obj.IgnoreBW;
document.getElementById("Regenerate").checked = Prefs.obj.Regenerate;

document.getElementById("Mode").addEventListener("change", (Event) => {
    Prefs.SetMode(Event.target.value)
});
document.getElementById("IgnoreBW").addEventListener("change", (Event) => { Prefs.IgnoreBW(Event.target.checked) });
document.getElementById("Regenerate").addEventListener("change", (Event) => { Prefs.Regenerate(Event.target.checked) });
