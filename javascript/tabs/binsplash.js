const { Tab } = require('../javascript/utils.js');
const { Prefs, Samples, CreateAlert, Sleep } = require('../javascript/utils.js');

const { execSync } = require("child_process");
const { getColorHexRGB } = require("electron-color-picker");
const { ipcRenderer } = require('electron');
const fs = require('fs')
const _ = require("lodash")

const { ColorHandler, GetColor, ToBG } = require('../javascript/colors.js');

let FileCache = [];
let FileHistory = [];
let FileSaved = true;

let RecolorMode = document.getElementById("Mode");
let RecolorTarget = document.getElementById("Target");

let T1 = document.getElementById('T1')
let T2 = document.getElementById('T2')
let T3 = document.getElementById('T3')
let T4 = document.getElementById('T4')
let T5 = document.getElementById('T5')

if (Prefs.obj.RememberTargets == true) {
	T1.checked = Prefs.obj.Targets[0];
	T2.checked = Prefs.obj.Targets[1];
	T3.checked = Prefs.obj.Targets[2];
	T4.checked = Prefs.obj.Targets[3];
	T5.checked = Prefs.obj.Targets[4];
	T1.addEventListener("change", (Event) => {
		Prefs.Targets([Event.target.checked, T2.checked, T3.checked, T4.checked, T5.checked])
	});
	T2.addEventListener("change", (Event) => {
		Prefs.Targets([T1.checked, Event.target.checked, T3.checked, T4.checked, T5.checked])
	});
	T3.addEventListener("change", (Event) => {
		Prefs.Targets([T1.checked, T2.checked, Event.target.checked, T4.checked, T5.checked])
	});
	T4.addEventListener("change", (Event) => {
		Prefs.Targets([T1.checked, T2.checked, T3.checked, Event.target.checked, T5.checked])
	});
	T5.addEventListener("change", (Event) => {
		Prefs.Targets([T1.checked, T2.checked, T3.checked, T4.checked, Event.target.checked])
	});
}

let BlankDynamic = `{"key":"dynamics","type":"pointer","value":{"items":[{"key":"times","type":"list","value":{"items":[],"valueType":"f32"}},{"key":"values","type":"list","value":{"items":[],"valueType":"vec4"}}],"name":"VfxAnimatedColorVariableData"}}`;
let BlankConstant = `{"key":"constantValue","type":"vec4","value":[0.5,0.5,0.5,1]}`;

let Palette = [new ColorHandler];

let ColorContainer = document.getElementById("Color-Container");
let GradientIndicator = document.getElementById("Gradient-Indicator");
let OpacityContainer = document.getElementById("Opacity-Container");
let ParticleList = document.getElementById("Particle-List");
let SampleContainer = document.getElementById("SampleContainer");


window.onerror = function (msg, error, lineNo, columnNo) {
	CreateAlert(
		`Message: ${msg}\n\nError: ${error},\n\nRaised at: ${lineNo} : ${columnNo}`,
		true
	);
};


const PickScreen = async () => {
	const color = await getColorHexRGB().catch((error) => {
		console.warn("[ERROR] getColor", error);
		return "";
	});
	let ColorInput = document.getElementById("Hex");
	ColorInput.value = color;
	let SubmitEvent = new Event("input");
	ColorInput.dispatchEvent(SubmitEvent);
};

