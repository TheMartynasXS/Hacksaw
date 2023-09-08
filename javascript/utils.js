const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { ColorHandler, ToBG } = require('./colors.js');
const { clipboard } = require('electron');
const _ = require("lodash")

async function Tab(Location, FileSaved = true) {
	if (FileSaved == true) {
		window.location.href = Location;
	} else {
		CreateMessage({
			type: "warning",
			buttons: ["Continue", "Cancel"],
			title: "File not saved",
			message: "You may have forgotten to save your bin.\nSave before proceeding please."
		}, () => {
			window.location.href = Location;
		})
		return FileSaved;
	}
}

const UserData = ipcRenderer.sendSync("UserPath")

const PrefsPath = path.join(UserData, "UserPrefs.json")
const SamplePath = path.join(UserData, "SampleDB.json")

class Preferences {
	constructor(PrefsPath) {
		this.obj = ipcRenderer.sendSync("get-ssx")[0]
	}

	SetMode(Mode = 'linear') {
		this.obj.PreferredMode = Mode;
		this.save();
	}

	RememberTargets(Remember = false) {
		this.obj.RememberTargets = Remember;
		this.save()
	}
	Targets(T = undefined) {

		this.obj.Targets = T;
		this.save();
	}

	IgnoreBW(Ignore = false) {
		this.obj.IgnoreBW = Ignore
		this.save();
	}
	Regenerate(Regen = false) {
		this.obj.Regenerate = Regen
		this.save();
	}

	RitoBinPath() {
		this.obj.RitoBinPath = ipcRenderer.sendSync('FileSelect', ['Select RitoBin_cli.exe', 'RitoBin'])
		this.save();
	}

	save() {
		ipcRenderer.send("update-settings", JSON.stringify(this.obj, null, 2))
	}
}
const Prefs = new Preferences(PrefsPath);
class SampleDB {
	constructor(SamplePath) {
		this.obj = ipcRenderer.sendSync("get-ssx")[1]

		for (let i = 0; i < this.obj.length; i++) {
			const element = this.obj[i];
			for (let j = 0; j < element.Palette.length; j++) {
				element.Palette[j] = new ColorHandler(element.Palette[j].vec4, element.Palette[j].time)
			}
		}
	}

	reload() {
		this.obj = JSON.parse(fs.readFileSync(SamplePath));

		for (let i = 0; i < this.obj.length; i++) {
			const element = this.obj[i];
			for (let j = 0; j < element.Palette.length; j++) {
				element.Palette[j] = new ColorHandler(element.Palette[j].vec4, element.Palette[j].time)
			}
		}
	}

	export(ID = undefined) {
		let Folder = ipcRenderer.sendSync('FileSelect', ['Select sample export location', 'Folder'])
		if (ID != undefined) {
			let temp = JSON.parse(JSON.stringify(this.obj[ID]))
			for (let i = 0; i < temp.Palette.length; i++) {
				temp.Palette[i].obj = undefined
			}
			fs.writeFileSync(
				Folder + "\\" + temp.Name + ".json"
				, JSON.stringify([temp]), "utf8"
			)
		} else if (ID == undefined && this.obj.length > 0) {
			let temp = JSON.parse(JSON.stringify(this.obj))
			for (let i = 0; i < temp.length; i++) {
				for (let j = 0; j < temp[i].Palette.length; j++) {
					temp[i].Palette[j].obj = undefined
				}
			}
			fs.writeFileSync(
				Folder + "\\AllSamples.json"
				, JSON.stringify(temp), "utf8"
			)
		}
	}

	import() {
		let File = ipcRenderer.sendSync("FileSelect", [
			"Import Samples",
			"Json",
		])
		let Samples = JSON.parse(fs.readFileSync(File, "utf8"))
		if (Samples.length < 1) { return 0 }

		if (Samples[0].Palette != undefined) {
			this.obj = this.obj.concat(Samples)
		}
		else {
			for (let i = 0; i < Samples.length; i++) {
				let NewPalette = []
				for (let j = 0; j < Samples[i].value.length; j++) {
					NewPalette.push({
						vec4: [
							Samples[i].value[j].color[0] / 255,
							Samples[i].value[j].color[1] / 255,
							Samples[i].value[j].color[2] / 255,
							Samples[i].value[j].opacity / 100
						],
						time: Samples[i].value[j].time / 100,

					})
				}
				this.obj.push(
					{
						Name: Samples[i].name,
						Palette: NewPalette
					}
				)
			}

		}
		this.save()
		document.getElementById('AlertModalBG').remove()
		this.reload()
		this.show()
	}

