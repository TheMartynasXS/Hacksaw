const { ipcRenderer, ipcMain } = require("electron");

const {
  Tab,
  Prefs,
  Samples,
  CreateMessage,
  Sleep,
  extendPrototypes,
  filterIndices,
} = require("../javascript/utils.js");

let FileSaved = true;

const KEYS = require("../javascript/keys.json");

const { execSync } = require("child_process");
const { getColorHexRGB } = require("electron-color-picker");

const _ = require("lodash");
const fs = require("fs");

const { ColorHandler, GetColor, ToBG } = require("../javascript/colors.js");

const fnv1a = require("fnv1a");
const { get } = require("http");

extendPrototypes();

tempvalue = "ValueColor";

let RecolorMode = document.getElementById("Mode");
let RecolorTarget = document.getElementById("Target");
RecolorMode.value = Prefs.obj.PreferredMode;
let ActiveFile = {};
let mids = [];
let pids = [];

let T1 = document.getElementById("T1");
let T2 = document.getElementById("T2");
let T3 = document.getElementById("T3");
let T4 = document.getElementById("T4");
let T5 = document.getElementById("T5");

let HUE = document.getElementById("Hue");
let SAT = document.getElementById("Sat");
let LIGHT = document.getElementById("Light");



[T1, T2, T3, T4, T5].forEach((T, index) => {
  T.addEventListener("change", (Event) => {
    const targets = [
      T1.checked,
      T2.checked,
      T3.checked,
      T4.checked,
      T5.checked,
    ];
    targets[index] = Event.target.checked;
    Prefs.Targets(targets);
  });
  T.checked = Prefs.obj.Targets[index];
});

let BlankDynamic;
let BlankConstant;

if (!Prefs.obj.dev) {
  BlankDynamic = `{"key":"3154345447","type":"pointer","value":{"items":[{"key":"1567157941","type":"list","value":{"items":[],"valueType":"f32"}},{"key":"877087803","type":"list","value":{"items":[],"valueType":"vec4"}}],"name":"1128908277"}}`;
  BlankConstant = `{"key":"3031705514","type":"vec4","value":[0.5,0.5,0.5,1]}`;
} else {
  BlankDynamic = `{"key":"dynamics","type":"pointer","value":{"items":[{"key":"1567157941","type":"list","value":{"items":[],"valueType":"f32"}},{"key":"877087803","type":"list","value":{"items":[],"valueType":"vec4"}}],"name":"1128908277"}}`;
  BlankConstant = `{"key":"constantValue","type":"vec4","value":[0.5,0.5,0.5,1]}`;
}

let Palette = [new ColorHandler()];

let ColorContainer = document.getElementById("Color-Container");
let GradientIndicator = document.getElementById("Gradient-Indicator");
// let OpacityContainer = document.getElementById("Opacity-Container");
let ParticleList = document.getElementById("Particle-List");
// // let SampleContainer = document.getElementById("SampleContainer");

window.onerror = function (msg, file, lineNo, columnNo) {
  ipcRenderer.send("Message", {
    type: "error",
    title: file + " @ line: " + lineNo + " col: " + columnNo,
    message: msg,
  });
};

