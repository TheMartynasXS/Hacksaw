const ipcRenderer = require('electron').ipcRenderer;

function OpenBin(){
    // Open the bin splash screen
    ipcRenderer.invoke('open-bin').then((result) => {
        console.log(result)
    })
}