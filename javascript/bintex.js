const BinList = document.getElementById("Bin-List")

const { execSync, exec } = require('child_process')
const sorter = require('path-sort').standalone('/')

let ParticleArray = []

let WadFolderPath = ""

async function SelectWadFolder() {
    WadFolderPath = ipcRenderer.sendSync('FileSelect', "Folder")
    let arrayOfFiles = []
    let Files = getAllFiles(WadFolderPath[0], arrayOfFiles)
    let Progress = document.getElementById('Progress-Range')
    Progress.classList.remove('Progress-Complete')

    let FilteredFiles = Files.filter(item => item.endsWith('.bin'))

    let BinCount = document.getElementById('Bin-Count')
    BinCount.innerText = `0/${FilteredFiles.length}`
    // UTIL.CreateAlert(`Found ${files.length} bin files`)
    Progress.max = FilteredFiles.length
    BinList.innerHTML = ""

    let CombinedOutput = []
    let SeparateOutput = []
    for (let i = 0; i < FilteredFiles.length; i++) {
        if (fs.existsSync(FilteredFiles[i].slice(0, -4) + ".json") == false) {
            execSync(`"${Prefs.RitoBinPath}" -o json "${FilteredFiles[i]}"`)
        }

        let tempfile = UTIL.Clone(fs.readFileSync(FilteredFiles[i].slice(0, -4) + ".json", 'utf-8'))
        let ParticleObject = tempfile.entries.value.items
        for (let PO_ID = 0; PO_ID < ParticleObject.length; PO_ID++) {
            if (ParticleObject[PO_ID].value.name == "VfxSystemDefinitionData") {

                let tempname = ParticleObject[PO_ID].value.items.find((item) => {
                    if (item.key == "particleName") { return item }
                }).value
                SeparateOutput.push({
                    Particle: tempname,
                    Files: []
                })

                let DefData = ParticleObject[PO_ID].value.items.filter(item => item.key == "complexEmitterDefinitionData" || item.key == "simpleEmitterDefinitionData")
                for (let B = 0; B < DefData.length; B++) {
                    let Props = DefData[B].value.items
                    for (let C = 0; C < Props.length; C++) {
                        if (DefData[B].key == "complexEmitterDefinitionData" || DefData[B].key == "simpleEmitterDefinitionData") {
                            let StringObj = JSON.stringify(DefData[B], null, 2)
                            let RegStr = new RegExp(/\"ASSETS.+\.(?:dds|skn|skl|sco|scb|anm)\"/g)

                            let Matches = StringObj.match(RegStr)

                            Matches?.forEach(Match => {
                                if (!CombinedOutput.includes(Match.replace(/"/g, ''))) {
                                    CombinedOutput.push(Match.replace(/"/g, ''))
                                }
                                if (!SeparateOutput[SeparateOutput.length - 1].Files.includes(Match.replace(/"/g, ''))) {
                                    SeparateOutput[SeparateOutput.length - 1].Files.push(Match.replace(/"/g, ''))
                                }
                            })
                        }
                    }
                }
            }
        }

        await UTIL.Sleep(100)
        Progress.value = i + 1
        BinCount.innerText = `${Progress.value}/${Progress.max}`
        //fs.unlinkSync(FilteredFiles[i].slice(0, -4) + ".json")
    }

    CombinedOutput.sort(sorter)

    fs.writeFileSync(WadFolderPath + '\\Combined.txt', CombinedOutput.join("\n"), "utf8")

    SeparateOutput.sort((a, b) => (a.Particle > b.Particle) ? 1 : ((b.Particle > a.Particle) ? -1 : 0))

    let ResortedOutput = []
    for (let i = 0; i < SeparateOutput.length; i++) {
        ResortedOutput.push(SeparateOutput[i].Particle)
        SeparateOutput[i].Files.sort(sorter)
        for (let j = 0; j < SeparateOutput[i].Files.length; j++) {
            ResortedOutput.push(`- ${SeparateOutput[i].Files[j]}`)
        }
    }
    fs.writeFileSync(WadFolderPath + '\\Separate.txt', ResortedOutput.join("\n"), "utf8")
    Progress.classList.add('Progress-Complete')
}
async function DeleteUnused() {
    let arrayOfFiles = []
    let Files = getAllFiles(WadFolderPath[0], arrayOfFiles)
    //dds | skn | skl | sco | scb | anm

    // for (let i = 0; i < Files.length; i++) {
    //     Files[i].replace(/"/g, '')
    // }

    let JsonFiles = Files.filter(item => item.endsWith('.json'))

    for (let i = 0; i < JsonFiles.length; i++) {
        fs.unlinkSync(JsonFiles[i])
    }
}

//if (fs.existsSync(FilePath.slice(0, -4) + ".json") == false)
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