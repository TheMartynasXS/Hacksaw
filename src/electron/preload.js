const { contextBridge, ipcRenderer } = require("electron");
const electron = require("electron");

console.log("preload.js loaded");
contextBridge.exposeInMainWorld("api", {
	// * Send to Main Process
	setRitoBin: () => {
		ipcRenderer.send("setRitoBin");
	},
	updateSettings: (data) => {
		ipcRenderer.send("updateSettings", data);
	},
	updateSamples: (data) => {
		ipcRenderer.send("updateSamples", data);
	},
	getSamples: (data) => {
		ipcRenderer.send("getSamples", data);
	},
	getSettings: (data) => {
		ipcRenderer.send("getSettings", data);
	},
	readDir: (dirPath) => {
		return new Promise((resolve, reject) => {
			ipcRenderer.send("readDir", dirPath);
			ipcRenderer.once("from-main", (_, data) => {
				resolve(data);
			});
		});
	},
	selectFolder: (filters = [], tagline = "Select Folder") => {
		ipcRenderer.send("selectFolder", filters, tagline);
	},
	selectFile: (filters = [], tagline = "Select File") => {
		ipcRenderer.send("selectFile", filters, tagline);
	},
	readFile: (path) => {
		ipcRenderer.send("readFile", path);
	},
	writeFile: (path, data) => {
		ipcRenderer.send("writeFile", path, data);
	},
	removeFile: (path) => {
		ipcRenderer.send("removeFile", path);
	},
	toBin: (path, recursive = false) => {
		ipcRenderer.send("toBin", path, recursive);
	},
	toJSON: (path, recursive = false) => {
		ipcRenderer.send("toJSON", path, recursive);
	},
	// * Response from Main Process
	receive: (func) => {
		ipcRenderer.once("from-main", (event, ...args) => {
			func(...args);
		});
	},
});
