const { Prefs, Tab, CreateMessage, Sleep } = require('../javascript/utils.js');
const fs = require('fs')
const { ipcRenderer } = require('electron');
const { execSync } = require("child_process");
const KEYS = require('../javascript/keys.json');
const { ColorHandler, GetColor, ToBG } = require('../javascript/colors.js');
const _ = require('lodash')

window.onerror = function (msg, file, lineNo, columnNo) {
    ipcRenderer.send("Message", {
        type: "error",
        title: file + " @ line: " + lineNo + " col: " + columnNo,
        message: msg
    })
};
let FilePath
let File
let Colors
let AltColors

let FileSaved = true;

let ColorList = document.getElementById("Target-Container")

async function OpenBin(skip = false) {
    if (FileSaved != true) {
        CreateMessage({
            type: "warning",
            buttons: ["Open Bin", "Cancel"],
            title: "File not saved",
            message: "You may have forgotten to save your bin.\nSave before proceeding please."
        }, async () => { FileSaved = true; await OpenBin() })
        FileSaved = true;
        return 0;
    }
    if (!skip) {
        FilePath = ipcRenderer.sendSync("FileSelect", [
            "Select Bin to edit",
            "Bin",
        ]);
    }

    if (FilePath == undefined) {
        return 0;
    }
    if (fs.existsSync(FilePath.slice(0, -4) + ".json") == false || Prefs.Regenerate) {
        await ToJson();
    }

    File = JSON.parse(fs.readFileSync(FilePath.slice(0, -4) + ".json", "utf-8"))

    LoadFile();
}

function LoadFile(SkipAlert = true) {
    Colors = new Set()
    ColorList.innerText = "";
    let Relative = ""
    for (let i = 0; i < File.linked.value.items.length; i++) {
        Relative += `${File.linked.value.items[i]}\n`
    }
    let Container = File.entries.value.items;
    if (!/(122655197|Materials)/i.test(JSON.stringify(Container))) {
        CreateMessage({
            type: "warning",
            title: "warning",
            message: `No color values found\nCheck other bins.\n${Relative}`
        })
        return 0;
    }
    for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
        if (Container[PO_ID].value.name == KEYS.Definitions.vfx) {
            let DefData = Container[PO_ID].value.items.filter(
                (item) =>
                    item.key == KEYS.Definitions.complex ||
                    item.key == KEYS.Definitions.simple
            );
            for (let B = 0; B < DefData.length; B++) {
                if (
                    DefData[B].key == KEYS.Definitions.complex ||
                    DefData[B].key == KEYS.Definitions.simple
                ) {
                    let Props = DefData[B].value.items;
                    for (let C = 0; C < Props.length; C++) {
                        let PropItems = Props[C].items


                        let RDID = PropItems?.findIndex(item => item.key == KEYS.Definitions.reflection)
                        let RDProp = PropItems[RDID]?.value.items

                        let OFCID = RDProp?.findIndex(item => item.key == KEYS.Props.fresnelColor)           // Outline Fresnel Color
                        let RFCID = RDProp?.findIndex(item => item.key == KEYS.Props.reflectionColor) // Reflective Fresnel Color
                        let LCID = PropItems?.findIndex(item => item.key == KEYS.Props.lingerColor)			// Linger Color
                        let BCID = PropItems?.findIndex(item => item.key == KEYS.Props.birthColor)			// Birth Color
                        let MCID = PropItems?.findIndex(item => item.key == KEYS.Props.color)				// Main Color

                        if (OFCID >= 0) {
                            const OFColor = GetColor(RDProp[OFCID])
                            for (let i = 0; i < OFColor.length; i++) {
                                Colors.add(OFColor[i].ToHEX())
                            }
                        }

                        if (RFCID >= 0) {
                            const RFColor = GetColor(RDProp[RFCID])
                            for (let i = 0; i < RFColor.length; i++) {
                                Colors.add(RFColor[i].ToHEX())
                            }
                        }
                        if (LCID >= 0) {
                            LDID = PropItems[LCID].value.items.findIndex(item => item.key == KEYS.Props.lingerDriver)

                            let PropType = PropItems[LCID].value.items[LDID]
                            let DynID = PropType?.value.items.findIndex(item => item.key == KEYS.Definitions.dynamics)
                            if (DynID >= 0) {
                                let ProbTableID = PropType.value.items[DynID].value.items.findIndex(item => item.key == KEYS.Definitions.probability)
                                if (ProbTableID >= 0) PropType.value.items[DynID].value.items.shift()
                            }
                            const LCColor = GetColor(PropItems[LCID]?.value.items[LDID]?.value.items)
                            for (let i = 0; i < LCColor.length; i++) {
                                Colors.add(LCColor[i].ToHEX())
                            }
                        }
                        if (BCID >= 0) {
                            let PropType = PropItems[BCID].value.items
                            let DynID = PropType.findIndex(item => item.key == KEYS.Definitions.dynamics)
                            if (DynID >= 0) {
                                let ProbTableID = PropType[DynID].value.items.findIndex(item => item.key == KEYS.Definitions.probability)
                                if (ProbTableID >= 0) PropType[DynID].value.items.shift()
                            }
                            const BCColor = GetColor(PropItems[BCID].value.items)
                            for (let i = 0; i < BCColor.length; i++) {
                                Colors.add(BCColor[i].ToHEX())
                            }
                        }

                        if (MCID >= 0) {
                            let PropType = PropItems[MCID].value.items
                            let DynID = PropType?.findIndex(item => item.key == KEYS.Definitions.dynamics)
                            if (DynID >= 0) {
                                let ProbTableID = PropType[DynID].value.items.findIndex(item => item.key == KEYS.Definitions.probability)
                                if (ProbTableID >= 0) PropType[DynID].value.items.shift()
                            }
                            const MCColor = GetColor(PropItems[MCID].value.items)
                            for (let i = 0; i < MCColor.length; i++) {
                                Colors.add(MCColor[i].ToHEX())
                            }
                        }

                    }
                }
            }
        }
    }
    Colors = Array.from(Colors)


    for (let i = 0; i < Colors.length; i++) {
        let cdiv = document.createElement('div')
        cdiv.classList.add("Input-Group")

        let cinput = document.createElement('input')
        cinput.type = "color"
        cinput.disabled = true
        cinput.classList.add("Flex-2")
        cinput.value = Colors[i]

        let cmid = document.createElement('img')
        cmid.className = "Flex-1"
        cmid.style.display = "grid"
        cmid.style.placeItems = "center"
        cmid.src = "../css/svg/ArrowRight.svg"

        let coutput = document.createElement('input')
        coutput.type = "color"
        coutput.classList.add("Flex-2")
        coutput.value = Colors[i]

        cdiv.appendChild(cinput)
        cdiv.appendChild(cmid)
        cdiv.appendChild(coutput)
        ColorList.appendChild(cdiv)
    }
}

