const Path = require("path");
const https = require("https");
const { ipcRenderer } = require('electron')
const fs = require("fs");
const path = require("path");
let IdeaCount = document.getElementById("Idea-Count");
let IdeaList = document.getElementById("Idea-List");
let IdeaChamp = document.getElementById("Idea-Champ");
const DataPath = Path.join(ipcRenderer.sendSync("UserPath") + "\\Data.json");
const {Tab} = require('../javascript/shared.js');

function FetchThemes() {
    https
        .get(
            "https://raw.githubusercontent.com/DevMarcius/binsplash/main/Data.json",
            (resp) => {
                let data = "";

                // A chunk of data has been received.
                resp.on("data", (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on("end", () => {
                    SaveData(data);
                    //console.log(JSON.parse(data))
                });
            }
        )
        .on("error", (err) => {
            console.log("Error: " + err.message);
        });
}

let Data = fs.existsSync(DataPath) == true ? require(DataPath) : null;
if (Data == null) {
    FetchThemes();
}

function SaveData(NewData) {
    fs.writeFileSync(DataPath, NewData, "utf8");
    Data = JSON.parse(NewData);
}

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

Generate();