function CreatePicker(Target, PaletteIndex) {
	if (document.getElementById("Color-Picker") == undefined) {
		let temp = Target.style.backgroundColor.match(/\d+/g);

		let ColorPicker = document.createElement("div");
		ColorPicker.className = "Flex-Col Outline";
		ColorPicker.id = "Color-Picker";
		ColorPicker.position = "absolute";
		ColorPicker.style.top = "10em";

		let ColorPickerInputs = document.createElement("div");
		ColorPickerInputs.className = "Input-Group";

		let EyeDropper = document.createElement("button");
		EyeDropper.innerText = "EyeDropper";
		EyeDropper.onclick = () => PickScreen();
		ColorPickerInputs.appendChild(EyeDropper);

		let ColorInput = document.createElement("input");
		ColorInput.id = "RGB";
		ColorInput.type = "color";

		ColorInput.value = new ColorHandler([temp[0] / 255, temp[1] / 255, temp[2] / 255, 1]).ToHEX();
		ColorInput.oninput = (E) => {
			Hex.value = E.target.value;
			Target.style.backgroundColor = E.target.value;
			Palette[PaletteIndex].InputHex(E.target.value)
			MapPalette();
		};
		ColorPickerInputs.appendChild(ColorInput);

		let Label = document.createElement("div");
		Label.innerText = "Hex:";
		Label.className = "Label";
		ColorPickerInputs.appendChild(Label);

		let Hex = document.createElement("input");
		Hex.id = "Hex";
		Hex.className = 'Flex-1'
		Hex.value = new ColorHandler([temp[0] / 255, temp[1] / 255, temp[2] / 255, 1]).ToHEX();
		Hex.maxLength = 7;
		Hex.oninput = (Event) => {
			if (!Event.target.value.startsWith("#")) {
				Event.target.value = "#" + Event.target.value;
			}
			ColorInput.value = Event.target.value;
			Palette[PaletteIndex].InputHex(Event.target.value)
			MapPalette();
		};
		ColorPickerInputs.appendChild(Hex);

		let Label2 = document.createElement("div");
		Label2.innerText = "Alpha:";
		Label2.className = "Label";
		ColorPickerInputs.appendChild(Label2);

		let Alpha = document.createElement("input");
		Alpha.id = "Alpha";
		Alpha.className = 'Flex-1'
		Alpha.value = Palette[PaletteIndex].vec4[3]
		Alpha.maxLength = 7;

		Alpha.oninput = (E) => {
			Palette[PaletteIndex].InputHex(E.target.value)
			MapPalette();
		};

		ColorPickerInputs.appendChild(Alpha);
		console.dir(Palette)
		let Exit = document.createElement('button')
		Exit.innerText = 'X'
		Exit.onclick = () => {
			document.getElementById("Color-Picker").remove();
		}
		ColorPickerInputs.appendChild(Exit);

		ColorPicker.appendChild(ColorPickerInputs);

		document.getElementById("Slider-Container").appendChild(ColorPicker);
	} else {
		document.getElementById("Color-Picker").remove();
		CreatePicker(Target, PaletteIndex);
	}
}
function ReverseSample() {
	let timeArray = [];
	for (let i = 0; i < Palette.length; i++) {
		timeArray.push(Palette[i].time);
	}
	Palette.reverse();
	for (let i = 0; i < timeArray.length; i++) {
		Palette[i].SetTime(timeArray[i]);
	}
	MapPalette();
}

function MapPalette() {
	ColorContainer.innerText = null;

	let indicatorColor = [];

	Palette.map((PaletteItem, PaletteIndex) => {
		let ColorDiv = document.createElement("div");
		ColorDiv.className = "Color Flex-1";
		ColorDiv.style.backgroundColor = PaletteItem.ToHEX();
		ColorDiv.onclick = (Event) => {
			CreatePicker(Event.target, PaletteIndex);
		}
		ColorContainer.appendChild(ColorDiv);

		indicatorColor.push(
			`${PaletteItem.ToHEX()} ${Math.round(PaletteItem.time * 100)}%`
		);

		if (Palette.length > 1) {
			GradientIndicator.style.background = `linear-gradient(0.25turn,${indicatorColor.join(
				","
			)})`;
		} else {
			GradientIndicator.style.background = PaletteItem.ToHEX();
		}
	})
}
MapPalette()

function ChangeColorCount(Count) {
	let TempLenght = parseInt(Palette.length);
	if (TempLenght < Count) {
		for (let ID = 0; ID < Count - TempLenght; ID++) {
			Palette.push(new ColorHandler);
		}
	} else if (TempLenght > Count) {
		for (let ID = 0; ID < TempLenght - Count; ID++) {
			Palette.pop();
		}
	}
	Palette.map((PaletteItem, index) => {
		PaletteItem.time = (1 / (Palette.length - 1) * index);
	});
	MapPalette();
	document.getElementById("Slider-Input").value = Palette.length;
}