async function ToJson() {
    await Sleep(100)
    execSync(`"${Prefs.obj.RitoBinPath}" -o json "${FilePath}" -k`);
}

function SwapColors() {
    AltColors = []
    for (let i = 0; i < ColorList.children.length; i++) {
        AltColors.push(ColorList.children[i].children[2].value)
    }
    let Container = File.entries.value.items
    for (let PO_ID = 0; PO_ID < Container.length; PO_ID++) {
        if (Container[PO_ID].value.name == KEYS.Definitions.vfx) {

            let DefData = Container[PO_ID].value.items
            for (let B = 0; B < DefData.length; B++) {
                if (
                    DefData[B].key == KEYS.Definitions.complex ||
                    DefData[B].key == KEYS.Definitions.simple
                ) {
                    let Props = DefData[B].value.items;
                    for (let C = 0; C < Props.length; C++) {
                        let PropItems = Props[C].items
                        let RDID = PropItems?.findIndex(item => item.key == KEYS.Definitions.reflection)
                        let RDProp = PropItems[RDID]?.value.items

                        let OFCID = RDProp?.findIndex(item => item.key == KEYS.Props.fresnelColor)           // Outline Fresnel Color
                        let RFCID = RDProp?.findIndex(item => item.key == KEYS.Props.reflectionColor) // Reflective Fresnel Color
                        let LCID = PropItems?.findIndex(item => item.key == KEYS.Props.lingerColor)			// Linger Color
                        let BCID = PropItems?.findIndex(item => item.key == KEYS.Props.birthColor)			// Birth Color
                        let MCID = PropItems?.findIndex(item => item.key == KEYS.Props.color)				// Main Color

                        if (OFCID >= 0) {
                            RDProp[OFCID] = RecolorProp(RDProp[OFCID], true)
                        }

                        if (RFCID >= 0) {
                            RDProp[RFCID] = RecolorProp(RDProp[RFCID], true)
                        }
                        breakpoint: if (LCID >= 0) {
                            LDID = PropItems[LCID].value.items.findIndex(item => item.key == KEYS.Props.lingerDriver)
                            if (LDID < 0) break breakpoint;
                            let PropType = PropItems[LCID].value.items[LDID]
                            let DynID = PropType?.value.items.findIndex(item => item.key == KEYS.Definitions.dynamics)
                            if (DynID >= 0) {
                                let ProbTableID = PropType.value.items[DynID].value.items.findIndex(item => item.key == KEYS.Definitions.probability)
                                if (ProbTableID >= 0) PropType.value.items[DynID].value.items.shift()
                            }
                            PropItems[LCID].value.items[LDID] = RecolorProp(PropItems[LCID].value.items[LDID])
                        }
                        if (BCID >= 0) {
                            let PropType = PropItems[BCID].value.items
                            let DynID = PropType.findIndex(item => item.key == KEYS.Definitions.dynamics)
                            if (DynID >= 0) {
                                let ProbTableID = PropType[DynID].value.items.findIndex(item => item.key == KEYS.Definitions.probability)
                                if (ProbTableID >= 0) PropType[DynID].value.items.shift()
                            }
                            PropItems[BCID] = RecolorProp(PropItems[BCID])
                        }

                        if (MCID >= 0) {
                            let PropType = PropItems[MCID].value.items
                            let DynID = PropType?.findIndex(item => item.key == KEYS.Definitions.dynamics)
                            if (DynID >= 0) {
                                let ProbTableID = PropType[DynID].value.items.findIndex(item => item.key == KEYS.Definitions.probability)
                                if (ProbTableID >= 0) PropType[DynID].value.items.shift()
                            }
                            PropItems[MCID] = RecolorProp(PropItems[MCID])
                        }

                    }
                }
            }
        }
    }
    LoadFile()
}


