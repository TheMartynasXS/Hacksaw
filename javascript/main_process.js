const { app, BrowserWindow, nativeTheme, ipcRenderer } = require('electron');
const path = require('path')
const { ipcMain } = require('electron')
const { dialog } = require('electron');

const fs = require('fs');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 720,
    minWidth: 720,
    height: 600,
    icon: 'build\hacksaw.ico',
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../html/hacksaw.html'));
  mainWindow.removeMenu()
  //mainWindow.webContents.openDevTools(/*{mode:'detach'}*/);
};


app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('FileSelect', (event, arg) => {
  if (arg == "Bin") {
    dialog.showOpenDialog({ filters: [{ name: 'bin', extensions: ['bin'] }], properties: ['openFile'] }).then(val => event.returnValue = val.filePaths[0], val => nsole.log("error"))
  } else if (arg == "Json") {
    dialog.showOpenDialog({ filters: [{ name: 'bin', extensions: ['json'] }], properties: ['openFile'] }).then(val => event.returnValue = val.filePaths[0], val => console.log("error"))
  } else if (arg == "Folder") {
    dialog.showOpenDialog({ properties: ['openDirectory'] }).then(val => event.returnValue = val.filePaths, val => console.log("error"))
  } else if (arg == "RitoBin") {
    dialog.showOpenDialog({ filters: [{ name: 'ritobin_cli', extensions: ['exe'] }], properties: ['openFile'] }).then(val => event.returnValue = val.filePaths[0], val => console.log("error"))
  }
})

ipcMain.on('UserPath', (event) => {
  event.returnValue = app.getPath('userData')
})

ipcMain.on('Version', (event) => {
  event.returnValue = app.getVersion()
})