async function OpenBin() {
	document.getElementById('CheckToggle').checked = false
	if (FileSaved != true) {
		CreateAlert(
			"You may have forgotten to save your bin.\nSave before proceeding please.",
			false, { function: async () => { FileSaved = true; await OpenBin() }, Title: 'Leave Anyways' });
		FileSaved = true;
		return 0;
	}
	FilePath = ipcRenderer.sendSync("FileSelect", [
		"Select Bin to edit",
		"Bin",
	]);

	if (FilePath == undefined) {
		return 0;
	}
	document.getElementById("Title").innerText = FilePath.split("\\").pop();
	if (fs.existsSync(FilePath.slice(0, -4) + ".json") == false) {
		await ToJson();
	}

	File = JSON.parse(fs.readFileSync(FilePath.slice(0, -4) + ".json", "utf-8"))

	LoadFile();
	FileCache = [];
	if (!FileHistory.includes(FilePath.slice(0, -4) + ".json")) {
		FileHistory.push(FilePath.slice(0, -4) + ".json");
	}
}

function LoadFile(SkipAlert = true) {
	ParticleList.innerText = "";

	let Relative = ""
	for (let i = 0; i < File.linked.value.items.length; i++) {
		Relative += `<p>${File.linked.value.items[i]}</p>`
	}


	let Container = File.entries.value.items;
	if (/ValueColor/.test(JSON.stringify(Container)) == false) {
		CreateAlert("No color values found", false);
		return 0;

	}
	for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
		if (Container[PO_ID].value.name.toLowerCase() == "vfxsystemdefinitiondata") {
			ParticleName = Container[PO_ID].value.items.find((item) => {
				if (item.key.toLowerCase() == "particlename") {
					return item;
				}
			}).value ?? `unknown ${PO_ID}`;

			let ParticleDiv = document.createElement("div");
			ParticleDiv.id = Container[PO_ID].key;
			ParticleDiv.className = "Particle-Div";
			ParticleDiv.innerHTML = `<div class="Particle-Title-Div Flex">
            <input type="checkbox" class="CheckBox" onclick="CheckChildren(this.parentNode.parentNode.children[1],this.checked)"/>
            <div class="Label Ellipsis Flex-1">${ParticleName}</div>
            </div>`;
			let DefData = Container[PO_ID].value.items.filter(
				(item) =>
					/complexemitterdefinitiondata/i.test(item.key) ||
					/simpleemitterdefinitiondata/i.test(item.key)
			);
			for (let B = 0; B < DefData.length; B++) {
				let DefDataDiv = document.createElement("div");
				DefDataDiv.className = "DefDataDiv";
				ParticleDiv.appendChild(DefDataDiv);

				if (
					/complexemitterdefinitiondata/i.test(DefData[B].key) ||
					/simpleemitterdefinitiondata/i.test(DefData[B].key)
				) {
					let Props = DefData[B].value.items;
					for (let C = 0; C < Props.length; C++) {
						let PropItems = Props[C].items


						let RDID = PropItems?.findIndex(item => /reflectiondefinition/i.test(item.key))
						let RDProp = PropItems[RDID]?.value.items

						let OFCID = RDProp?.findIndex(item => /fresnelcolor/i.test(item.key))           // Outline Fresnel Color
						let RFCID = RDProp?.findIndex(item => /reflectionfresnelcolor/i.test(item.key)) // Reflective Fresnel Color

						// let LCID = PropItems?.findIndex(item => /lingercolor/i.test(item.key))			// Linger Color
						let LCID = PropItems?.findIndex(item => /lingercolor/i.test(item.key))			// Linger Color
						let BCID = PropItems?.findIndex(item => /birthcolor/i.test(item.key))			// Birth Color
						let MCID = PropItems?.findIndex(item => /color/i.test(item.key))				// Main Color
						let BMID = PropItems?.findIndex(item => /blendmode/i.test(item.key))			// Blend Mode

						let OFBG, RFBG, LCBG, BCBG, MCBG

						let Emitter = document.createElement("div");

						Emitter.className = "Flex Emitter-Div";
						let Input = document.createElement("input");
						Input.type = "checkbox";
						Input.className = `CheckBox`;

						Emitter.appendChild(Input);
						let Title = document.createElement("div");
						Title.className = "Label Flex-1 Ellipsis";
						Title.innerText =
							Props[C].items[
								Props[C].items.findIndex(
									(item) => /emittername/i.test(item.key)
								)
							]?.value;
						Emitter.appendChild(Title);


						let OutlineDiv = document.createElement("div")
						if (OFCID >= 0) {
							const OFColor = () => { return GetColor(RDProp[OFCID]) }
							OFBG = ToBG(OFColor())

							OutlineDiv.onclick = () => {
								Palette = OFColor()
								MapPalette();
								document.getElementById("Slider-Input").value = Palette.length;
							};
						}
						OutlineDiv.className = `Prop-Block-Secondary Pointer ${OFBG ? "" : "Blank-Obj"}`
						OutlineDiv.style = `background: ${OFBG ? OFBG : ""}`
						Emitter.appendChild(OutlineDiv);

						let ReflectiveDiv = document.createElement("div")
						if (RFCID >= 0) {
							const RFColor = () => { return GetColor(RDProp[RFCID]) }
							RFBG = ToBG(RFColor())

							ReflectiveDiv.onclick = () => {
								Palette = RFColor()
								MapPalette();
								document.getElementById("Slider-Input").value = Palette.length;
							};
						}
						ReflectiveDiv.className = `Prop-Block-Secondary Pointer ${RFBG ? "" : "Blank-Obj"}`
						ReflectiveDiv.style = `background: ${RFBG ? RFBG : ""}`
						Emitter.appendChild(ReflectiveDiv);

						let LingerDiv = document.createElement("div")
						if (LCID >= 0) {
							let PropType = PropItems[LCID].value.items
							let DynID = PropType.findIndex(item => /dynamics/i.test(item.key))
							if (DynID >= 0) {
								let ProbTableID = PropType[DynID].value.items.findIndex(item => /probabilitytables/i.test(item.key))
								if (ProbTableID >= 0) PropType[DynID].value.items.shift()
							}

							const LCColor = () => { return GetColor(PropItems[LCID].value.items) }
							LCBG = ToBG(LCColor())

							LingerDiv.onclick = () => {
								Palette = LCColor()
								MapPalette();
								document.getElementById("Slider-Input").value = Palette.length;
							};
						}
						LingerDiv.className = `Prop-Block-Secondary Pointer ${LCBG ? "" : "Blank-Obj"}`
						LingerDiv.style = `background: ${LCBG ? LCBG : ""}`
						Emitter.appendChild(LingerDiv);

						let BirthDiv = document.createElement("div")
						if (BCID >= 0) {
							let PropType = PropItems[BCID].value.items
							let DynID = PropType.findIndex(item => /dynamics/i.test(item.key))
							if (DynID >= 0) {
								let ProbTableID = PropType[DynID].value.items.findIndex(item => /probabilitytables/i.test(item.key))
								if (ProbTableID >= 0) PropType[DynID].value.items.shift()
							}
							const BCColor = () => { return GetColor(PropItems[BCID].value.items) }
							BCBG = ToBG(BCColor())

							BirthDiv.onclick = () => {
								Palette = BCColor()
								MapPalette();
								document.getElementById("Slider-Input").value = Palette.length;
							};
						}
						BirthDiv.className = `Prop-Block-Secondary Pointer ${BCBG ? "" : "Blank-Obj"}`
						BirthDiv.style = `background: ${BCBG ? BCBG : ""}`
						Emitter.appendChild(BirthDiv);

						let MainColorDiv = document.createElement("div")
						if (MCID >= 0) {
							let PropType = PropItems[MCID].value.items
							let DynID = PropType?.findIndex(item => /dynamics/i.test(item.key))
							if (DynID >= 0) {
								let ProbTableID = PropType[DynID].value.items.findIndex(item => /probabilitytables/i.test(item.key))
								if (ProbTableID >= 0) PropType[DynID].value.items.shift()
							}
							const MCColor = () => { return GetColor(PropItems[MCID].value.items) }
							MCBG = ToBG(MCColor())

							MainColorDiv.onclick = () => {
								Palette = MCColor()
								MapPalette();
								document.getElementById("Slider-Input").value = Palette.length;
							};
						}
						MainColorDiv.className = `Prop-Block Pointer ${MCBG ? "" : "Blank-Obj"}`
						MainColorDiv.style = `background: ${MCBG ? MCBG : ""}`
						Emitter.appendChild(MainColorDiv);


						let BlendMode =
							BMID >= 0
								? document.createElement("input")
								: document.createElement("div");
						BlendMode.className = `Blend-Mode`;

						if (BMID >= 0) {
							BlendMode.type = "number";
							BlendMode.min = 0;
							BlendMode.max = 9;
							BlendMode.placeholder = PropItems[BMID].value;
							BlendMode.onchange = (Event) => {
								if (Event.target.value != "") {
									PropItems[BMID].value = parseInt(
										Event.target.value
									);
									Event.target.placeholder = parseInt(
										Event.target.value
									);
								}
							};
						} else {
							BlendMode.style = `visibility: hidden`;
						}
						Emitter.appendChild(BlendMode);

						DefDataDiv.appendChild(Emitter)
					}
				}
			}
			ParticleList.appendChild(ParticleDiv);
		}
	}
	// if (ParticleList.innerText = "") {
	// 	CreateAlert("No color values found", false);
	// 	return 0;
	// }
	if (!SkipAlert) {
		CreateAlert(
			`
				File Loaded Successfully<br>
				<strong>.bin files that are related to this bin</strong>
				refer to <mark>OBSIDIAN_PACKED_MAPPING.txt</mark> for bins with long names.\n 
				${Relative
			}
			`
		)
	}
}

