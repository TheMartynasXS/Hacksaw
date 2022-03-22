const BinList = document.getElementById("Bin-List")

const { execSync, exec } = require('child_process')
const sorter = require('path-sort').standalone('/')

let ParticleArray = []

let Files2Delete = []

let WadFolderPath = ""
let ParticleTargetPath = ""

async function SelectWadFolder() {
    WadFolderPath = ipcRenderer.sendSync('FileSelect', ['Select wad folder', 'Folder'])[0]
    if (WadFolderPath == "") { return 0 }

    let arrayOfFiles = []
    let Files = getAllFiles(WadFolderPath, arrayOfFiles).filter(item => !/(Combined.json|Separate.json|Missing.json)/g.test(item.toLowerCase()))
    let Progress = document.getElementById('Progress-Range')
    Progress.classList.remove('Progress-Complete')

    let BinFiles = Files.filter(item => item.endsWith('.bin'))

    let BinCount = document.getElementById('Bin-Count')
    BinCount.innerText = `0/${BinFiles.length}`
    if(BinFiles.length == 0){
        UTIL.CreateAlert("Error",`Bins not found`)
        return 0
    }
    Progress.max = BinFiles.length

    let CombinedOutput = []
    let SeparateOutput = []
    let MissingOutput = []

    for (let i = 0; i < BinFiles.length; i++) {
        if (fs.existsSync(BinFiles[i].slice(0, -4) + ".json") == false) {
            execSync(`"${Prefs.RitoBinPath}" -o json "${BinFiles[i]}"`)
        }

        let tempfile = UTIL.Clone(fs.readFileSync(BinFiles[i].slice(0, -4) + ".json", 'utf-8'))
        let ParticleObject = tempfile.entries.value.items

        let RegStr = new RegExp(/ASSETS.+\.(?:dds|skn|skl|sco|scb|anm)/gi)

        let Matches = JSON.stringify(tempfile, null, 2).match(RegStr)
        if (Matches != undefined) {

            for (let j = 0; j < Matches.length; j++) {
                if (!CombinedOutput.includes(Matches[j].toLowerCase())) {
                    CombinedOutput.push(Matches[j].toLowerCase())
                }
            }
        }

        for (let PO_ID = 0; PO_ID < ParticleObject.length; PO_ID++) {
            if (ParticleObject[PO_ID].value.name == "VfxSystemDefinitionData") {
                let tempname = ParticleObject[PO_ID].value.items.find((item) => {
                    if (item.key == "particleName") { return item }
                }).value
                SeparateOutput.push({
                    BinFile: BinFiles[i],
                    Particle: tempname,
                    Files: []
                })
                let DefData = ParticleObject[PO_ID].value.items.filter(item => item.key == "complexEmitterDefinitionData" || item.key == "simpleEmitterDefinitionData")
                for (let B = 0; B < DefData.length; B++) {
                    let Props = DefData[B].value.items
                    for (let C = 0; C < Props.length; C++) {
                        if (DefData[B].key == "complexEmitterDefinitionData" || DefData[B].key == "simpleEmitterDefinitionData") {
                            let StringObj = JSON.stringify(DefData[B], null, 2)

                            Matches = StringObj.match(RegStr)

                            Matches?.forEach(Match => {
                                if (!SeparateOutput[SeparateOutput.length - 1].Files.includes(Match.toLowerCase())) {
                                    SeparateOutput[SeparateOutput.length - 1].Files.push(Match.toLowerCase())
                                }
                            })
                        }
                    }
                }
            }
        }

        await UTIL.Sleep(10)
        Progress.value = i + 1
        BinCount.innerText = `${Progress.value}/${Progress.max}`
    }
    let AssetFiles =
        Files.filter(item => /(particles|shared)/g.test(item.toLowerCase()))
            .filter(item => /\.(?:dds|skn|skl|sco|scb|anm)/gi.test(item.toLowerCase()))

    for (let i = 0; i < CombinedOutput.length; i++) {
        if (!/(particles|shared)/gi.test(CombinedOutput[i])) {
            continue
        } {

            for (let j = 0; j < AssetFiles.length; j++)
                if (CombinedOutput[i].toLowerCase().replace(/\//g, '\\') == AssetFiles[j].slice(WadFolderPath.length + 1)) {
                    break
                }
                else if (j == AssetFiles.length - 1) {
                    MissingOutput.push(CombinedOutput[i])
                }
        }
    }
    CombinedOutput.sort(sorter)
    let SortedCombinedOutput = []
    function deasset(input) {
        let temp = input.split('/')
        temp.pop()
        return temp.join('/')
    }
    for (let i = 0; i < CombinedOutput.length; i++) {
        if (SortedCombinedOutput.some(item => item.Location ==
            deasset(CombinedOutput[i])) != false) {
            SortedCombinedOutput[SortedCombinedOutput.findIndex(item => item.Location ==
                deasset(CombinedOutput[i]))].Files.push(CombinedOutput[i])
        }
        else {
            let temp = CombinedOutput[i].split('/')
            temp.pop()
            temp = temp.join('/')
            SortedCombinedOutput.push({ Location: temp, Files: [CombinedOutput[i]] })
        }
    }

    fs.writeFileSync(WadFolderPath + '\\Combined.json', JSON.stringify(SortedCombinedOutput, null, 2), "utf8")

    SeparateOutput.sort((a, b) => (a.Particle > b.Particle) ? 1 : ((b.Particle > a.Particle) ? -1 : 0))

    for (let i = 0; i < SeparateOutput.length; i++) {
        SeparateOutput[i].Files.sort(sorter)
    }

    fs.writeFileSync(WadFolderPath + '\\Separate.json', JSON.stringify(SeparateOutput, null, 2), "utf8")

    MissingOutput.sort((a, b) => (a > b) ? 1 : ((b > a) ? -1 : 0))

    fs.writeFileSync(WadFolderPath + '\\Missing.json', JSON.stringify(MissingOutput, null, 2), "utf8")

    Progress.classList.add('Progress-Complete')
    DetectUnused()
}
async function DetectUnused() {
    Files2Delete = []
    BinList.innertext = ''
    let arrayOfFiles = []
    let Files = getAllFiles(WadFolderPath, arrayOfFiles)

    let Combined = UTIL.Clone(fs.readFileSync(WadFolderPath + '\\Combined.json', 'utf-8'))

    let JsonFiles = Files.filter(item => item.endsWith('.json'))

    console.log(Combined)
    let RegStr = new RegExp(/ASSETS.+\.(?:dds|skn|skl|sco|scb|anm)/g)

    let AssetFiles =
        Files.filter(item => /(particles|shared)/gi.test(item))
            .filter(item => /\.(?:dds|skn|skl|sco|scb|anm)/gi.test(item))


    let Progress = document.getElementById('Progress-Range')
    Progress.classList.remove('Progress-Complete')
    Progress.max = AssetFiles.length
    Progress.value = 0

    let BinCount = document.getElementById('Bin-Count')
    BinCount.innerText = `0/${AssetFiles.length}`

    let UnusedCount = 0


    for (let i = 0; i < AssetFiles.length; i++) {
        // for (let i = 0; i < 1; i++) {
        Progress.value = i
        BinCount.innerText = `${Progress.value + 1}/${Progress.max}`
        await UTIL.Sleep(10)
        for (let j = 0; j < Combined.length; j++) {
            location:
            for (let k = 0; k < Combined[j].Files.length; k++) {
                if (AssetFiles[i].toLowerCase().endsWith(Combined[j].Files[k].replace(/\//g, '\\'))) {
                    break location;
                }
                else if (j == Combined[Combined.length - 1].Files.length - 1) {
                    UnusedCount++
                    Files2Delete.push(AssetFiles[i])
                    // console.log(`${AssetFiles[i]} ${Combined[j].Files[k]}`)
                    // fs.unlinkSync(AssetFiles[i])
                }
            }
        }
    }
    Files2Delete.sort(sorter)
    for (let i = 0; i < Files2Delete.length; i++) {
        let bin = document.createElement('div')
        bin.innerText = Files2Delete[i].slice(WadFolderPath.length + 1)
        BinList.appendChild(bin)
    }

    Progress.classList.add('Progress-Complete')
    UTIL.CreateAlert('Unused Files Detected', `${UnusedCount} Total files detected`)

}

function DeleteUnused(){
    let arrayOfFiles = []
    let Files = getAllFiles(WadFolderPath, arrayOfFiles)
    
    BinList.innertext = ''
    for (let i = 0; i < Files2Delete.length; i++) {
        fs.unlinkSync(Files2Delete[i])
    }
    
    let JsonFiles = Files.filter(item => item.endsWith('.json'))

    for (let i = 0; i < JsonFiles.length; i++) {
        fs.unlinkSync(JsonFiles[i])
    }
    UTIL.CreateAlert(`Success!`,`Deleted ${Files2Delete.length} unused files`,false)
}
const getAllFiles = function (dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)
    
    arrayOfFiles = arrayOfFiles || []

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })

    return arrayOfFiles
}