ChangeMode(RecolorMode.value);
function ChangeMode(mode) {
  switch (mode) {
    case "random":
      GradientIndicator.style.display = "none";
      ColorContainer.style.display = "grid";
      document.getElementById("Slider-Input").style.display = "block";
      break;
    case "linear":
    case "wrap":
    case "semi-override":
      GradientIndicator.style.display = "flex";
      ColorContainer.style.display = "grid";
      document.getElementById("Slider-Input").style.display = "block";
      break;
    case "shift":
      ColorContainer.style.display = "none";
      GradientIndicator.style.display = "none";
      document.getElementById("Slider-Input").style.display = "none";
      break;
  }
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

    ColorInput.value = new ColorHandler([
      temp[0] / 255,
      temp[1] / 255,
      temp[2] / 255,
      1,
    ]).ToHEX();
    ColorInput.oninput = (E) => {
      Hex.value = E.target.value;
      Target.style.backgroundColor = E.target.value;
      Palette[PaletteIndex].InputHex(E.target.value);
      MapPalette();
    };
    ColorPickerInputs.appendChild(ColorInput);

    let Label = document.createElement("div");
    Label.innerText = "Hex:";
    Label.className = "Label";
    ColorPickerInputs.appendChild(Label);

    let Hex = document.createElement("input");
    Hex.id = "Hex";
    Hex.className = "Flex-1 Label";
    Hex.value = new ColorHandler([
      temp[0] / 255,
      temp[1] / 255,
      temp[2] / 255,
      1,
    ]).ToHEX();
    Hex.maxLength = 7;
    Hex.oninput = (Event) => {
      if (!Event.target.value.startsWith("#")) {
        Event.target.value = "#" + Event.target.value;
      }
      ColorInput.value = Event.target.value;
      Palette[PaletteIndex].InputHex(Event.target.value);
      MapPalette();
    };
    ColorPickerInputs.appendChild(Hex);

    let Label2 = document.createElement("div");
    Label2.innerText = "Alpha:";
    Label2.className = "Label";
    ColorPickerInputs.appendChild(Label2);

    let Alpha = document.createElement("input");
    Alpha.id = "Alpha";
    Alpha.className = "Flex-1 Label";
    Alpha.value = Palette[PaletteIndex].vec4[3];
    Alpha.maxLength = 7;

    Alpha.oninput = (E) => {
      Palette[PaletteIndex].InputAlpha(E.target.value);
      MapPalette();
    };

    ColorPickerInputs.appendChild(Alpha);
    let Exit = document.createElement("button");
    Exit.innerText = "X";
    Exit.onclick = () => {
      document.getElementById("Color-Picker").remove();
    };
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
    ColorDiv.className = "Color";
    ColorDiv.style.backgroundColor = PaletteItem.ToHEX();
    ColorDiv.onclick = (Event) => {
      CreatePicker(Event.target, PaletteIndex);
    };
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
  });
  document.getElementById(
    "Color-Container"
  ).style.gridTemplateColumns = `repeat(${Palette.length}, minmax(0px, 1fr))`;
}
MapPalette();
function ColorShift() {
  for (let i = 0; i < Palette.length; i++) {
    Palette[i].HSLShift(
      HUE.value == "" ? 0 : HUE.value,
      SAT.value == "" ? 0 : SAT.value,
      LIGHT.value == "" ? 0 : LIGHT.value
    );
  }
  HUE.value;
  MapPalette();
}

function Inverse() {
  for (let i = 0; i < Palette.length; i++) {
    let inverse = [
      1 - Palette[i].vec4[0],
      1 - Palette[i].vec4[1],
      1 - Palette[i].vec4[2],
      Palette[i].vec4[3],
    ];
    Palette[i].InputVec4(inverse);
  }
  MapPalette();
}

function ChangeColorCount(Count) {
  let TempLenght = parseInt(Palette.length);
  if (TempLenght < Count) {
    for (let ID = 0; ID < Count - TempLenght; ID++) {
      Palette.push(new ColorHandler());
    }
  } else if (TempLenght > Count) {
    for (let ID = 0; ID < TempLenght - Count; ID++) {
      Palette.pop();
    }
  }
  Palette.map((PaletteItem, index) => {
    PaletteItem.time = (1 / (Palette.length - 1)) * index;
  });
  MapPalette();
  document.getElementById("Slider-Input").value = Palette.length;
}
async function OpenBin(skip = false) {
  document.getElementById("CheckToggle").checked = false;

  let result = ipcRenderer.sendSync("OpenBin");

  if (result == undefined) {
    return 0;
  }

  document.getElementById("Title").innerText =
    result.Path.split(".wad.client\\").pop();

  ActiveFile = result.File;
  LoadFile();
}

