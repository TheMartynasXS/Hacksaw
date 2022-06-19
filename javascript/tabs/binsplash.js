const {Tab} = require('../javascript/shared.js');
const {Prefs, Samples, CreateAlert} = require('../javascript/shared.js');

const { execSync } = require("child_process");
const {ColorTranslator} = require('colortranslator')
const { getColorHexRGB } = require("electron-color-picker");
const {ipcRenderer} = require('electron');
const fs = require('fs')

const {ColorHandler, GetColor, ToBG} = require('../javascript/colors.js');

let FileCache = [];
let FileHistory = [];
let FileSaved = true;

let RecolorMode = document.getElementById("Mode");
let RecolorTarget = document.getElementById("Target");
let UseTimes = document.getElementById('Use-Times');
let UseOpacity = document.getElementById("Use-Opacity");

let T1 = document.getElementById('T1')
let T2 = document.getElementById('T2')
let T3 = document.getElementById('T3')
let T4 = document.getElementById('T4')
let T5 = document.getElementById('T5')

let BlankDynamic = `{"key":"dynamics","type":"pointer","value":{"items":[{"key":"times","type":"list","value":{"items":[],"valueType":"f32"}},{"key":"values","type":"list","value":{"items":[],"valueType":"vec4"}}],"name":"VfxAnimatedColorVariableData"}}`;
let BlankConstant = `{"key":"constantValue","type":"vec4","value":[0.5,0.5,0.5,1]}`;


let Palette = [new ColorHandler];

let ColorContainer = document.getElementById("Color-Container");
let GradientIndicator = document.getElementById("Gradient-Indicator");
let TimeContainer = document.getElementById("Time-Container");
let OpacityContainer = document.getElementById("Opacity-Container");
let ParticleList = document.getElementById("Particle-List");
let SampleContainer = document.getElementById("SampleContainer");


window.onerror = function (msg, error, lineNo, columnNo) {
	CreateAlert(
		`Message: ${msg}\n\nError: ${error},\n\nRaised at: ${lineNo} : ${columnNo}`,
		true
	);
};

document.getElementById("Mode").addEventListener("change",(Event)=>{
	if (Event.target.value == "false") {
		GradientIndicator.classList.replace("Flex","Hidden");
		TimeContainer.classList.replace("Flex","Hidden");
	} else {
		GradientIndicator.classList.replace("Hidden","Flex");
		TimeContainer.classList.replace("Hidden","Flex");
	}
})

document.getElementById("Mode").value = Prefs.obj.UseAdvanced;
if (document.getElementById("Mode").value == "false") {
	GradientIndicator.classList.replace("Flex","Hidden");
	TimeContainer.classList.replace("Flex","Hidden");
} else {
	GradientIndicator.classList.replace("Hidden","Flex");
	TimeContainer.classList.replace("Hidden","Flex");
}



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

