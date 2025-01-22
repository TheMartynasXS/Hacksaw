const {
  Prefs,
  Tab,
  CreateMessage,
  Sleep,
  extendPrototypes,
  filterIndices,
} = require("../javascript/utils.js");
const fs = require("fs");
const { ipcRenderer } = require("electron");
const { execSync } = require("child_process");
const KEYS = require("../javascript/keys.json");
const { ColorHandler, GetColor, ToBG } = require("../javascript/colors.js");
const _ = require("lodash");

window.onerror = function (msg, file, lineNo, columnNo) {
  ipcRenderer.send("Message", {
    type: "error",
    title: file + " @ line: " + lineNo + " col: " + columnNo,
    message: msg,
  });
};
extendPrototypes();

let FilePath;
let ActiveFile;
let Colors;
let AltColors;

let FileSaved = true;

let ColorList = document.getElementById("Target-Container");

async function OpenBin(skip = false) {
  let result = ipcRenderer.sendSync("OpenBin");

  if (result == undefined) {
    return 0;
  }

  document.getElementById("Title").innerText =
    result.Path.split(".wad.client\\").pop();

  ActiveFile = result.File;
  console.log(ActiveFile);
  LoadFile();
}

function LoadFile(SkipAlert = true) {
  Colors = new Set();
  ColorList.innerText = "";
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
    let Container = Containers[pids[cid]];

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

        if (OFCID >= 0) {
          const OFColor = GetColor(RDProp[OFCID]);
          for (let i = 0; i < OFColor.length; i++) {
            Colors.add(OFColor[i].ToHEX());
          }
        }

        if (RFCID >= 0) {
          const RFColor = GetColor(RDProp[RFCID]);
          for (let i = 0; i < RFColor.length; i++) {
            Colors.add(RFColor[i].ToHEX());
          }
        }

        breakpoint: if (LCID >= 0) {
          LDID = PropItems[LCID].value.items.findIndex((item) =>
            item.key.fnv("dynamics")
          );
          if (LDID < 0) break breakpoint;
          let PropType = PropItems[LCID].value.items[LDID];
          let DynID = PrsType.value.items.findIndex((item) =>
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
          for (let i = 0; i < LCColor.length; i++) {
            Colors.add(LCColor[i].ToHEX());
          }
        }

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
          for (let i = 0; i < BCColor.length; i++) {
            Colors.add(BCColor[i].ToHEX());
          }
        }

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
          for (let i = 0; i < MCColor.length; i++) {
            Colors.add(MCColor[i].ToHEX());
          }
        }
      }
    }
  }
  for (let cid = 0; cid < mids.length; cid++) {
    let Container = Containers[mids[cid]];
    let Params = Container.value.items;

    let pVid = Params.findIndex((item) => item.key.fnv("paramValues"));
    let dMid = Params.findIndex((item) => item.key.fnv("dynamicMaterial"));

    if (pVid >= 0) {
      for (let i = 0; i < Params[pVid].value.items.length; i++) {
        if (Params[pVid].value.items[i].items[1] == undefined) continue;
        if (!/Color/i.test(Params[pVid].value.items[i].items[0].value))
          continue;
        const xColor = GetColor(Params[pVid].value.items[i].items[1]);
        for (let i = 0; i < xColor.length; i++) {
          Colors.add(xColor[i].ToHEX());
        }
      }
    }
  }
  
  Colors = Array.from(Colors);


  for (let i = 0; i < Colors.length; i++) {
    let cdiv = document.createElement("div");
    cdiv.classList.add("Input-Group");

    let cinput = document.createElement("input");
    cinput.type = "color";
    cinput.disabled = true;
    cinput.classList.add("Flex-2");
    cinput.value = Colors[i];

    let cmid = document.createElement("img");
    cmid.className = "Flex-1";
    cmid.style.display = "grid";
    cmid.style.placeItems = "center";
    cmid.src = "../css/svg/UI/ArrowRight.svg";

    let coutput = document.createElement("input");
    coutput.type = "color";
    coutput.classList.add("Flex-2");
    coutput.value = Colors[i];

    cdiv.appendChild(cinput);
    cdiv.appendChild(cmid);
    cdiv.appendChild(coutput);
    ColorList.appendChild(cdiv);
  }
}

