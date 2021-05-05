const { app, BrowserWindow } = require('electron')
const path = require('path')
const {ipcMain} = require('electron')
const { dialog } = require('electron')
function createWindow () {
  const win = new BrowserWindow({
    width: 500,
    height: 600,
    minHeight:600,
    minWidth:500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })
  win.setMenu(null)
  win.loadFile('binsplash.html');
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
ipcMain.on('fileselect', (event) => {
  dialog.showOpenDialog({ filters: [{ name: 'bin', extensions:['bin']}],properties: ['openFile']}).then( val => event.returnValue = val.filePaths, val => console.log("error"))
})
ipcMain.on('ritobinselect', (event) => {
  dialog.showOpenDialog({ filters: [{ name: 'ritobin_cli', extensions:['exe']}],properties: ['openFile'] }).then( val => event.returnValue = val.filePaths, val => console.log("error"))
})
ipcMain.on('ConfigPath', event => {
  
  event.returnValue = app.getPath('appData')
})
ipcMain.on('raiseError', (event, errorMessage, errorAt) => {
  let errorOptions = {
    type: 'warning',
    title: 'An Error has occured',
    buttons: ['Close'],
    defaultId: 0,
    message: errorAt
  };
  errorOptions.detail = errorMessage
  let result = dialog.showMessageBoxSync(null, errorOptions)
  if(result == 0){
    app.quit()
  }
})