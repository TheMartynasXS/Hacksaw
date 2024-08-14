const { Prefs, Samples, Tab, getAllFiles, CreateMessage,extendPrototypes } = require('../javascript/utils.js');
const fs = require('fs')
const { ipcRenderer } = require('electron');
const { execSync } = require("child_process");
const KEYS = require('../javascript/keys.json');

window.onerror = function (msg, file, lineNo, columnNo) {
	ipcRenderer.send("Message", {
		type: "error",
		title: file + " @ line: " + lineNo + " col: " + columnNo,
		message: msg
	})
};

extendPrototypes()

let TargetPath
let DonorPath
let TargetFile
let DonorFile

let FileSaved = true;

let TargetList = document.getElementById("Target-Container")
let DonorList = document.getElementById("Donor-Container")

function Undo() {
	if (FileCache.length > 0) {
		TargetFile = JSON.parse(JSON.stringify(FileCache.pop()))
		RenderTarget();
	}
}

function OpenTargetBin() {
	let result = ipcRenderer.sendSync("OpenBin")

	TargetPath = result.Path

	if (TargetPath == undefined) {
		return 0;
	}
	
	TargetFile = result.File;

	document.getElementById("TargetPath").innerText = TargetPath.split(".wad.client\\").pop()
	RenderTarget();
}

function RenderTarget(i = -1) {
	let Select = document.getElementById("Target-Select")
	Select.innerText = ''
	let Options = []
	TargetList.innerText = "";
	let Container = TargetFile.entries.value.items;
	if (Container.find((item) => item.value.name.fnv("VfxSystemDefinitionData")) == undefined) {
		CreateMessage({
			type: "info",
			title: "No Particles",
			message: "File loaded but has no particles containers. Insert them from other bins.\nImporting containers from other champions/skins will require manual tweaking."
		})
	}
	for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
		if (Container[PO_ID].value.name.fnv("VfxSystemDefinitionData")) {
			ParticleName = Container[PO_ID].value.items.find((item) => {
				if (item.key.fnv("particleName")) {
					return item;
				}
			}).value ?? `unknown ${PO_ID}`;
			let Option = document.createElement("option");
			Option.value = Container[PO_ID].key;
			Option.innerText = ParticleName;
			Options.push(Option)
			
			

			let ParticleDiv = document.createElement("div");
			ParticleDiv.id = Container[PO_ID].key;
			ParticleDiv.className = "Particle-Div";

			let ParticleTitleDiv = document.createElement("div");
			ParticleTitleDiv.className = "Particle-Title-Div Input-Group Flex Hidden";
			ParticleDiv.appendChild(ParticleTitleDiv);

			let TargetCheckbox = document.createElement("input");
			TargetCheckbox.type = "radio";
			TargetCheckbox.className = "CheckBox";
			TargetCheckbox.name = "Target";
			ParticleTitleDiv.appendChild(TargetCheckbox);

			let ParticleTitle = document.createElement("div");
			ParticleTitle.className = "Label Ellipsis Flex-1";
			ParticleTitle.innerText = ParticleName;
			ParticleTitleDiv.appendChild(ParticleTitle);

			let ParticleScale = document.createElement("input");
			ParticleScale.type = "number";
			ParticleScale.className = "Input Reduced-Padding";
			ParticleScale.placeholder = "1.0";
			ParticleScale.value = Container[PO_ID].value.items.find((item) => {
				if (item.key == KEYS.Props.transform) {
					return item;
				}
			})?.value[0] ?? 1.0;
			ParticleScale.oninput = (e) => {
				let index = Container[PO_ID].value.items.findIndex((item) => {
					if (item.key == KEYS.Props.transform) {
						return item;
					}
				})
				if (index != -1) {
					Container[PO_ID].value.items[index].value[0] = parseFloat(e.target.value);
					Container[PO_ID].value.items[index].value[5] = parseFloat(e.target.value);
					Container[PO_ID].value.items[index].value[10] = parseFloat(e.target.value);
				} else {
					Container[PO_ID].value.items.push({
						key: KEYS.Props.transform,
						type: "mtx44",
						value: [parseFloat(e.target.value), 0, 0, 0, 0, parseFloat(e.target.value), 0, 0, 0, 0, parseFloat(e.target.value), 0, 0, 0, 0, 1]
					});
				}
			};
			ParticleTitleDiv.appendChild(ParticleScale);

			let DefData = Container[PO_ID].value.items.filter(
				(item) =>
					item.key.fnv("complexEmitterDefinitionData") ||
					item.key.fnv("simpleEmitterDefinitionData")
			);
			for (let B = 0; B < DefData.length; B++) {
				let DefDataDiv = document.createElement("div");
				DefDataDiv.className = "DefDataDiv";
				ParticleDiv.appendChild(DefDataDiv);

				if (
					DefData[B].key.fnv("complexEmitterDefinitionData") ||
					DefData[B].key.fnv("simpleEmitterDefinitionData")
					
				) {
					let Props = DefData[B].value.items;
					for (let C = 0; C < Props.length; C++) {
						let Emitter = document.createElement("div");
						Emitter.className = "Flex Input-Group";

						let Delete = document.createElement("button");
						Delete.innerHTML = "<img class=\"Icon\" src=\"../css/svg/Delete.svg\"></img>"
						Delete.onclick = () => {
							FileSaved = false
							FileCache.push(JSON.parse(JSON.stringify(TargetFile)))
							if (FileCache.length > 10) { FileCache.shift() }
							Props.splice(C, 1)

							RenderTarget()
						}
						Emitter.appendChild(Delete);

						let Title = document.createElement("div");
						Title.className = "Label Flex-1 Ellipsis";
						Title.innerText =
							Props[C].items[
								Props[C].items.findIndex(
									(item) => item.key.fnv("emitterName"))
							]?.value;
						Emitter.appendChild(Title);

						DefDataDiv.appendChild(Emitter)
					}
				}
			}
			TargetList.appendChild(ParticleDiv);
		}
		else if (Container[PO_ID].value.name == KEYS.Props.resourceResolver) {

		}
		else {
			let MaterialDiv = document.createElement("div");
			MaterialDiv.id = Container[PO_ID].key;
			MaterialDiv.className = "Material-Div";
			MaterialDiv.innerHTML = `<div class="Particle-Title-Div Input-Group Flex">
            <div class="Label Ellipsis Flex-1">${Container[PO_ID].value.name}</div>
            </div>`;

			TargetList.appendChild(MaterialDiv);
		}
	}
	Options.sort((a, b) => a.innerText.localeCompare(b.innerText))
	for(let i = 0; i < Options.length; i++){
		Select.appendChild(Options[i])
	}
	Select.onchange = (Event) => {
		document.querySelector(`[id="Target-Container"]>[id="${Event.target.value}"]`).scrollIntoView()
	}
	if (i == -1) {
		return 0;
	}
	else {
		TargetList.children[i].children[0].children[0].checked = true
	}
	
}
function OpenDonorBin() {
	DonorPath = ipcRenderer.sendSync("FileSelect", [
		"Select Bin to edit",
		"Bin",
	]);
	if (DonorPath == undefined) {
		return 0;
	}
	if (fs.existsSync(DonorPath.slice(0, -4) + ".json") == false) {
		ToJson(DonorPath);
	}
	DonorFile = JSON.parse(fs.readFileSync(DonorPath.slice(0, -4) + ".json", "utf-8"))

	document.getElementById("DonorPath").innerText = DonorPath.split(".wad.client\\").pop()
	RenderDonor();
}