function LoadFile(SkipAlert = true) {
  ParticleList.innerText = "";
  let Relative = "";
  for (let i = 0; i < ActiveFile.linked.value.items.length; i++) {
    Relative += `${ActiveFile.linked.value.items[i]}\n`;
  }
  let Containers = ActiveFile.entries.value.items;

  pids = filterIndices(Containers, (item) =>
    item.value.name.fnv("VfxSystemDefinitionData")
  );
  mids = filterIndices(Containers, (item) =>
    item.value.name.fnv("StaticMaterialDef")
  );

  for (let cid = 0; cid < pids.length; cid++) {
    let ParticleDiv = document
      .getElementsByTagName("template")[0]
      .content.cloneNode(true).firstElementChild;

    ParticleDiv.setAttribute("type", "vfx");

    let Container = Containers[pids[cid]];

    ParticleDiv.children[0].children[1].innerText =
      Container.value.items.find((item) => item.key.fnv("particleName"))
        ?.value ?? `unknown ${nodes.length + 1}`;
    ParticleDiv.id = Container.key;
    ParticleList.appendChild(ParticleDiv);

    // console.log(Container.value.items)
    let indices = filterIndices(
      Container.value.items,
      (item) =>
        item.key.fnv("complexEmitterDefinitionData") ||
        item.key.fnv("simpleEmitterDefinitionData")
    );
    for (let ddid = 0; ddid < indices?.length; ddid++) {
      let DefDataDiv = document.createElement("div");
      DefDataDiv.className = "DefDataDiv";
      ParticleDiv.appendChild(DefDataDiv);
      let Props = Container.value.items[indices[ddid]].value.items;
      // console.log(Props)
      for (let pid = 0; pid < Props.length; pid++) {
        let PropItems = Props[pid].items;
        // console.log(PropItems);
        let RDID = PropItems?.findIndex((item) =>
          item.key.fnv("reflectionDefinition")
        );
        let RDProp = PropItems[RDID]?.value.items;

        let OFCID = RDProp?.findIndex((item) => item.key.fnv("fresnelColor")); // Outline Fresnel Color
        let RFCID = RDProp?.findIndex((item) =>
          item.key.fnv("reflectionFresnelColor")
        ); // Reflective Fresnel Color
        let LCID = PropItems?.findIndex((item) => item.key.fnv("lingerColor")); // Linger Color
        let BCID = PropItems?.findIndex((item) => item.key.fnv("birthColor")); // Birth Color
        let MCID = PropItems?.findIndex((item) => item.key.fnv("color")); // Main Color
        let BMID = PropItems?.findIndex((item) => item.key.fnv("blendMode")); // Blend Mode
        let DID = PropItems?.findIndex((item) => item.key.fnv("disabled"));
        let OFBG, RFBG, LCBG, BCBG, MCBG;

        let Emitter = document
          .getElementsByTagName("template")[1]
          .content.cloneNode(true).firstElementChild;

        Emitter.children[1].innerText =
          Props[pid].items[
            Props[pid].items.findIndex((item) => item.key.fnv("emitterName"))
          ]?.value;

        if (OFCID >= 0) {
          const OFColor = GetColor(RDProp[OFCID]);
          OFBG = ToBG(OFColor);

          Emitter.children[2].onclick = () => {
            Palette = _.cloneDeep(OFColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        Emitter.children[2].className = `Prop-Block-Secondary Pointer ${
          OFBG ? "" : "Blank-Obj"
        }`;
        Emitter.children[2].style = `background: ${OFBG ? OFBG : ""}`;

        if (RFCID >= 0) {
          const RFColor = GetColor(RDProp[RFCID]);
          RFBG = ToBG(RFColor);

          ReflectiveDiv.onclick = () => {
            Palette = _.cloneDeep(RFColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        Emitter.children[3].className = `Prop-Block-Secondary Pointer ${
          RFBG ? "" : "Blank-Obj"
        }`;
        Emitter.children[3].style = `background: ${RFBG ? RFBG : ""}`;

        breakpoint: if (LCID >= 0) {
          LDID = PropItems[LCID].value.items.findIndex((item) =>
            item.key.fnv("dynamics")
          );
          if (LDID < 0) break breakpoint;
          let PropType = PropItems[LCID].value.items[LDID];
          let DynID = PropType.value.items.findIndex((item) =>
            item.key.fnv("dynamics")
          );
          if (DynID >= 0) {
            let ProbTableID = PropType.value.items[DynID].value.items.findIndex(
              (item) => item.key.fnv("probabilityTables")
            );
            if (ProbTableID >= 0)
              PropType.value.items[DynID].value.items.shift();
          }
          const LCColor = GetColor(
            PropItems[LCID].value.items[LDID].value.items
          );
          LCBG = ToBG(LCColor);

          Emitter.children[4].onclick = () => {
            Palette = _.cloneDeep(LCColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        Emitter.children[4].className = `Prop-Block-Secondary Pointer ${
          LCBG ? "" : "Blank-Obj"
        }`;
        Emitter.children[4].style = `background: ${LCBG ? LCBG : ""}`;

        if (BCID >= 0) {
          let PropType = PropItems[BCID].value.items;
          let DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));
          if (DynID >= 0) {
            let ProbTableID = PropType[DynID].value.items.findIndex((item) =>
              item.key.fnv("probabilityTables")
            );
            if (ProbTableID >= 0) PropType[DynID].value.items.shift();
          }
          const BCColor = GetColor(PropItems[BCID].value.items);
          BCBG = ToBG(BCColor);

          Emitter.children[5].onclick = () => {
            Palette = _.cloneDeep(BCColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        Emitter.children[5].className = `Prop-Block-Secondary Pointer ${
          BCBG ? "" : "Blank-Obj"
        }`;
        Emitter.children[5].style = `background: ${BCBG ? BCBG : ""}`;

        if (MCID >= 0) {
          let PropType = PropItems[MCID].value.items;
          let DynID = PropType?.findIndex((item) => item.key.fnv("dynamics"));
          if (DynID >= 0) {
            let ProbTableID = PropType[DynID].value.items.findIndex((item) =>
              item.key.fnv("probabilityTables")
            );
            if (ProbTableID >= 0) PropType[DynID].value.items.shift();
          }
          const MCColor = GetColor(PropItems[MCID].value.items);
          MCBG = ToBG(MCColor);

          Emitter.children[6].onclick = () => {
            Palette = _.cloneDeep(MCColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        Emitter.children[6].className = `Prop-Block Pointer ${
          MCBG ? "" : "Blank-Obj"
        }`;
        Emitter.children[6].style = `background: ${MCBG ? MCBG : ""}`;

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
              PropItems[BMID].value = parseInt(Event.target.value);
              Event.target.placeholder = parseInt(Event.target.value);
            }
          };
        } else {
          BlendMode.style = `visibility: hidden`;
        }
        Emitter.appendChild(BlendMode);

        let disabled = document.createElement("input");
        disabled.type = "checkbox";
        disabled.className = `CheckBox Disable`;
        if (DID >= 0) {
          disabled.checked = PropItems[DID].value;
        } else {
          DID = PropItems.length;
          PropItems.push({
            key: "disabled",
            type: "bool",
            value: false,
          });
        }
        disabled.onchange = (Event) => {
          PropItems[DID].value = Event.target.checked;
          console.log(Event.target.checked);
        };
        Emitter.appendChild(disabled);

        DefDataDiv.appendChild(Emitter);
      }
    }
  }
  for (let cid = 0; cid < mids.length; cid++) {
    let ParticleDiv = document
      .getElementsByTagName("template")[0]
      .content.cloneNode(true).firstElementChild;
    ParticleDiv.setAttribute("type", "material");
    let Container = Containers[mids[cid]];

    ParticleDiv.children[0].children[1].innerText =
      "[Material] " +
        Container.value.items
          .find((item) => item.key.fnv("name"))
          ?.value.split("Materials/")
          .pop() ?? `unknown ${nodes.length + 1}`;
    ParticleDiv.id = Container.key;
    ParticleList.appendChild(ParticleDiv);

    let DefDataDiv = document.createElement("div");
    DefDataDiv.className = "DefDataDiv";
    ParticleDiv.appendChild(DefDataDiv);

    let Params = Container.value.items;

    let pVid = Params.findIndex((item) => item.key.fnv("paramValues"));
    let dMid = Params.findIndex((item) => item.key.fnv("dynamicMaterial"));

    if (pVid >= 0) {
      for (let i = 0; i < Params[pVid].value.items.length; i++) {
        if (Params[pVid].value.items[i].items[1] == undefined) continue;
        if (!/Color/i.test(Params[pVid].value.items[i].items[0].value))
          continue;
        let param_object = document
          .getElementsByTagName("template")[2]
          .content.cloneNode(true).firstElementChild;
        param_object.children[1].innerText =
          Params[pVid].value.items[i].items[0].value;
        param_object.children[2].style = `background: ${ToBG(
          GetColor(Params[pVid].value.items[i].items[1])
        )}; border: none;`;
        param_object.children[2].onclick = () => {
          Palette = _.cloneDeep(GetColor(Params[pVid].value.items[i].items[1]));
          MapPalette();
          document.getElementById("Slider-Input").value = Palette.length;
        };
        DefDataDiv.appendChild(param_object);
      }
    }
    // if (dMid >= 0) {
    //   let x = nodes.find(
    //     (item) =>
    //       item.children[1].innerText ==
    //       Params[dMid].value.items[0].value.items[0].items[0].value
    //   );
    //   console.log(Params[dMid]);

    // }
  }
}

function ColorHelp() {
  CreateMessage({
    type: "info",
    buttons: ["Ok"],
    title: "Color Info",
    message: `OC - Outline Fresnel Color, changes outline color
			RC - Reflection Fresnel Color, changes reflective color
			LC - Linger Color, changes color when the particle is dying
			BC - Birth Color, changes color at the start
			Main Color - Main particle color
			BM - Blend mode, changes how particle color is being applied to particle
			ON - is particle enabled?`,
  });
}

function FilterParticles(FilterString) {
  let ParticleListChildren = ParticleList.children;

  let search;
  try {
    search = new RegExp(FilterString, "i");
  } catch (error) {}

  if (search != undefined) {
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
}

function CheckToggle(checkbox) {
  let ParticleListChildren = ParticleList.children;
  for (let I = 0; I < ParticleListChildren.length; I++) {
    if (ParticleListChildren[I].style.display != "none") {
      ParticleListChildren[I].children[0].children[0].checked =
        checkbox.checked;
      CheckChildren(
        ParticleListChildren[I].children,
        ParticleListChildren[I].children[0].children[0].checked
      );
    }
  }
}

function CheckChildren(Particles, State) {
  for (let i = 1; i < Particles.length; i++) {
    if (Particles[i] == undefined) {
      return 0;
    }
    for (let j = 0; j < Particles[i].children.length; j++) {
      if (
        Particles[i].children[j].style.visibility != "hidden" &&
        Particles[i].children[j].children[0].disabled != true
      ) {
        Particles[i].children[j].children[0].checked = State;
      }
    }
  }
}

function IsBW(A, B, C) {
  return A == B && B == C ? A == 0 || A == 1 : false;
}

function RecolorProp(ColorProp, ConstOnly = false) {
  if (ConstOnly) {
    let NewColor;
    switch (RecolorMode.value) {
      case "random":
        NewColor =
          Palette[Math.round(Math.random() * (Palette.length - 1))].vec4;
        break;
      case "linear":
      case "wrap":
      case "semi-override":
        NewColor = Palette[0].vec4;
        break;
      case "inverse":
        NewColor = [
          1 - ColorProp.value[0],
          1 - ColorProp.value[1],
          1 - ColorProp.value[2],
          ColorProp.value[3],
        ];
        break;
      case "shift":
        NewColor = new ColorHandler(ColorProp.value);
        NewColor.HSLShift(
          HUE.value == "" ? 0 : HUE.value,
          SAT.value == "" ? 0 : SAT.value,
          LIGHT.value == "" ? 0 : LIGHT.value
        );
        NewColor = NewColor.vec4;
        break;
    }
    if (
      RecolorMode != "semi-override" &&
      !(
        Prefs.obj.IgnoreBW &&
        IsBW(ColorProp.value[0], ColorProp.value[1], ColorProp.value[2])
      )
    ) {
      ColorProp.value[0] = NewColor[0];
      ColorProp.value[1] = NewColor[1];
      ColorProp.value[2] = NewColor[2];
    }
    return ColorProp;
  }

  let PropType = ColorProp.value.items;
  let ConstID = PropType?.findIndex((item) => item.key.fnv("constantValue"));
  let DynID = PropType?.findIndex((item) => item.key.fnv("dynamics"));
  switch (RecolorMode.value) {
    case "random":
      if (DynID >= 0) {
        let DynValue = PropType[DynID].value.items;
        let DynColors = DynValue[1].value.items;

        for (let i = 0; i < DynColors.length; i++) {
          if (
            !(
              Prefs.obj.IgnoreBW &&
              IsBW(DynColors[i][0], DynColors[i][1], DynColors[i][2])
            )
          ) {
            let NewColor =
              Palette[Math.round(Math.random() * (Palette.length - 1))].vec4;
            DynColors[i][0] = NewColor[0];
            DynColors[i][1] = NewColor[1];
            DynColors[i][2] = NewColor[2];
          }
        }
      } else {
        let NewColor =
          Palette[Math.round(Math.random() * (Palette.length - 1))].vec4;
        if (
          !(
            Prefs.obj.IgnoreBW &&
            IsBW(
              PropType[ConstID].value[0],
              PropType[ConstID].value[1],
              PropType[ConstID].value[2]
            )
          )
        ) {
          PropType[ConstID].value[0] = NewColor[0];
          PropType[ConstID].value[1] = NewColor[1];
          PropType[ConstID].value[2] = NewColor[2];
        }
      }
      break;
    case "linear":
      if (Palette.length > 1 && DynID < 0) {
        PropType[ConstID] = JSON.parse(BlankDynamic);
      } else if (Palette.length == 1 && ConstID < 0) {
        PropType[DynID] = JSON.parse(BlankConstant);
      }

      ConstID = PropType.findIndex((item) => item.key.fnv("constantValue"));
      DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));

      if (DynID >= 0) {
        let DynValue = PropType[DynID].value.items;
        let DynTimes = DynValue[0].value.items;
        let DynColors = DynValue[1].value.items;

        for (let i = 0; i < DynTimes.length; i++) {
          let NewColor =
            i > Palette.length - 1
              ? Palette[Palette.length - 1].vec4
              : Palette[i].vec4;
          if (
            !(
              Prefs.IgnoreBW &&
              IsBW(DynColors[i][0], DynColors[i][1], DynColors[i][2])
            )
          ) {
            DynColors[i][0] = NewColor[0];
            DynColors[i][1] = NewColor[1];
            DynColors[i][2] = NewColor[2];
          }
        }
      } else {
        let NewColor = Palette[0].vec4;

        if (
          !(
            Prefs.IgnoreBW &&
            IsBW(
              PropType[ConstID].value[0],
              PropType[ConstID].value[1],
              PropType[ConstID].value[2]
            )
          )
        ) {
          PropType[ConstID].value[0] = NewColor[0];
          PropType[ConstID].value[1] = NewColor[1];
          PropType[ConstID].value[2] = NewColor[2];
          PropType[ConstID].value[3] = NewColor[3];

          ColorProp.value.items = PropType;
        }
      }
      break;
    case "wrap":
      if (Palette.length > 1 && DynID < 0) {
        PropType[ConstID] = JSON.parse(BlankDynamic);
      } else if (Palette.length == 1 && ConstID < 0) {
        PropType[DynID] = JSON.parse(BlankConstant);
      }

      ConstID = PropType.findIndex((item) => item.key.fnv("constantValue"));
      DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));

      if (DynID >= 0) {
        let DynValue = PropType[DynID].value.items;
        let DynTimes = DynValue[0].value.items;
        let TempCount = DynTimes.length;
        let DynColors = DynValue[1].value.items;

        for (let i = 0; i < DynTimes.length; i++) {
          let NewColor = Palette[i % Palette.length].vec4;
          if (
            !(
              Prefs.IgnoreBW &&
              IsBW(DynColors[i][0], DynColors[i][1], DynColors[i][2])
            )
          ) {
            DynColors[i][0] = NewColor[0];
            DynColors[i][1] = NewColor[1];
            DynColors[i][2] = NewColor[2];
          }
        }
      } else {
        let NewColor = Palette[0].vec4;

        if (
          !(
            Prefs.IgnoreBW &&
            IsBW(
              PropType[ConstID].value[0],
              PropType[ConstID].value[1],
              PropType[ConstID].value[2]
            )
          )
        ) {
          PropType[ConstID].value[0] = NewColor[0];
          PropType[ConstID].value[1] = NewColor[1];
          PropType[ConstID].value[2] = NewColor[2];
          PropType[ConstID].value[3] = NewColor[3];

          ColorProp.value.items = PropType;
        }
      }
      break;
    case "semi-override":
      if (Palette.length > 1 && DynID < 0) {
        PropType[ConstID] = JSON.parse(BlankDynamic);
      } else if (Palette.length == 1 && ConstID < 0) {
        PropType[DynID] = JSON.parse(BlankConstant);
      }

      ConstID = PropType.findIndex((item) => item.key.fnv("constantValue"));
      DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));

      if (DynID >= 0) {
        let DynValue = PropType[DynID].value.items;
        let DynTimes = DynValue[0].value.items;
        let DynColors = DynValue[1].value.items;
        for (let i = 0; i < Palette.length; i++) {
          let NewColor = Palette[i].vec4;
          if (DynColors[i] == undefined) {
            DynColors.push([
              NewColor[0],
              NewColor[1],
              NewColor[2],
              Math.sqrt(1 - 4 * ((1 / (Palette.length - 1)) * i - 0.5) ** 2),
            ]);
          } else {
            DynColors[i][0] = NewColor[0];
            DynColors[i][1] = NewColor[1];
            DynColors[i][2] = NewColor[2];
            DynColors[i][3] = Math.sqrt(
              1 - 4 * ((1 / (Palette.length - 1)) * i - 0.5) ** 2
            );
          }
          DynTimes[i] = (1 / (Palette.length - 1)) * i;
        }
      } else {
        let NewColor = Palette[0].vec4;

        if (
          !(
            Prefs.IgnoreBW &&
            IsBW(
              PropType[ConstID].value[0],
              PropType[ConstID].value[1],
              PropType[ConstID].value[2]
            )
          )
        ) {
          PropType[ConstID].value[0] = NewColor[0];
          PropType[ConstID].value[1] = NewColor[1];
          PropType[ConstID].value[2] = NewColor[2];
          PropType[ConstID].value[3] = NewColor[3];

          ColorProp.value.items = PropType;
        }
      }
      break;
    case "inverse":
      ConstID = PropType.findIndex((item) => item.key.fnv("constantValue"));
      DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));

      if (DynID >= 0) {
        let DynValue = PropType[DynID].value.items;
        let DynTimes = DynValue[0].value.items;
        let DynColors = DynValue[1].value.items;

        for (let i = 0; i < DynTimes.length; i++) {
          let NewColor = [
            1 - DynColors[i][0],
            1 - DynColors[i][1],
            1 - DynColors[i][2],
            DynColors[i][3],
          ];
          if (
            !(
              Prefs.IgnoreBW &&
              IsBW(DynColors[i][0], DynColors[i][1], DynColors[i][2])
            )
          ) {
            DynColors[i][0] = NewColor[0];
            DynColors[i][1] = NewColor[1];
            DynColors[i][2] = NewColor[2];
          }
        }
      } else {
        let NewColor = [
          1 - PropType[ConstID].value[0],
          1 - PropType[ConstID].value[1],
          1 - PropType[ConstID].value[2],
          PropType[ConstID].value[3],
        ];

        if (
          !(
            Prefs.IgnoreBW &&
            IsBW(
              PropType[ConstID].value[0],
              PropType[ConstID].value[1],
              PropType[ConstID].value[2]
            )
          )
        ) {
          PropType[ConstID].value[0] = NewColor[0];
          PropType[ConstID].value[1] = NewColor[1];
          PropType[ConstID].value[2] = NewColor[2];
          PropType[ConstID].value[3] = NewColor[3];
        }
      }
      break;
    case "shift":
      ConstID = PropType.findIndex((item) => item.key.fnv("constantValue"));
      DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));

      if (DynID >= 0) {
        let DynValue = PropType[DynID].value.items;
        let DynTimes = DynValue[0].value.items;
        let DynColors = DynValue[1].value.items;

        for (let i = 0; i < DynTimes.length; i++) {
          let NewColor = new ColorHandler(DynColors[i]);
          NewColor.HSLShift(
            HUE.value == "" ? 0 : HUE.value,
            SAT.value == "" ? 0 : SAT.value,
            LIGHT.value == "" ? 0 : LIGHT.value
          );
          NewColor = NewColor.vec4;
          if (
            !(
              Prefs.IgnoreBW &&
              IsBW(DynColors[i][0], DynColors[i][1], DynColors[i][2])
            )
          ) {
            DynColors[i][0] = NewColor[0];
            DynColors[i][1] = NewColor[1];
            DynColors[i][2] = NewColor[2];
          }
        }
      } else {
        let NewColor = new ColorHandler(PropType[ConstID].value);
        NewColor.HSLShift(
          HUE.value == "" ? 0 : HUE.value,
          SAT.value == "" ? 0 : SAT.value,
          LIGHT.value == "" ? 0 : LIGHT.value
        );
        NewColor = NewColor.vec4;

        if (
          !(
            Prefs.IgnoreBW &&
            IsBW(
              PropType[ConstID].value[0],
              PropType[ConstID].value[1],
              PropType[ConstID].value[2]
            )
          )
        ) {
          PropType[ConstID].value[0] = NewColor[0];
          PropType[ConstID].value[1] = NewColor[1];
          PropType[ConstID].value[2] = NewColor[2];
          PropType[ConstID].value[3] = NewColor[3];

          ColorProp.value.items = PropType;
        }
      }
      break;
  }
  return ColorProp;
}

function RecolorSelected() {
  FileSaved = false;
  ipcRenderer.send("PushHistory", ActiveFile);

  let Containers = ActiveFile.entries.value.items;
  let pDom = ParticleList.children;
  let domMid = -1;

  for (let i = 0; i < ParticleList.children.length; i++) {
    if (ParticleList.children[i].getAttribute("type") == "material") domMid = i;
  }
  for (let cid = 0; cid < (domMid >= 0?domMid:pDom.length); cid++) {
    let id = pids[cid];
    let Container = Containers[id];

    let indices = filterIndices(
      Container.value.items,
      (item) =>
        item.key.fnv("complexEmitterDefinitionData") ||
        item.key.fnv("simpleEmitterDefinitionData")
    );

    for (let ddid = 0; ddid < indices?.length; ddid++) {
      let Props = Container.value.items[indices[ddid]].value.items;
      // console.log(Props)
      for (let pid = 0; pid < Props.length; pid++) {
        let PropItems = Props[pid].items;
        domEmitDef = pDom[cid].children[1 + ddid].children[pid].children;
        if (!domEmitDef[0].checked) continue;

        let RDID = PropItems.findIndex((item) =>
          item.key.fnv("reflectionDefinition")
        );
        let RDProp = PropItems[RDID]?.value.items;
        let OFCID = RDProp?.findIndex((item) => item.key.fnv("fresnelColor")); // Outline Fresnel Color
        let RFCID = RDProp?.findIndex((item) =>
          item.key.fnv("reflectionFresnelColor")
        ); // Reflective Fresnel Color
        let LCID = PropItems?.findIndex((item) => item.key.fnv("lingerColor")); // Linger Color
        let BCID = PropItems?.findIndex((item) => item.key.fnv("birthColor")); // Birth Color
        let MCID = PropItems?.findIndex((item) => item.key.fnv("color"));
        if (OFCID >= 0 && T1.checked) {
          RDProp[OFCID] = RecolorProp(RDProp[OFCID], true);
          const OFColor = GetColor(RDProp[OFCID]);
          domEmitDef[2].style.background = ToBG(OFColor);
          domEmitDef[2].onclick = () => {
            Palette = _.cloneDeep(OFColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        if (RFCID >= 0 && T2.checked) {
          RDProp[RFCID] = RecolorProp(RDProp[RFCID], true);
          const RFColor = GetColor(RDProp[RFCID]);
          domEmitDef[3].style.background = ToBG(RFColor);
          domEmitDef[3].onclick = () => {
            Palette = _.cloneDeep(RFColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        breakpoint: if (LCID >= 0 && T3.checked) {
          LDID = emitDef[LCID].value.items.findIndex((item) =>
            item.key.fnv(1803004106)
          );
          if (LDID < 0) break breakpoint;
          PropItems[LCID].value.items[LDID] = RecolorProp(
            PropItems[LCID].value.items[LDID]
          );
          const LCColor = GetColor(
            PropItems[LCID].value.items[LDID].value.items
          );
          domEmitDef[4].style.background = ToBG(LCColor);
          domEmitDef[4].onclick = () => {
            Palette = _.cloneDeep(LCColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        if (BCID >= 0 && T4.checked) {
          PropItems[BCID] = RecolorProp(PropItems[BCID]);
          const BCColor = GetColor(PropItems[BCID].value.items);
          domEmitDef[5].style.background = ToBG(BCColor);
          domEmitDef[5].onclick = () => {
            Palette = _.cloneDeep(BCColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        if (MCID >= 0 && T5.checked) {
          PropItems[MCID] = RecolorProp(PropItems[MCID]);
          const MCColor = GetColor(PropItems[MCID].value.items);
          domEmitDef[6].style.background = ToBG(MCColor);
          domEmitDef[6].onclick = () => {
            Palette = _.cloneDeep(MCColor);
            MapPalette();
            document.getElementById("Slider-Input").value = Palette.length;
          };
        }
        //?
      }
    }
  }
  
  for (let cid = domMid; cid < pDom.length; cid++) {
    if (mids.length == 0) break;
    let id = mids[cid - domMid];
    let Container = Containers[id];
    // continue
    let Params = Container.value.items;

    let pVid = Params.findIndex((item) => item.key.fnv("paramValues"));
    let dMid = Params.findIndex((item) => item.key.fnv("dynamicMaterial"));

    let paramValues = Params[pVid]?.value.items;
    // console.log(paramValues);
    let indices = filterIndices(paramValues, (item) =>
      /Color/i.test(item.items[0].value)
    );
    if (pVid >= 0) {
      for (let ddid = 0; ddid < indices?.length; ddid++) {
        let id = indices[ddid];
        let domEmitDef = pDom[cid].children[1].children[ddid];
        if (!domEmitDef.children[0].checked) continue;
        paramValues[id].items[1] = RecolorProp(paramValues[id].items[1], true);

        domEmitDef.children[2].style = `background: ${ToBG(
          GetColor(paramValues[id].items[1])
        )}; border: none;`;
        domEmitDef.children[2].onclick = () => {
          Palette = _.cloneDeep(GetColor(paramValues[id].items[1]));
          MapPalette();
          document.getElementById("Slider-Input").value = Palette.length;
        };
      }
    }
  }
  ipcRenderer.send("UpdateBin", ActiveFile);
}

function Undo() {
  let response = ipcRenderer.sendSync("PopHistory");

  if (response != 0) {
    ActiveFile = response.File;
  } else {
    return 0;
  }

  LoadFile(true);
  document.getElementById("CheckToggle").checked = false;
  FilterParticles(document.getElementById("Filter").value);
}

async function SaveBin() {
  ipcRenderer.send("SaveBin");
  FileSaved = true;
  // ipcRenderer.send("Message")
}

function SaveSample() {
  Samples.add(_.cloneDeep(Palette));
}

function OpenSampleWindow() {
  Samples.show();
}

ChangeColorCount(2);

let temp = ipcRenderer.sendSync("PullBin");
ActiveFile = temp.File;
if (temp.Path != "") {
  document.getElementById("Title").innerText =
    temp.Path.split(".wad.client\\").pop();
  LoadFile(true);
  // console.log(ActiveFile);
}
