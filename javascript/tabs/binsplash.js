const ipcRenderer = require('electron').ipcRenderer;

function OpenBin(){
    // Open the bin splash screen
    ipcRenderer.invoke('open-bin').then((result) => {
        console.log(result)
    })
}

function MergeBin(){
    // Merge the bin file
    ipcRenderer.invoke('merge-bin').then((result) => {
        console.log(result)
    })
}