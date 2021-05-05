const { app, BrowserWindow } = require('electron')
const path = require('path')
const {ipcMain} = require('electron')
const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater');
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
  //win.setMenu(null)
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
ipcMain.on('version', event => {
  event.returnValue = app.getVersion()
})

function sendStatusToWindow(type, text) {
  ipcMain.on('updater', (event) =>{
    event.returnValue = text
  })
}

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});
app.on('ready', function()  {
  autoUpdater.checkForUpdates().then((value)=>{console.log(value)}).catch((error)=>{console.log(error)});
});
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('checking-for-update','Checking for update...')
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('update-available','Update not available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('update-unavailable','Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('error','Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow('download-progress',log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  autoUpdater.quitAndInstall();  
})