function ColorHelp() {
	CreateAlert(
		`
		OC - Outline Fresnel Color, changes outline color<br>
		RC - Reflection Fresnel Color, changes reflective color<br>
		LC - Linger Color, changes color when the particle is dying<br>
		BC - Birth Color, changes color at the start<br>
		Main Color - Main particle color
		`
	)
}

function FilterParticles(FilterString) {
	let ParticleListChildren = ParticleList.children;

	let search
	try {
		search = new RegExp(FilterString, "i");
	} catch (error) { }

	if (search != undefined) {
		for (let I = 0; I < ParticleListChildren.length; I++) {
			let match = ParticleListChildren[I].children[0].children[1].textContent.match(
				search
			);

			if (match == null) {
				ParticleListChildren[I].style.display = "none";
				ParticleListChildren[I].children[0].children[0].checked = false;
				for (
					let J = 0;
					J < ParticleListChildren[I].children[1]?.children.length;
					J++
				) {
					ParticleListChildren[I].children[1].children[
						J
					].children[0].checked = false;
				}
			} else {
				ParticleListChildren[I].style.display = null;
			}
		}
	}
}

function CheckToggle(checkbox) {
	let ParticleListChildren = ParticleList.children;
	for (let I = 0; I < ParticleListChildren.length; I++) {
		if (ParticleListChildren[I].style.display != "none") {
			ParticleListChildren[I].children[0].children[0].checked = checkbox.checked;
			CheckChildren(
				ParticleListChildren[I].children[1],
				ParticleListChildren[I].children[0].children[0].checked
			);
		}
	}
}