function CreatePicker(Target,PaletteIndex) {
	if (document.getElementById("Color-Picker") == undefined) {
		let temp = Target.style.backgroundColor.match(/\d+/g);

		let ColorPicker = document.createElement("div");
		ColorPicker.className = "Flex-Col Outline";
		ColorPicker.id = "Color-Picker";
		ColorPicker.position = "absolute";
		ColorPicker.style.top = document.getElementById("Mode").value == "true" ? `12em` : "9em";

		let ColorPickerInputs = document.createElement("div");
		ColorPickerInputs.className = "Input-Group";

		let EyeDropper = document.createElement("button");
		EyeDropper.innerText = "EyeDropper";
		EyeDropper.onclick = () => PickScreen();
		ColorPickerInputs.appendChild(EyeDropper);

		let ColorInput = document.createElement("input");
		ColorInput.id = "RGB";
		ColorInput.type = "color";

		ColorInput.value = ColorTranslator.toHEX({r:temp[0],g:temp[1],b:temp[2]});
		ColorInput.oninput = (E) => {
			Hex.value = E.target.value;
			Target.style.backgroundColor = E.target.value;
			Palette[PaletteIndex].input(ColorInput.value,Alpha.value)
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
		Hex.value = ColorTranslator.toHEX({r:temp[0],g:temp[1],b:temp[2]})
		Hex.maxLength = 7;
		Hex.oninput = (Event) => {
			if (!Event.target.value.startsWith("#")) {
				Event.target.value = "#" + Event.target.value;
			}
			ColorInput.value = Event.target.value;
			Palette[PaletteIndex].input(ColorInput.value,Alpha.value)
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
		Alpha.value = Palette[PaletteIndex].obj.A
		Alpha.maxLength = 7;

		Alpha.oninput = (Event) => {
			
			Palette[PaletteIndex].input(ColorInput.value,Alpha.value)
			MapPalette();
		};

		ColorPickerInputs.appendChild(Alpha);

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
		CreatePicker(Target,PaletteIndex);
	}
}

function MapPalette() {
	ColorContainer.innerText = null;
	TimeContainer.innerText = null;

	let indicatorColor = [];

	Palette.map((PaletteItem, PaletteIndex) => {
		let ColorDiv = document.createElement("div");
		ColorDiv.className = "Color Flex-1";
		ColorDiv.style.backgroundColor = PaletteItem.obj.HEX;
		ColorDiv.onclick = (Event) => {
			CreatePicker(Event.target,PaletteIndex);
		}
		ColorDiv
		ColorContainer.appendChild(ColorDiv);
		
		let TimeInput = document.createElement("input");
		TimeInput.type = "number";
		TimeInput.className = "Time Flex-Auto";
		TimeInput.value = Math.round(PaletteItem.time * 100);
		TimeInput.max = 100;
		TimeInput.min = 0;
		TimeInput.onchange = (Event) => {
			ParticleItem.time = parseInt(Event.target.value) / 100;
			MapPalette();
		};
		if (PaletteIndex == 0 || PaletteIndex == Palette.length - 1) {
			TimeInput.disabled = true;
		}
		TimeContainer.appendChild(TimeInput);

		indicatorColor.push(
			`${PaletteItem.obj.HEX} ${Math.round(PaletteItem.time*100)}%`
		);
		
		if (Palette.length > 1) {
			GradientIndicator.style.background = `linear-gradient(0.25turn,${indicatorColor.join(
				","
			)})`;
		} else {
			GradientIndicator.style.background = PaletteItem.obj.HEX;
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


function OpenBin() {
	if (FileSaved != true) {
		UTIL.CreateAlert(
			"You may have forgotten to save your bin.\nSave before proceeding please.",
			true
		);
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
		ToJson();
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
	let Container = File.entries.value.items;
	if (/ValueColor/.test(JSON.stringify(Container)) == false) {
		UTIL.CreateAlert("No color values found", false);
		return 0;
	}

	for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
		if (Container[PO_ID].value.name == "VfxSystemDefinitionData") {
			ParticleName = Container[PO_ID].value.items.find((item) => {
				if (item.key == "particleName") {
					return item;
				}
			}).value;

			let ParticleDiv = document.createElement("div");
			ParticleDiv.id = Container[PO_ID].key;
			ParticleDiv.className = "Particle-Div";
			ParticleDiv.innerHTML = `<div class="Particle-Title-Div Flex">
            <input type="checkbox" class="CheckBox" onclick="CheckChildren(this.parentNode.parentNode.children[1],this.checked)"/>
            <div class="Label Ellipsis Flex-1">${ParticleName}</div>
            </div>`;
			let DefData = Container[PO_ID].value.items.filter(
				(item) =>
					item.key == "complexEmitterDefinitionData" ||
					item.key == "simpleEmitterDefinitionData"
			);
			for (let B = 0; B < DefData.length; B++) {
				let DefDataDiv = document.createElement("div");
				DefDataDiv.className = "DefDataDiv";
				ParticleDiv.appendChild(DefDataDiv);

				if (
					DefData[B].key == "complexEmitterDefinitionData" ||
					DefData[B].key == "simpleEmitterDefinitionData"
				) {
					let Props = DefData[B].value.items;
					for (let C = 0; C < Props.length; C++) {
						let PropItems = Props[C].items

						let RDID = PropItems?.findIndex(item => item.key == 'reflectionDefinition')
						let RDProp = PropItems[RDID]?.value.items

						let OFCID = RDProp?.findIndex(item => item.key == 'fresnelColor')           // Outline Fresnel Color
						let RFCID = RDProp?.findIndex(item => item.key == 'reflectionFresnelColor') // Reflective Fresnel Color

						let LCID = PropItems?.findIndex(item => item.key == 'lingerColor')			// Linger Color
						let BCID = PropItems?.findIndex(item => item.key == 'birthColor')			// Birth Color
						let MCID = PropItems?.findIndex(item => item.key == 'color')				// Main Color
						let BMID = PropItems?.findIndex(item => item.key == 'blendMode')			// Blend Mode

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
									(item) => item.key == "emitterName"
								)
							]?.value;
						Emitter.appendChild(Title);


						let OutlineDiv = document.createElement("div")
						if (OFCID >= 0) {
							let OFColor = GetColor(RDProp[OFCID].value.items)
							OFBG = ToBG(OFColor)

							OutlineDiv.onclick = () => {
								Palette = OFColor
								MapPalette();
								document.getElementById("Slider-Input").value = Palette.length;
							};
						}
						OutlineDiv.className = `Prop-Block-Secondary Pointer ${OFBG ? "" : "Blank-Obj"}`
						OutlineDiv.style = `background: ${OFBG ? OFBG : ""}`
						Emitter.appendChild(OutlineDiv);

						let ReflectiveDiv = document.createElement("div")
						if (RFCID >= 0) {
							let RFColor = GetColor(RDProp[RFCID].value.items)
							RFBG = ToBG(RFColor)

							ReflectiveDiv.onclick = () => {
								Palette = RFColor
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
							let DynID = PropType.findIndex(item => item.key == 'dynamics')
							if (DynID >= 0) {
								let ProbTableID = PropType[DynID].value.items.findIndex(item => item.key == 'probabilityTables')
								if (ProbTableID >= 0) PropType[DynID].value.items.shift()
							}

							let LCColor = GetColor(PropItems[LCID].value.items)
							LCBG = ToBG(LCColor)

							LingerDiv.onclick = () => {
								Palette = LCColor
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
							let DynID = PropType.findIndex(item => item.key == 'dynamics')
							if (DynID >= 0) {
								let ProbTableID = PropType[DynID].value.items.findIndex(item => item.key == 'probabilityTables')
								if (ProbTableID >= 0) PropType[DynID].value.items.shift()
							}
							let BCColor = GetColor(PropItems[BCID].value.items)
							BCBG = ToBG(BCColor)

							BirthDiv.onclick = () => {
								Palette = BCColor
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
							let DynID = PropType.findIndex(item => item.key == 'dynamics')
							if (DynID >= 0) {
								let ProbTableID = PropType[DynID].value.items.findIndex(item => item.key == 'probabilityTables')
								if (ProbTableID >= 0) PropType[DynID].value.items.shift()
							}
							let MCColor = GetColor(PropItems[MCID].value.items)
							MCBG = ToBG(MCColor)

							MainColorDiv.onclick = () => {
								Palette = MCColor
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
	if (!SkipAlert) {
		UTIL.CreateAlert("File Loaded Successfully");
	}
}

function ColorHelp() {
	UTIL.CreateAlert(
		`
		OC - Outline Fresnel Color, changes outline color
		RC - Reflection Fresnel Color, changes reflective color
		LC - Linger Color, changes color when the particle is dying
		BC - Birth Color, changes color at the start
		Main Color - Main particle color
		`
	)
}

function FilterParticles(FilterString) {
	let ParticleListChildren = ParticleList.children;
	let search = new RegExp(FilterString, "i");
	for (let I = 0; I < ParticleListChildren.length; I++) {
		let match =
			ParticleListChildren[I].children[0].children[1].textContent.match(
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
		let NewColor = RecolorMode.value == "false" ?
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
	let ConstID = PropType.findIndex(item => item.key == 'constantValue')
	let DynID = PropType.findIndex(item => item.key == 'dynamics')

	if (RecolorMode.value == "false") {
		if (DynID >= 0) {
			let DynValue = PropType[DynID].value.items
			let DynTimes = DynValue[0].value.items
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
	} else if (RecolorMode.value == "true") {
		if (Palette.length > 1 && DynID < 0) {
			PropType[ConstID] = JSON.parse(BlankDynamic)
		}
		else if (Palette.length == 1 && ConstID < 0) {
			PropType[DynID] = JSON.parse(BlankConstant)
		}

		ConstID = PropType.findIndex(item => item.key == 'constantValue')
		DynID = PropType.findIndex(item => item.key == 'dynamics')

		if (DynID >= 0) {
			let DynValue = PropType[DynID].value.items
			let DynTimes = DynValue[0].value.items
			let TempCount = DynTimes.length
			let DynColors = DynValue[1].value.items

			if (DynTimes.length > Palette.length) {
				for (let i = 0; i < Palette.length; i++) {
					let NewColor = Palette[i].vec4
					DynTimes[i] = UseTimes.checked ? Palette[i].time : i == Palette.length - 1 ? 1 : DynTimes[i]
					DynColors[i][0] = NewColor[0]
					DynColors[i][1] = NewColor[1]
					DynColors[i][2] = NewColor[2]
					DynColors[i][3] = UseOpacity.checked ? NewColor[3] : DynColors[i][3]
					for (let i = 0; i < DynTimes.length - Palette.length; i++) {
						DynTimes.pop()
						DynColors.pop()
					}
				}
			}
			else if (TempCount <= Palette.length) {
				for (let i = 0; i < Palette.length; i++) {
					let NewColor = Palette[i].vec4
					DynTimes[i] = 1 / (Palette.length - 1) * i
					DynColors[i] = i > TempCount - 1 ? [0,0,0,1] : DynColors[i] == undefined ? [0,0,0,1] : DynColors[i]
					DynColors[i][0] = NewColor[0]
					DynColors[i][1] = NewColor[1]
					DynColors[i][2] = NewColor[2]
					DynColors[i][3] = UseOpacity.checked? i < Palette.length ? NewColor[3] : DynColors[i][3] : DynColors[i][3]

					for (let i = 0; i < TempCount - Palette.length; i++) {
						DynTimes.pop()
						DynColors.pop()
					}
				}
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
	}
	return ColorProp
}
function RecolorSelected() {
	FileSaved = false;
	FileCache.push(File);
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
				let Offset = DefData.findIndex(item => (item.key == "complexEmitterDefinitionData" || item.key == "simpleEmitterDefinitionData"))
				if (DomEmitter[0].checked) {
					let PropItems = DefData[B - 1 + Offset].value.items[C].items;
					let RDID = PropItems?.findIndex(item => item.key == 'reflectionDefinition')
					let RDProp = PropItems[RDID]?.value.items

					let OFCID = RDProp?.findIndex(item => item.key == 'fresnelColor')           // Outline Fresnel Color
					let RFCID = RDProp?.findIndex(item => item.key == 'reflectionFresnelColor') // Reflective Fresnel Color

					let LCID = PropItems?.findIndex(item => item.key == 'lingerColor')			// Linger Color
					let BCID = PropItems?.findIndex(item => item.key == 'birthColor')			// Birth Color
					let MCID = PropItems?.findIndex(item => item.key == 'color')

					if (OFCID >= 0 && T1.checked) {
						RDProp[OFCID] = RecolorProp(RDProp[OFCID], true)
						let OFColor = GetColor(RDProp[OFCID].value.items)
						DomEmitter[2].style.background = ToBG(OFColor)

						DomEmitter[2].onclick = () => {
							Palette = OFColor;
							MapPalette();
							document.getElementById("Slider-Input").value =
								Palette.length;
						};
					}
					if (RFCID >= 0 && T2.checked) {
						RDProp[RFCID] = RecolorProp(RDProp[RFCID], true)
						let RFColor = GetColor(RDProp[RFCID].value.items)
						DomEmitter[3].style.background = ToBG(RFColor)

						DomEmitter[3].onclick = () => {
							Palette = RFColor;
							MapPalette();
							document.getElementById("Slider-Input").value =
								Palette.length;
						};
					}
					if (LCID >= 0 && T3.checked) {
						PropItems[LCID] = RecolorProp(PropItems[LCID])
						let LCColor = GetColor(PropItems[LCID].value.items)
						DomEmitter[4].style.background = ToBG(LCColor)

						DomEmitter[4].onclick = () => {
							Palette = LCColor;
							MapPalette();
							document.getElementById("Slider-Input").value =
								Palette.length;
						};
					}
					if (BCID >= 0 && T4.checked) {
						PropItems[BCID] = RecolorProp(PropItems[BCID])
						let BCColor = GetColor(PropItems[BCID].value.items)
						DomEmitter[5].style.background = ToBG(BCColor)

						DomEmitter[5].onclick = () => {
							Palette = BCColor
							MapPalette();
							document.getElementById("Slider-Input").value = Palette.length;
						};
					}
					if (MCID >= 0 && T5.checked) {
						PropItems[MCID] = RecolorProp(PropItems[MCID])
						let MCColor = GetColor(PropItems[MCID].value.items)
						DomEmitter[6].style.background = ToBG(MCColor)

						DomEmitter[6].onclick = () => {
							Palette = MCColor
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
		File = FileCache[FileCache.length - 1]
		FileCache.pop();
		LoadFile(true);
	}
	document.getElementById('CheckToggle').checked = false
	FilterParticles(document.getElementById("Filter").value);
}


function SaveBin() {
	fs.writeFileSync(
		FilePath.slice(0, -4) + ".json",
		JSON.stringify(File, null, 2),
		"utf8"
	);
	ToBin();
	FileSaved = true;
	for (let i = 0; i < FileHistory.length; i++) {
		File = null;
		fs.unlinkSync(FileHistory[i]);
	}
	FileHistory = [];
}

function ToJson() {
	execSync(`"${Prefs.obj.RitoBinPath}" -o json "${FilePath}"`);
}

function ToBin() {
	try{
		let res = execSync(
			`"${Prefs.obj.RitoBinPath}" -o bin "${FilePath.slice(0, -4) + ".json"}"`
		);
		CreateAlert("File Saved Successfully");
	}
	catch(err){
		CreateAlert(err.stderr.toString())
	}
}

function SaveSample() {
	Samples.add(Palette)
}

function OpenSampleWindow() {
	Samples.show();
}

ChangeColorCount(2);