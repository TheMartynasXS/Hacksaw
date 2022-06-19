const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { ColorHandler, ToBG } = require('./colors.js');
const {clipboard} = require('electron');

function Tab(Location, FileSaved = true) {
	if (typeof FileSaved != "undefined") {
		if (FileSaved == true) {
			window.location.href = Location;
		} else {
			UTIL.CreateAlert(
				"You may have forgotten to save your bin.",
				"Save before proceeding please."
			);
		}
	} else {
		window.location.href = Location;
	}
}

const UserData = ipcRenderer.sendSync("UserPath")

const PrefsPath = path.join(UserData, "UserPrefs.json")
const SamplePath = path.join(UserData, "SampleDB.json")

class Preferences {
	constructor(PrefsPath) {
		this.obj = JSON.parse(fs.readFileSync(PrefsPath));
	}

	UseAdvanced(Mode = false) {
		this.obj.UseAdvanced = Mode;
		this.save();
	}

	IgnoreBW(Ignore = false) {
		this.obj.IgnoreBW = Ignore
		this.save();
	}

	RitoBinPath() {
		this.obj.RitoBinPath = ipcRenderer.sendSync('FileSelect', ['Select RitoBin_cli.exe', 'RitoBin'])
		this.save();
	}

	save() { fs.writeFileSync(PrefsPath, JSON.stringify(this.obj, null, 2)); }
}
const Prefs = new Preferences(PrefsPath);

class SampleDB {
	constructor(SamplePath) {
		this.obj = JSON.parse(fs.readFileSync(SamplePath));

		for (let i = 0; i < this.obj.length; i++) {
			const element = this.obj[i];
			for (let j = 0; j < element.Palette.length; j++) {
				element.Palette[j] = new ColorHandler(element.Palette[j].vec4, element.Palette[j].time)
			}
		}
	}

	reload(){
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
			console.log(temp)
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

	import(){
		let File = ipcRenderer.sendSync("FileSelect", [
			"Import Samples",
			"Json",
		])
		let Samples = JSON.parse(fs.readFileSync(File, "utf8"))
		if(Samples.length < 1){return 0}

		if(Samples[0].Palette != undefined){
			this.obj = this.obj.concat(Samples)
		}
		else{
			for(let i = 0; i < Samples.length; i++){
				let NewPalette = []
				for(let j = 0; j < Samples[i].value.length; j++){
					NewPalette.push({
						vec4: [
							Samples[i].value[j].color[0]/255,
						 	Samples[i].value[j].color[1]/255,
						  Samples[i].value[j].color[2]/255,
							Samples[i].value[j].opacity/100
						],
						time: Samples[i].value[j].time/100,

					})
				}
				this.obj.push(
					{
						Name:	Samples[i].name,
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
		Import.onclick = () => {this.import()}
		SampleFunctions.appendChild(Import)

		Modal.appendChild(SampleFunctions)
		let AlertContent = document.createElement("div")
		AlertContent.className = "AlertContent Flex-1 Text"
		Modal.appendChild(AlertContent)

		for (let ID = 0; ID < this.obj.length; ID++) {
			let SampleDom = document.createElement("div")
			SampleDom.className = "Input-Group Sample"
			SampleDom.style.background = ToBG(this.obj[ID].Palette)

			let SwapDiv = document.createElement('div')
			SwapDiv.className = "Flex"
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
			SwapDiv.appendChild(UpButton)
			SwapDiv.appendChild(DownButton)
			SampleDom.appendChild(SwapDiv)

			let UseThis = document.createElement('button')
			UseThis.onclick = () => {
				Palette = this.obj[ID].Palette;
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
			Title.className = "Flex-1"
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
		fs.writeFileSync(SamplePath, JSON.stringify(temp))
	}

}
const Samples = new SampleDB(SamplePath);

function Sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function CreateAlert(Body, Copy = false, Action = null) {
	let Alert = document.getElementById('AlertModalBG')

	if (Alert != undefined) { Alert.remove() }

	let AlertModalBG = document.createElement('div')
	AlertModalBG.className = "AlertModalBG"
	AlertModalBG.id = "AlertModalBG"

	let AlertModal = document.createElement('div')
	AlertModal.className = "AlertModal Flex-Col"

	let AlertContent = document.createElement('div')
	AlertContent.className = 'Flex-1 AlertContent'
	AlertContent.innerText = Body

	let AlertButtonGroup = document.createElement('div')
	AlertButtonGroup.className = "Input-Group Flex"

	if (Copy) {
		let CopyToClipboard = document.createElement('button')
		CopyToClipboard.className = "Flex-1"
		CopyToClipboard.innerText = "Copy To Clipboard"
		CopyToClipboard.onclick = () => {
			clipboard.writeText(Body)
		}
		AlertButtonGroup.appendChild(CopyToClipboard)
	}

	let CloseAlert = document.createElement('button')
	CloseAlert.className = "Flex-1"
	CloseAlert.innerText = "Close"
	CloseAlert.onclick = () => {
		AlertModalBG.remove()
	}

	AlertButtonGroup.appendChild(CloseAlert)

	if (Action != null) {
		let Custom = document.createElement('button')
		Custom.className = "Flex-1"
		Custom.innerText = Action.Title
		Custom.onclick = () => {
			Action.function()
			AlertModalBG.remove()
		}
		AlertButtonGroup.appendChild(Custom)
		
	}

	AlertModal.appendChild(AlertContent)
	AlertModal.appendChild(AlertButtonGroup)

	AlertModalBG.appendChild(AlertModal)
	document.body.appendChild(AlertModalBG)

}

module.exports = {
	Tab, Prefs, Samples, Sleep, CreateAlert
}