function CheckChildren(Particle, State) {
	if (Particle == undefined) {
		return 0;
	}
	for (let J = 0; J < Particle.children.length; J++) {
		if (
			Particle.children[J].style.visibility != "hidden" &&
			Particle.children[J].children[0].disabled != true
		) {
			Particle.children[J].children[0].checked = State;
		}
	}
}

function IsBW(A, B, C) { return A == B && B == C ? A == 0 || A == 1 : false }

function RecolorProp(ColorProp, ConstOnly = false) {
	if (ConstOnly) {
		let NewColor = RecolorMode.value == "random" ?
			Palette[Math.round(Math.random() * (Palette.length - 1))].vec4 :
			Palette[0].vec4

		if (!(Prefs.obj.IgnoreBW && IsBW(
			ColorProp.value[0],
			ColorProp.value[1],
			ColorProp.value[2]
		))) {
			ColorProp.value[0] = NewColor[0]
			ColorProp.value[1] = NewColor[1]
			ColorProp.value[2] = NewColor[2]
		}
		return ColorProp
	}
	let PropType = ColorProp.value.items
	let ConstID = PropType.findIndex(item => /constantValue/i.test(item.key))
	let DynID = PropType.findIndex(item => /dynamics/i.test(item.key))
	switch (RecolorMode.value) {
		case "random":
			if (DynID >= 0) {
				let DynValue = PropType[DynID].value.items
				let DynColors = DynValue[1].value.items

				for (let i = 0; i < DynColors.length; i++) {
					if (!(Prefs.obj.IgnoreBW && IsBW(
						DynColors[i][0],
						DynColors[i][1],
						DynColors[i][2]
					))) {
						let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].vec4
						DynColors[i][0] = NewColor[0]
						DynColors[i][1] = NewColor[1]
						DynColors[i][2] = NewColor[2]
					}
				}

			} else {
				let NewColor = Palette[Math.round(Math.random() * (Palette.length - 1))].vec4

				if (!(Prefs.obj.IgnoreBW &&
					IsBW(
						PropType[ConstID].value[0],
						PropType[ConstID].value[1],
						PropType[ConstID].value[2]
					))) {
					PropType[ConstID].value[0] = NewColor[0]
					PropType[ConstID].value[1] = NewColor[1]
					PropType[ConstID].value[2] = NewColor[2]
				}
			}
			break;
		case "linear":
			if (Palette.length > 1 && DynID < 0) {
				PropType[ConstID] = JSON.parse(BlankDynamic)
			}
			else if (Palette.length == 1 && ConstID < 0) {
				PropType[DynID] = JSON.parse(BlankConstant)
			}

			ConstID = PropType.findIndex(item => /constantValue/i.test(item.key))
			DynID = PropType.findIndex(item => /dynamics/i.test(item.key))

			if (DynID >= 0) {
				let DynValue = PropType[DynID].value.items
				let DynTimes = DynValue[0].value.items
				let DynColors = DynValue[1].value.items

				for (let i = 0; i < DynTimes.length; i++) {
					let NewColor = i > Palette.length - 1 ? Palette[Palette.length - 1].vec4 : Palette[i].vec4
					DynColors[i][0] = NewColor[0]
					DynColors[i][1] = NewColor[1]
					DynColors[i][2] = NewColor[2]
				}
			} else {
				let NewColor = Palette[0].vec4

				if (!(Prefs.IgnoreBW &&
					IsBW(
						PropType[ConstID].value[0],
						PropType[ConstID].value[1],
						PropType[ConstID].value[2]
					))) {
					PropType[ConstID].value[0] = NewColor[0]
					PropType[ConstID].value[1] = NewColor[1]
					PropType[ConstID].value[2] = NewColor[2]
					PropType[ConstID].value[3] = NewColor[3]

					ColorProp.value.items = PropType
				}
			}
			break
		case "wrap":
			if (Palette.length > 1 && DynID < 0) {
				PropType[ConstID] = JSON.parse(BlankDynamic)
			}
			else if (Palette.length == 1 && ConstID < 0) {
				PropType[DynID] = JSON.parse(BlankConstant)
			}

			ConstID = PropType.findIndex(item => /constantValue/i.test(item.key))
			DynID = PropType.findIndex(item => /dynamics/i.test(item.key))

			if (DynID >= 0) {
				let DynValue = PropType[DynID].value.items
				let DynTimes = DynValue[0].value.items
				let TempCount = DynTimes.length
				let DynColors = DynValue[1].value.items

				for (let i = 0; i < DynTimes.length; i++) {
					let NewColor = Palette[i % Palette.length].vec4
					DynColors[i][0] = NewColor[0]
					DynColors[i][1] = NewColor[1]
					DynColors[i][2] = NewColor[2]
				}
			} else {
				let NewColor = Palette[0].vec4

				if (!(Prefs.IgnoreBW &&
					IsBW(
						PropType[ConstID].value[0],
						PropType[ConstID].value[1],
						PropType[ConstID].value[2]
					))) {
					PropType[ConstID].value[0] = NewColor[0]
					PropType[ConstID].value[1] = NewColor[1]
					PropType[ConstID].value[2] = NewColor[2]
					PropType[ConstID].value[3] = NewColor[3]

					ColorProp.value.items = PropType
				}
			}
			break
	}
	return ColorProp
}