	show() {
		if (document.getElementById('AlertModalBG') != undefined) return null
		let AlertModalBG = document.createElement('div')
		AlertModalBG.className = "AlertModalBG"
		AlertModalBG.id = "AlertModalBG"
		document.body.appendChild(AlertModalBG)

		let Modal = document.createElement("div")
		Modal.className = "Modal Flex-1 Margin Flex-Col"
		AlertModalBG.appendChild(Modal)

		let SampleFunctions = document.createElement("div")
		SampleFunctions.className = "Input-Group Margin-Bottom"

		let ExportAll = document.createElement("button")
		ExportAll.className = "Flex-1"
		ExportAll.textContent = "Export All"
		ExportAll.onclick = () => { this.export() }
		SampleFunctions.appendChild(ExportAll)

		let Import = document.createElement("button")
		Import.className = "Flex-1"
		Import.textContent = "Import"
		Import.onclick = () => { this.import() }
		SampleFunctions.appendChild(Import)

		Modal.appendChild(SampleFunctions)
		let AlertContent = document.createElement("div")
		AlertContent.className = "AlertContent Flex-1 Text"
		Modal.appendChild(AlertContent)

		for (let ID = 0; ID < this.obj.length; ID++) {
			let SampleDom = document.createElement("div")
			SampleDom.className = "Input-Group Sample"
			SampleDom.style.background = ToBG(this.obj[ID].Palette)

			let UpButton = document.createElement('button')
			UpButton.innerText = "▲"
			UpButton.onclick = (Event) => {
				if (ID > 0) {
					[this.obj[ID - 1], this.obj[ID]] = [this.obj[ID], this.obj[ID - 1]]
					this.save()
					AlertModalBG.remove()
					this.show()
				}
			}
			let DownButton = document.createElement('button')
			DownButton.innerText = "▼"
			DownButton.onclick = (Event) => {
				if (ID < this.obj.length - 1) {
					[this.obj[ID + 1], this.obj[ID]] = [this.obj[ID], this.obj[ID + 1]]
					this.save()
					AlertModalBG.remove()
					this.show()
				}
			}
			SampleDom.appendChild(UpButton)
			SampleDom.appendChild(DownButton)

			let UseThis = document.createElement('button')
			UseThis.onclick = () => {
				Palette = _.cloneDeep(this.obj[ID].Palette)
				AlertModalBG.remove()
				MapPalette()
				ChangeColorCount(this.obj[ID].length);
			}
			UseThis.innerText = "Sample"
			SampleDom.appendChild(UseThis)

			let Export = document.createElement('button')
			Export.onclick = () => {
				this.export(ID)
			}
			Export.innerText = "Export"
			SampleDom.appendChild(Export)

			let Delete = document.createElement('button')
			Delete.innerText = "Delete"
			Delete.onclick = (Event) => {
				this.obj.splice(ID, 1)
				Event.target.parentNode.remove()
				this.save()
			}
			SampleDom.appendChild(Delete)

			let Title = document.createElement('input')
			Title.value = this.obj[ID].Name
			Title.className = "Flex-1 Label"
			Title.onchange = (Event) => {
				this.obj[ID].Name = Event.target.value
				this.save()
			}
			SampleDom.appendChild(Title)

			AlertContent.appendChild(SampleDom)
		}

		let DismissDiv = document.createElement("div")
		DismissDiv.className = "Input-Group Margin-Top"

		let Dismiss = document.createElement("button")
		Dismiss.className = "Flex-1"
		Dismiss.textContent = "CANCEL"
		Dismiss.onclick = () => { AlertModalBG.remove() }

		DismissDiv.appendChild(Dismiss)
		Modal.appendChild(DismissDiv)
	}

	name(ID) {
		if (document.getElementById('AlertModalBG') != undefined) return null
		let tempName = this.obj[ID].Name
		let AlertModalBG = document.createElement('div')
		AlertModalBG.className = "AlertModalBG"
		AlertModalBG.id = "AlertModalBG"

		let AlertModal = document.createElement('div')
		AlertModal.className = "InputModal Flex-Col"

		let InputGroup = document.createElement('div')
		InputGroup.className = "Input-Group"

		let Input = document.createElement('input')
		Input.className = "Flex-1"
		Input.value = this.obj[ID].Name
		Input.oninput = (Event) => {
			tempName = Event.target.value
		}

		let Submit = document.createElement('button')
		Submit.innerText = "Submit"
		Submit.onclick = (Event) => {
			this.obj[ID].Name = tempName
			this.save()
			document.body.removeChild(AlertModalBG)
		}

		InputGroup.appendChild(Input)
		InputGroup.appendChild(Submit)
		AlertModal.appendChild(InputGroup)

		AlertModalBG.appendChild(AlertModal)
		document.body.appendChild(AlertModalBG)
	}

	add(Palette) {

		this.obj.push(
			{
				Name: `untitled ${this.obj.length + 1}`,
				Palette: Palette
			}
		)
		this.save()
		this.name(this.obj.length - 1)
	}

	save() {
		let temp = JSON.parse(JSON.stringify(this.obj))
		for (let i = 0; i < temp.length; i++) {
			for (let j = 0; j < temp[i].Palette.length; j++) {
				temp[i].Palette[j].obj = undefined
			}
		}
		ipcRenderer.send("update-samples", JSON.stringify(temp, null, 2))
	}

}
const Samples = new SampleDB(SamplePath);

function Sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function CreateMessage(
	options = {
		type: "error", title: "", message: "", defaultId: 0, cancelId: 0,
		detail: "", checkboxLabel: "", checkboxChecked: false
	}, action = undefined) {
	let data = ipcRenderer.sendSync("Message", options)
	if (data?.response == 0 && action != undefined) {
		action()
	}
}

function getAllFiles(dir, files_) {
	files_ = files_ || [];
	var files = fs.readdirSync(dir);
	for (var i in files) {
		let name = dir + '/' + files[i];
		if (fs.statSync(name).isDirectory()) {
			getAllFiles(name, files_);
		} else {
			files_.push(name.toLowerCase());
		}
	}
	return files_;
}

module.exports = {
	Tab, Prefs, Samples, Sleep, CreateMessage, getAllFiles
}