function RecolorProp(ColorProp, ConstOnly = false) {
    if (ConstOnly) {
        let NewColor = new ColorHandler([ColorProp.value[0], ColorProp.value[1], ColorProp.value[2], 1])

        let index = Colors.findIndex(item => item == NewColor.ToHEX())
        if (index < 0) return ColorProp;
        NewColor.InputHex(AltColors[index])

        ColorProp.value[0] = NewColor.vec4[0]
        ColorProp.value[1] = NewColor.vec4[1]
        ColorProp.value[2] = NewColor.vec4[2]
        return ColorProp
    }
    let PropType = ColorProp.value.items
    let ConstID = PropType?.findIndex(item => item.key == KEYS.Definitions.constant)
    let DynID = PropType?.findIndex(item => item.key == KEYS.Definitions.dynamics)

    if (DynID >= 0) {
        let DynValue = PropType[DynID].value.items
        let DynColors = DynValue[1].value.items

        for (let i = 0; i < DynColors.length; i++) {
            let NewColor = new ColorHandler([DynColors[i][0], DynColors[i][1], DynColors[i][2], 1])
            let index = Colors.findIndex(item => item == NewColor.ToHEX())
            if (index < 0) continue;
            NewColor.InputHex(AltColors[index])

            DynColors[i][0] = NewColor.vec4[0]
            DynColors[i][1] = NewColor.vec4[1]
            DynColors[i][2] = NewColor.vec4[2]
        }

    } else if (ConstID >= 0) {
        let NewColor = new ColorHandler([PropType[ConstID].value[0], PropType[ConstID].value[1], PropType[ConstID].value[2], 1])
        let index = Colors.findIndex(item => item == NewColor.ToHEX())
        if (index < 0) return ColorProp;
        NewColor.InputHex(AltColors[index])
        PropType[ConstID].value[0] = NewColor.vec4[0]
        PropType[ConstID].value[1] = NewColor.vec4[1]
        PropType[ConstID].value[2] = NewColor.vec4[2]

    }
    return ColorProp
}

async function ToBin() {
    await Sleep(100)
    try {
        let res = execSync(
            `"${Prefs.obj.RitoBinPath}" -o bin "${FilePath.slice(0, -4) + ".json"}"`
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
async function Save() {
    fs.writeFileSync(
        FilePath.slice(0, -4) + ".json",
        JSON.stringify(File, null, 2),
        "utf8"
    );
    await ToBin();
    FileSaved = true;
}