function RenderDonor() {
	let Select = document.getElementById("Donor-Select")
	Select.innerText = ''
	let Options = []
	DonorList.innerText = "";
	let Container = DonorFile.entries.value.items;
	if (Container.find((item) => item.value.name.fnv("vfxsystemdefinitiondata")) == undefined) {
		CreateMessage({
			type: "info",
			title: "No Particles",
			message: "No Particles were found in the selected bin. Try another one."
		})
		return 0;
	}
	for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
		if (Container[PO_ID].value.name.fnv("vfxsystemdefinitiondata")) {
			ParticleName = Container[PO_ID].value.items.find((item) => {
				if (item.key == KEYS.Props.particleName) {
					return item;
				}
			}).value ?? `unknown ${PO_ID}`;
			let Option = document.createElement("option");
			Option.value = Container[PO_ID].key;
			Option.innerText = ParticleName;
			Options.push(Option)
			
			let ParticleDiv = document.createElement("div");
			ParticleDiv.id = Container[PO_ID].key;
			ParticleDiv.className = "Particle-Div";
			ParticleDiv.innerHTML = `<div class="Particle-Title-Div Input-Group Flex Hidden">
            
            </div>`;
			let Move = document.createElement("button");
			Move.innerHTML = "<strong><|</strong>"
			Move.onclick = () => {
				if (TargetFile == undefined) return 0
				FileSaved = false
				let TC = TargetFile.entries.value.items;
				let index = Container.findIndex((item) => item.key == Move.parentNode.parentNode.id)
				let Complex = Container[index].value.items.findIndex((item) => 
					item.key.fnv("complexemitterdefinitiondata") ||
          			item.key.fnv("simpleemitterdefinitiondata")
				)
				for (let i = 0; i < TargetList.childNodes.length; i++) {
					if (TargetList.children[i].children[0].children[0].checked) {

						let TCindex = TC.findIndex((item) => item.key == TargetList.children[i].id)
						let TCComplex = TC[TCindex].value.items.findIndex((item) => 
							item.key.fnv("complexemitterdefinitiondata") ||
							item.key.fnv("simpleemitterdefinitiondata"))

						TC[TCindex].value.items[TCComplex].value.items = [
							...TC[TCindex].value.items[TCComplex].value.items,
							...Container[index].value.items[Complex].value.items
						]
						RenderTarget(i)
						break
					}
				}
			}

			ParticleDiv.children[0].appendChild(Move)

			let ParticleLabel = document.createElement("div");
			ParticleLabel.className = "Label Ellipsis Flex-1";
			ParticleLabel.innerText = ParticleName;
			ParticleDiv.children[0].appendChild(ParticleLabel);
			let DefData = Container[PO_ID].value.items.filter(
				(item) =>
					item.key.fnv("complexemitterdefinitiondata") ||
          			item.key.fnv("simpleemitterdefinitiondata")
			);
			for (let B = 0; B < DefData.length; B++) {
				let DefDataDiv = document.createElement("div");
				DefDataDiv.className = "DefDataDiv";
				ParticleDiv.appendChild(DefDataDiv);

				if (
					DefData[B].key.fnv("complexemitterdefinitiondata") ||
					DefData[B].key.fnv("simpleemitterdefinitiondata")
				) {
					let Props = DefData[B].value.items;
					for (let C = 0; C < Props.length; C++) {
						let Emitter = document.createElement("div");
						Emitter.className = "Flex Input-Group";

						let Move = document.createElement("button");
						Move.innerHTML = "<Strong><-</Strong>"
						Move.onclick = () => {
							if (TargetFile == undefined) return 0
							FileSaved = false
							FileCache.push(JSON.parse(JSON.stringify(TargetFile)))
							if (FileCache.length > 10) { FileCache.shift() }
							let TC = TargetFile.entries.value.items;
							for (let i = 0; i < TargetList.childNodes.length; i++) {
								if (TargetList.children[i].children[0].children[0].checked) {
									let index = TC.findIndex((item) => item.key == TargetList.children[i].id)
									let Complex = TC[index].value.items.findIndex((item) => {
										return (item.key == 
											item.key.fnv("complexemitterdefinitiondata") ||
											item.key.fnv("simpleemitterdefinitiondata"))
									})
									TC[index].value.items[Complex]?.value.items.push(Props[C])
									RenderTarget(i)
									break
								}
							}
						}
						Emitter.appendChild(Move);

						let Title = document.createElement("div");
						Title.className = "Label Flex-1 Ellipsis";
						Title.innerText =
							Props[C].items[
								Props[C].items.findIndex(
									(item) => item.key.fnv("emitterName"))
							]?.value;
						Emitter.appendChild(Title);

						DefDataDiv.appendChild(Emitter)
					}
				}
			}
			DonorList.appendChild(ParticleDiv);
		}
		// else if (Container[PO_ID].value.name == KEYS.Props.resourceResolver) {

		// }
	}

	Options.sort((a, b) => a.innerText.localeCompare(b.innerText))
	for(let i = 0; i < Options.length; i++){
		Select.appendChild(Options[i])
	}
	Select.onchange = (Event) => {
		document.querySelector(`[id="Donor-Container"]>[id="${Event.target.value}"]`).scrollIntoView()
	}
}

