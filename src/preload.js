const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    send: (message, data) => {
        ipcRenderer.send(message, data);
    },

    on: (message, listener) => {
        ipcRenderer.on(message, listener);
    },
});
