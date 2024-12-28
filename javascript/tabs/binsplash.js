const { ipcRenderer, ipcMain } = require("electron");

const {
  Tab,
  Prefs,
  Samples,
  CreateMessage,
  Sleep,
  extendPrototypes,
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

let T1 = document.getElementById("T1");
let T2 = document.getElementById("T2");
let T3 = document.getElementById("T3");
let T4 = document.getElementById("T4");
let T5 = document.getElementById("T5");

let HUE = document.getElementById("Hue");
let SAT = document.getElementById("Sat");
let LIGHT = document.getElementById("Light");

T1.checked = Prefs.obj.Targets[0];
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
function ClickColor(element) {
  if (element.style.background == "") {
    return;
  }
  let colorType = element.getAttribute("color-type");

  let emitterName = element.parentNode.children[1].innerText;
  let elementId = element.parentNode.parentNode.parentNode.id;
  let defId = element.parentNode.parentNode.getAttribute("def-id");
  let Containers = getContainers(ActiveFile).find((item) =>
    item.key.fnv(elementId)
  ).value.items[defId].value.items;
  let Container = Containers.find((item) =>
    item.items
      .find((item) => item.key.fnv("emitterName"))
      .value.fnv(emitterName)
  );
  let active;

  switch (colorType) {
    case "linger":
      active = Container.items
        .find((item) => item.key.fnv(colorType))
        ?.value.items.find((item) => item.key.fnv("SeparateLingerColor"))
        ?.value.items;
      Palette = GetColor(active);
      break;
    case "fresnelColor":
    case "reflectionFresnelColor":
      let fresnel = Container.items.find((item) =>
        item.key.fnv("reflectionDefinition")
      )?.value.items;
      active = fresnel?.find((item) => item.key.fnv(colorType));
      Palette = GetColor(active);
      break;
    default:
      active = Container.items.find((item) => item.key.fnv(colorType)).value
        .items;
      Palette = GetColor(active);
  }

  MapPalette();
}

function ClickMaterial(element) {
  let materialName = element.parentNode.parentNode.parentNode.id;
  let Container = getContainers(ActiveFile).find((item) =>
    item.key.fnv(materialName)
  ).value.items;
  let paramName = element.parentNode.children[1].innerText;
  let param = Container.find((item) =>
    item.key.fnv("paramValues")
  ).value.items.find((item) => item.items[0].value.fnv(paramName)).items[1];

  Palette = GetColor(param);
  MapPalette();
}

function EmitterDom(Emitters) {
  let nodes = [];
  Emitters.map((Emitter) => {
    let emitter_object = document
      .getElementsByTagName("template")[1]
      .content.cloneNode(true).firstElementChild;

    let name =
      Emitter.items.find((item) => item.key.fnv("emitterName"))?.value ??
      `unknown ${nodes.length + 1}`;
    let blendMode = Emitter.items.find((item) =>
      item.key.fnv("blendMode")
    )?.value;
    let disabled = Emitter.items.find((item) =>
      item.key.fnv("disabled")
    )?.value;
    let color = Emitter.items.find((item) => item.key.fnv("color"))?.value
      .items;
    let birthColor = Emitter.items.find((item) => item.key.fnv("birthColor"))
      ?.value.items;
    let lingerColor = Emitter.items
      .find((item) => item.key.fnv("linger"))
      ?.value.items.find((item) => item.key.fnv("SeparateLingerColor"))
      ?.value.items;

    let fresnel = Emitter.items.find((item) =>
      item.key.fnv("reflectionDefinition")
    )?.value.items;

    let outline = fresnel?.find((item) => item.key.fnv("fresnelColor"));
    let reflect = fresnel?.find((item) =>
      item.key.fnv("reflectionFresnelColor")
    );

    emitter_object.children[1].innerText = name;

    // emitter_object.children[6].style = `background: ${ToBG(GetColor(color))}`
    emitter_object.children[7].placeholder = blendMode;
    emitter_object.children[8].enabled = !disabled;

    if (blendMode == undefined)
      emitter_object.children[7].style.visibility = "hidden";
    nodes.push(emitter_object);
    if (color != undefined)
      emitter_object.children[6].style = `background: ${ToBG(
        GetColor(color)
      )}; border: none;`;
    if (birthColor != undefined)
      emitter_object.children[5].style = `background: ${ToBG(
        GetColor(birthColor)
      )}; border: none;`;
    if (lingerColor != undefined)
      emitter_object.children[4].style = `background: ${ToBG(
        GetColor(lingerColor)
      )}; border: none;`;
    if (reflect != undefined)
      emitter_object.children[3].style = `background: ${ToBG(
        GetColor(reflect)
      )}; border: none;`;
    if (outline != undefined)
      emitter_object.children[2].style = `background: ${ToBG(
        GetColor(outline)
      )}; border: none;`;
  });
  return nodes;
}
function MaterialParamDom(Params) {
  let nodes = [];
  let pVid = Params.findIndex((item) => item.key.fnv("paramValues"));
  let dMid = Params.findIndex((item) => item.key.fnv("dynamicMaterial"));

  if (pVid >= 0) {
    // console.log(Params[pVid].value.items);
    for (let i = 0; i < Params[pVid].value.items.length; i++) {
      if (Params[pVid].value.items[i].items[1] == undefined) continue;

      if (!/Color/i.test(Params[pVid].value.items[i].items[0].value)) continue;

      // console.log(`${Params[pVid].value.items[i].items[0].value}`);
      // console.log(Params[pVid].value.items[i]);
      let param_object = document
        .getElementsByTagName("template")[2]
        .content.cloneNode(true).firstElementChild;
      param_object.children[1].innerText =
        Params[pVid].value.items[i].items[0].value;
      param_object.children[2].style = `background: ${ToBG(
        GetColor(Params[pVid].value.items[i].items[1])
      )}; border: none;`;
      nodes.push(param_object);
    }
    // Params[pVid].value.items.map((item) => {
    //   let param_object = document
    //     .getElementsByTagName("template")[2]
    //     .content.cloneNode(true).firstElementChild;
    //   param_object.children[1].innerText = item.name;
    //   nodes.push(param_object);
    // });
  }
  if (dMid >= 0) {
    let x = nodes.find(
      (item) =>
        item.children[1].innerText ==
        Params[dMid].value.items[0].value.items[0].items[0].value
    );
    console.log(Params[dMid]);
    // if (x != undefined) {
    //   console.log(Params[dMid].value.items[0].value.items[0].items[0].value);
    //   console.log(nodes);
    //   console.log(x.children[3]);
    //   console.log(Params[dMid].value.items[0].value.items[0].items[1].value.items);
    // }
    // let x = Params[pVid].value.items.find((item) => {
    //   return (
    //     item.items[0].value ==
    //     Params[dMid].value.items[0].value.items[0].items[0].value
    //   );
    // })
    // console.log(x.items)
  }
  // if (pVid >= 0 && dMid >= 0) {
  //   console.log(
  //     `${Params[pVid].value.items.length} == ${Params[dMid].value.items[0].value.items.length}`
  //   );
  //   console.log(
  //     Params[pVid].value.items.length ==
  //       Params[dMid].value.items[0].value.items.length
  //   );
  // }
  // nodes += param_object;
  return nodes;
}

function ParticleDom(containers) {
  let nodes = [];
  containers.forEach((Container) => {
    node = document
      .getElementsByTagName("template")[0]
      .content.cloneNode(true).firstElementChild;
    if (Container.value?.name.fnv("VfxSystemDefinitionData")) {
      node.children[0].children[1].innerText =
        Container.value.items.find((item) => item.key.fnv("particleName"))
          ?.value ?? `unknown ${nodes.length + 1}`;
      node.id = Container.key;
      nodes.push(node);
      let defId = Container.value.items.findIndex(
        (item) => item.type == "list"
      );
      Container.value.items
        .filter((item) => item.value.valueType == "pointer")
        .map((item) => {
          let DefDataDiv = document.createElement("div");
          DefDataDiv.className = "DefDataDiv";
          DefDataDiv.setAttribute("def-id", defId++);
          node.append(DefDataDiv);
          DefDataDiv.append(...EmitterDom(item.value.items));
        });
      node.hidden = false;
    } else if (Container.value?.name.fnv("StaticMaterialDef")) {
      node.children[0].children[1].innerText =
        Container.value.items.find((item) => item.key.fnv("name"))?.value ??
        `unknown ${nodes.length + 1}`;
      node.id = Container.key;

      let DefDataDiv = document.createElement("div");
      DefDataDiv.className = "DefDataDiv";
      node.append(DefDataDiv);

      DefDataDiv.append(...MaterialParamDom(Container.value.items));

      nodes.push(node);
    } else {
      node.id = Container.key;
      nodes.push(node);
      node.hidden = true;
    }
  });
  return nodes;
}

function LoadFile(SkipAlert = true) {
  ParticleList.innerText = "";
  let Relative = "";
  for (let i = 0; i < ActiveFile.linked.value.items.length; i++) {
    Relative += `${ActiveFile.linked.value.items[i]}\n`;
  }
  let Container = ActiveFile.entries.value.items;

  let Containers = getContainers(ActiveFile);
  ParticleList.append(...ParticleDom(Container));
}

class Container {
  constructor(item) {
    this.key = item.key;
    this.value = item.value;
  }
  toJSON() {
    return {
      key: this.key,
      value: this.value,
    };
  }
}

function getContainers(bin) {
  return bin.entries.value.items;
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
function ChildrenChecked(Dom) {
  for (let i = 1; i < Dom.children[0]?.children.length; i++) {
    for (let j = 0; j < Dom.children[i]?.children.length; j++) {
      if (Dom.children[i].children[j].children[0].checked) {
        return true;
      }
    }
  }
  return false;
}

function IsBW(A, B, C) {
  return A == B && B == C ? A == 0 || A == 1 : false;
}

function RecolorProp(ColorProp, ConstOnly = false) {
  console.log(ColorProp);
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

  let Container = ActiveFile.entries.value.items;
  let Pdom = ParticleList.children;
  for (let pid = 0; pid < Container.length; pid++) {
    if (
      !Pdom[pid].children[0].children[0].checked &&
      !ChildrenChecked(Pdom[pid])
    )
      continue;
    // console.log(Pdom[pid]);
    // console.log(Container[pid].value.items);

    let DefData = Container[pid].value.items;
    let DomDefData = ParticleList.children[pid].children;
    if (Container[pid].value.name.fnv("VfxSystemDefinitionData")) {
      for (let did = 1; did < DomDefData.length; did++) {
        let bdid = did - 1;
        for (let eid = 0; eid < DomDefData[did].children.length; eid++) {
          let domEmitDef = DomDefData[did].children[eid].children;
          let emitDef = DefData[bdid].value.items[eid].items;
          if (!domEmitDef[0].checked) continue;
          let RDID = emitDef.findIndex((item) =>
            item.key.fnv("reflectionDefinition")
          );
          let RDProp = emitDef[RDID]?.value.items;
          let OFCID = RDProp?.findIndex((item) => item.key.fnv("fresnelColor")); // Outline Fresnel Color
          let RFCID = RDProp?.findIndex((item) =>
            item.key.fnv("reflectionFresnelColor")
          ); // Reflective Fresnel Color
          let LCID = emitDef?.findIndex((item) => item.key.fnv("lingerColor")); // Linger Color
          let BCID = emitDef?.findIndex((item) => item.key.fnv("birthColor")); // Birth Color
          let MCID = emitDef?.findIndex((item) => item.key.fnv("color"));
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
            emitDef[LCID].value.items[LDID] = RecolorProp(
              emitDef[LCID].value.items[LDID]
            );
            const LCColor = GetColor(
              emitDef[LCID].value.items[LDID].value.items
            );
            domEmitDef[4].style.background = ToBG(LCColor);
            domEmitDef[4].onclick = () => {
              Palette = _.cloneDeep(LCColor);
              MapPalette();
              document.getElementById("Slider-Input").value = Palette.length;
            };
          }
          if (BCID >= 0 && T4.checked) {
            emitDef[BCID] = RecolorProp(emitDef[BCID]);
            const BCColor = GetColor(emitDef[BCID].value.items);
            domEmitDef[5].style.background = ToBG(BCColor);
            domEmitDef[5].onclick = () => {
              Palette = _.cloneDeep(BCColor);
              MapPalette();
              document.getElementById("Slider-Input").value = Palette.length;
            };
          }
          if (MCID >= 0 && T5.checked) {
            emitDef[MCID] = RecolorProp(emitDef[MCID]);
            const MCColor = GetColor(emitDef[MCID].value.items);
            domEmitDef[6].style.background = ToBG(MCColor);
            domEmitDef[6].onclick = () => {
              Palette = _.cloneDeep(MCColor);
              MapPalette();
              document.getElementById("Slider-Input").value = Palette.length;
            };
          }
        }
      }
    } else if (Container[pid].value.name.fnv("StaticMaterialDef")) {
      console.log(DomDefData);
      console.log(DefData);
      let paramIndex = DefData.findIndex((item) => item.key.fnv("paramValues"));

      console.log(paramIndex);

      for (let i = 0; i < DomDefData[1].children.length; i++) {
        if (!DomDefData[1].children[i].children[0].checked) continue;
        console.log(DomDefData[1].children[i].children[1]);
        let valueIndex = DefData[paramIndex].value.items.findIndex((item) =>
          item.items[0].value.fnv(
            DomDefData[1].children[i].children[1].innerText
          )
        );
        DefData[paramIndex].value.items[valueIndex].items[1] = RecolorProp(
          DefData[paramIndex].value.items[valueIndex].items[1],
          true
        );
        DomDefData[1].children[i].children[2].style.background = ToBG(
          GetColor(DefData[paramIndex].value.items[valueIndex].items[1])
        )
      }
    } else {
    }
  }

  ipcRenderer.send("UpdateBin", ActiveFile);
}

function Undo() {
  let response = ipcRenderer.sendSync("PopHistory");

  if (response != 0) {
    ActiveFile = response.File;
  }else{
    return 0;
  }

  LoadFile(true);
  document.getElementById("CheckToggle").checked = false;
  FilterParticles(document.getElementById("Filter").value);
}

async function SaveBin() {
  ipcRenderer.send("SaveBin");
  FileSaved = true;
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