function ToJson(FilePath) {
	execSync(`"${Prefs.obj.RitoBinPath}" -o json "${FilePath}" -k`);
}
function Save() {
	FileSaved = true;
	fs.writeFileSync(
		TargetPath.slice(0, -4) + ".json",
		JSON.stringify(TargetFile, null, 2),
		"utf8"
	);
	try {
		let res = execSync(
			`"${Prefs.obj.RitoBinPath}" -o bin "${TargetPath.slice(0, -4) + ".json"}"`
		);
		CreateMessage({
			type: "info",
			title: "File Saved Successfully",
			message: "Don't forget to delete the json files."
		})

	}
	catch (err) {
		CreateMessage({
			type: "error",
			title: "Error Converting to bin",
			message: err.stderr.toString()
		})
	}
}
function ClearSelection() {
	let TC = TargetFile.entries.value.items;
	for (let i = 0; i < TargetList.childNodes.length; i++) {
		if (TargetList.children[i].children[0].children[0].checked) {

			let TCindex = TC.findIndex((item) => item.key == TargetList.children[i].id)
			let TCComplex = TC[TCindex].value.items.findIndex((item) => 
				item.key.fnv("complexemitterdefinitiondata") ||
				item.key.fnv("simpleemitterdefinitiondata"))

			TC[TCindex].value.items[TCComplex].value.items = []
			RenderTarget(i)
			break
		}
	}
}

let Active = null
function RadioSelect(Target) {
	Active = UTIL.GetChildIndex(Target.parentNode.parentNode)
}

let temp = ipcRenderer.sendSync("PullBin");
TargetFile = temp.File;
TargetPath = temp.Path;
if (temp.Path != "") {
	RenderTarget();
}