function RecolorSelected() {
	FileSaved = false;
	FileCache.push(JSON.parse(JSON.stringify(File)));
	let Container = File.entries.value.items;

	for (let PO_ID = 0; PO_ID < ParticleList.children.length; PO_ID++) {
		let Adjusted_ID = Container.findIndex(
			(item) => item.key == ParticleList.childNodes[PO_ID].id
		);
		let DefData = Container[Adjusted_ID].value.items;

		let DomDefData = ParticleList.children[PO_ID].children;
		for (let B = 1; B < ParticleList.children[PO_ID].children.length; B++) {
			for (let C = 0; C < DomDefData[B].children.length; C++) {
				let DomEmitter = DomDefData[B].children[C].children;
				let Offset = DefData.findIndex(item => /complexemitterdefinitiondata/i.test(item.key) ||
					/simpleemitterdefinitiondata/i.test(item.key))
				if (DomEmitter[0].checked) {
					let PropItems = DefData[B - 1 + Offset].value.items[C].items;
					let RDID = PropItems?.findIndex(item => /reflectionDefinition/i.test(item.key))
					let RDProp = PropItems[RDID]?.value.items

					let OFCID = RDProp?.findIndex(item => /fresnelColor/i.test(item.key))           // Outline Fresnel Color
					let RFCID = RDProp?.findIndex(item => /reflectionFresnelColor/i.test(item.key)) // Reflective Fresnel Color

					let LCID = PropItems?.findIndex(item => /lingerColor/i.test(item.key))			// Linger Color
					let BCID = PropItems?.findIndex(item => /birthColor/i.test(item.key))			// Birth Color
					let MCID = PropItems?.findIndex(item => /color/i.test(item.key))

					if (OFCID >= 0 && T1.checked) {
						RDProp[OFCID] = RecolorProp(RDProp[OFCID], true)
						const OFColor = () => { return GetColor(RDProp[OFCID]) }
						DomEmitter[2].style.background = ToBG(OFColor)

						DomEmitter[2].onclick = () => {
							Palette = OFColor();
							MapPalette();
							document.getElementById("Slider-Input").value =
								Palette.length;
						};
					}
					if (RFCID >= 0 && T2.checked) {
						RDProp[RFCID] = RecolorProp(RDProp[RFCID], true)
						const RFColor = () => { return GetColor(RDProp[RFCID]) }
						DomEmitter[3].style.background = ToBG(RFColor())

						DomEmitter[3].onclick = () => {
							Palette = RFColor();
							MapPalette();
							document.getElementById("Slider-Input").value =
								Palette.length;
						};
					}
					if (LCID >= 0 && T3.checked) {
						PropItems[LCID] = RecolorProp(PropItems[LCID])
						const LCColor = () => { return GetColor(PropItems[LCID].value.items) }
						DomEmitter[4].style.background = ToBG(LCColor())

						DomEmitter[4].onclick = () => {
							Palette = LCColor();
							MapPalette();
							document.getElementById("Slider-Input").value =
								Palette.length;
						};
					}
					if (BCID >= 0 && T4.checked) {
						PropItems[BCID] = RecolorProp(PropItems[BCID])
						const BCColor = () => { return GetColor(PropItems[BCID].value.items) }
						DomEmitter[5].style.background = ToBG(BCColor())

						DomEmitter[5].onclick = () => {
							Palette = BCColor()
							MapPalette();
							document.getElementById("Slider-Input").value = Palette.length;
						};
					}
					if (MCID >= 0 && T5.checked) {
						PropItems[MCID] = RecolorProp(PropItems[MCID])
						const MCColor = () => { return GetColor(PropItems[MCID].value.items) }
						DomEmitter[6].style.background = ToBG(MCColor())

						DomEmitter[6].onclick = () => {
							Palette = MCColor()
							MapPalette();
							document.getElementById("Slider-Input").value = Palette.length;
						};
					}
				}
			}
		}
	}
}

function Undo() {
	if (FileCache.length > 0) {
		File = JSON.parse(JSON.stringify(FileCache[FileCache.length - 1]))
		FileCache.pop();
		LoadFile(true);
	}
	document.getElementById('CheckToggle').checked = false
	FilterParticles(document.getElementById("Filter").value);
}


async function SaveBin() {
	fs.writeFileSync(
		FilePath.slice(0, -4) + ".json",
		JSON.stringify(File, null, 2),
		"utf8"
	);
	await ToBin();
	FileSaved = true;
	FileHistory = []
}



async function ToJson() {
	await Sleep(200)
	execSync(`"${Prefs.obj.RitoBinPath}" -o json "${FilePath}"`);
}

async function ToBin() {
	await Sleep(200)
	try {
		let res = execSync(
			`"${Prefs.obj.RitoBinPath}" -o bin "${FilePath.slice(0, -4) + ".json"}"`
		);
		CreateAlert("<strong>File Saved Successfully</strong><p>don't forget to delete the json files</p>");
	}
	catch (err) {
		CreateAlert(err.stderr.toString())
	}
}

function SaveSample() {
	Samples.add(_.cloneDeep(Palette))
}

function OpenSampleWindow() {
	Samples.show();
}

ChangeColorCount(2);