function SwapColors() {
  AltColors = [];
  for (let i = 0; i < ColorList.children.length; i++) {
    AltColors.push(ColorList.children[i].children[2].value);
  }
  let Containers = ActiveFile.entries.value.items;
  
  pids = filterIndices(Containers, (item) =>
    item.value.name.fnv("VfxSystemDefinitionData")
  );
  mids = filterIndices(Containers, (item) =>
    item.value.name.fnv("StaticMaterialDef")
  );

  for (let cid = 0; cid < pids.length; cid++) {
    let Container = Containers[pids[cid]];
    let indices = filterIndices(
      Container.value.items,
      (item) =>
        item.key.fnv("complexEmitterDefinitionData") ||
        item.key.fnv("simpleEmitterDefinitionData")
    );
    for (let ddid = 0; ddid < indices?.length; ddid++) {
      let Props = Container.value.items[indices[ddid]].value.items;
      for (let pid = 0; pid < Props.length; pid++) {
        let PropItems = Props[pid].items;
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

        if (OFCID >= 0) {
          RDProp[OFCID] = RecolorProp(RDProp[OFCID], true);
        }

        if (RFCID >= 0) {
          RDProp[RFCID] = RecolorProp(RDProp[RFCID], true);
        }

        if (LCID >= 0) {
          let PropType = PropItems[LCID].value.items;
          let DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));
          if (DynID >= 0) {
            let ProbTableID = PropType[DynID].value.items.findIndex((item) =>
              item.key.fnv("probabilityTables")
            );
            if (ProbTableID >= 0) PropType[DynID].value.items.shift();
          }
          PropItems[LCID] = RecolorProp(PropItems[LCID]);
        }

        if (BCID >= 0) {
          let PropType = PropItems[BCID].value.items;
          let DynID = PropType.findIndex((item) => item.key.fnv("dynamics"));
          if (DynID >= 0) {
            let ProbTableID = PropType[DynID].value.items.findIndex((item) =>
              item.key.fnv("probabilityTables")
            );
            if (ProbTableID >= 0) PropType[DynID].value.items.shift();
          }
          PropItems[BCID] = RecolorProp(PropItems[BCID]);
        }

        if (MCID >= 0) {
          let PropType = PropItems[MCID].value.items;
          let DynID = PropType?.findIndex((item) => item.key.fnv("dynamics"));
          if (DynID >= 0) {
            let ProbTableID = PropType[DynID].value.items.findIndex((item) =>
              item.key.fnv("probabilityTables")
            );
            if (ProbTableID >= 0) PropType[DynID].value.items.shift();
          }
          PropItems[MCID] = RecolorProp(PropItems[MCID]);
        }
      }
    }
  }
  for (let cid = 0; cid < mids.length; cid++) {
    if (mids.length == 0) break;
    let Container = Containers[mids[cid]];
    // continue
    let Params = Container.value.items;

    let pVid = Params.findIndex((item) => item.key.fnv("paramValues"));
    let dMid = Params.findIndex((item) => item.key.fnv("dynamicMaterial"));

    let paramValues = Params[pVid]?.value.items;
    console.log(paramValues);
    let indices = filterIndices(paramValues, (item) =>
      /Color/i.test(item.items[0].value)
    );
    if (pVid >= 0) {
      for (let ddid = 0; ddid < indices?.length; ddid++) {
        let id = indices[ddid];
        paramValues[id].items[1] = RecolorProp(paramValues[id].items[1], true);
      }
    }
  }
  ipcRenderer.send("UpdateBin", ActiveFile);
  LoadFile();
}

function RecolorProp(ColorProp, ConstOnly = false) {
  if (ConstOnly) {
    let NewColor = new ColorHandler([
      ColorProp.value[0],
      ColorProp.value[1],
      ColorProp.value[2],
      1,
    ]);

    let index = Colors.findIndex((item) => item == NewColor.ToHEX());
    if (index < 0) return ColorProp;
    NewColor.InputHex(AltColors[index]);

    ColorProp.value[0] = NewColor.vec4[0];
    ColorProp.value[1] = NewColor.vec4[1];
    ColorProp.value[2] = NewColor.vec4[2];
    return ColorProp;
  }
  let PropType = ColorProp.value.items;
  let ConstID = PropType?.findIndex((item) => item.key.fnv("constantValue"));
  let DynID = PropType?.findIndex((item) => item.key.fnv("dynamics"));

  if (DynID >= 0) {
    let DynValue = PropType[DynID].value.items;
    let DynColors = DynValue[1].value.items;

    for (let i = 0; i < DynColors.length; i++) {
      let NewColor = new ColorHandler([
        DynColors[i][0],
        DynColors[i][1],
        DynColors[i][2],
        1,
      ]);
      let index = Colors.findIndex((item) => item == NewColor.ToHEX());
      if (index < 0) continue;
      NewColor.InputHex(AltColors[index]);

      DynColors[i][0] = NewColor.vec4[0];
      DynColors[i][1] = NewColor.vec4[1];
      DynColors[i][2] = NewColor.vec4[2];
    }
  } else if (ConstID >= 0) {
    let NewColor = new ColorHandler([
      PropType[ConstID].value[0],
      PropType[ConstID].value[1],
      PropType[ConstID].value[2],
      1,
    ]);
    let index = Colors.findIndex((item) => item == NewColor.ToHEX());
    if (index < 0) return ColorProp;
    NewColor.InputHex(AltColors[index]);
    PropType[ConstID].value[0] = NewColor.vec4[0];
    PropType[ConstID].value[1] = NewColor.vec4[1];
    PropType[ConstID].value[2] = NewColor.vec4[2];
  }
  return ColorProp;
}

async function Save() {
  ipcRenderer.send("SaveBin");
  FileSaved = true;
}

let temp = ipcRenderer.sendSync("PullBin");
ActiveFile = temp.File;
if (temp.Path != "") {
  document.getElementById("Title").innerText =
    temp.Path.split(".wad.client\\").pop();
  LoadFile(true);
}
