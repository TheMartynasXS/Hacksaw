const Path = require("path");
const { ipcRenderer } = require('electron')
const fs = require("fs");
let IdeaCount = document.getElementById("Idea-Count");
let IdeaList = document.getElementById("Idea-List");
let IdeaChamp = document.getElementById("Idea-Champ");
const DataPath = Path.join(ipcRenderer.sendSync("UserPath") + "\\Data.json");
const {Tab} = require('../javascript/utils.js');

const Data = require('../javascript/Data.json');

function Generate() {
    IdeaList.innerText = "";
    let Temp = IdeaCount.value > 0 ? IdeaCount.value : 5;
    for (let i = 0; i < Temp; i++) {
        let Idea = document.createElement("div");
        Idea.className = "Idea";
        Idea.innerText = `${
            Data.Themes[Math.round(Math.random() * (Data.Themes.length - 1))]
        } ${
            IdeaChamp.value.length > 0
                ? IdeaChamp.value
                : Data.Champions[
                      Math.round(Math.random() * (Data.Champions.length - 1))
                  ]
        }`;
        IdeaList.appendChild(Idea);
    }
}

function SaveList(){
    let Folder = ipcRenderer.sendSync('FileSelect', ['Select List export location', 'Folder'])
    let virtualList = []
    for(let i = 0; i < IdeaList.children.length; i++){
        virtualList.push(IdeaList.children[i].innerText)
    }
    fs.writeFileSync(
        Folder + "\\IdeaList.txt"
        , virtualList.join('\n') , "utf8"
    )
}

Generate();
