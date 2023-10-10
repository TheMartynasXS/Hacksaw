const { app, BrowserWindow } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
const { child_process } = require("electron");
const fs = require("fs");

const PrefsPath = path.join(app.getPath("userData"), "UserPrefs.json");
const SamplesPath = path.join(app.getPath("userData"), "SampleDB.json");
const xRGBAPath = path.join(app.getPath("userData"), "xRGBADB.json");
let isDev = process.argv.includes("--dev");
let Prefs = fs.existsSync(PrefsPath)
	? JSON.parse(fs.readFileSync(PrefsPath))
	: {
			PreferredMode: "random",
			IgnoreBW: true,
			RitoBinPath: "",
			Targets: [true, true, true, true, true],
			Regenerate: false,
	  };
let Samples = fs.existsSync(SamplesPath)
	? JSON.parse(fs.readFileSync(SamplesPath))
	: [];
let xRGBA = fs.existsSync(xRGBAPath)
	? JSON.parse(fs.readFileSync(xRGBAPath))
	: [];

let mainWindow;
const createWindow = (htmlDir) => {
	mainWindow = new BrowserWindow({
		width: 800,
		minWidth: 800,
		minHeight: 500,
		height: 600,
		title: "Hacksaw " + app.getVersion(),
		backgroundColor: "#3a3b41",
		icon: "buildhacksaw.ico",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
		},
	});
	if (isDev) {
		mainWindow.loadURL("http://localhost:5173");
		mainWindow.webContents.openDevTools(/*{ mode: "detach" }*/);
	} else {
		mainWindow.loadFile(path.join(__dirname, htmlDir));
		mainWindow.removeMenu();
	}
};

app.whenReady().then(() => {
	createWindow("../build/index.html");
});

// * IPC Handlers
// #region ipc handlers
// * Set Ritobin Path
ipcMain.on("setRitoBin", (event) => {
	Prefs.RitoBinPath = dialog
		.showOpenDialogSync({
			title: "Select ritobin_cli.exe!",
			filters: [{ name: "ritobin_cli", extensions: ["exe"] }],
			properties: ["openFile"],
		})
		.pop();
	event.reply("from-main", Prefs.RitoBinPath);
});

// * Update settings in Main Process
ipcMain.on("updateSettings", (event, data) => {
	Prefs = data;
});
// * Update Samples in Main Process
ipcMain.on("updateSamples", (event, data) => {
	Samples = data;
});

// * Get Samples from Main Process
ipcMain.on("getSamples", (event) => {
	event.reply("from-main", Samples);
});

// * Get Settings from Main Process
ipcMain.on("getSettings", (event) => {
	event.reply("from-main", Prefs);
});

// * Read Directory
ipcMain.on("readDir", (event, dirPath) => {
	event.reply("from-main", TraverseDirectory(dirPath));
});

// * Select folder dialog
ipcMain.on("selectFolder", (event, filters, tagline) => {
	event.reply(
		"from-main",
		dialog
			.showOpenDialogSync({
				title: tagline,
				filters: filters,
				properties: ["openDirectory"],
			})
			.pop()
	);
});

// * Select file dialog
ipcMain.on("selectFile", (event, filters, tagline) => {
	event.reply(
		"from-main",
		dialog
			.showOpenDialogSync({
				title: tagline,
				filters: filters,
				properties: ["openFile"],
			})
			.pop()
	);
});

// * Read file
ipcMain.on("readFile", (event, filePath) => {
	event.reply("from-main", fs.readFileSync(filePath));
});

// * Write file
ipcMain.on("writeFile", (event, filePath, data) => {
	fs.writeFileSync(filePath, data);
});

// * Remove file
ipcMain.on("removeFile", (event, filePath) => {
	fs.unlinkSync(filePath);
});

// * Convert to bin
ipcMain.on("toBin", (event, filePath, recursive) => {
	let args = [
		filePath,
		"-o",
		path.join(
			path.dirname(filePath),
			path.basename(filePath, ".json") + ".bin"
		),
	];
	if (recursive) {
		args.push("-r");
	}
	let child = child_process.spawn(Prefs.RitoBinPath, args);
	child.on("exit", (code) => {
		event.reply("from-main", code);
	});
});

// * Convert to json
ipcMain.on("toJSON", (event, filePath, recursive) => {
	let args = [
		filePath,
		"-o",
		path.join(
			path.dirname(filePath),
			path.basename(filePath, ".bin") + ".json"
		),
	];
	if (recursive) {
		args.push("-r");
	}
	let child = child_process.spawn(Prefs.RitoBinPath, args);
	child.on("exit", (code) => {
		event.reply("from-main", code);
	});
});

// * Save settings to file on exit
app.on("window-all-closed", () => {
	fs.writeFileSync(PrefsPath, JSON.stringify(Prefs, null, 2), "utf-8");
	fs.writeFileSync(SamplesPath, JSON.stringify(Samples, null, 2), "utf-8");
	fs.writeFileSync(xRGBAPath, JSON.stringify(xRGBA, null, 2), "utf-8");
	app.quit();
});
// #endregion

function TraverseDirectory(dir, files_) {
	files_ = files_ || [];
	var files = fs.readdirSync(dir);
	for (var i in files) {
		let name = dir + "/" + files[i];
		if (fs.statSync(name).isDirectory()) {
			getAllFiles(name, files_);
		} else {
			files_.push(name.toLowerCase());
		}
	}
	return files_;
}
