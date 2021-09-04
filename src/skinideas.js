let IdeaCount = document.getElementById("IdeaCount")
let IdeaList = document.getElementById("IdeaList")
let Data = require('../Data.json')
const https = require('https')

function FetchThemes()
{
  https.get('https://raw.githubusercontent.com/DevMarcius/Skin_Idea_Generator-Python/master/config.yaml', (resp) => {
    let data = '';
  
    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });
  
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      console.log(data);
    });
  
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

function Generate()
{
  IdeaList.innerText = ''
  let Temp = IdeaCount.value > 0 ? IdeaCount.value : 5
  for (let i = 0; i < Temp; i++) {
    let Idea = document.createElement('div')
    Idea.className = "m-1 text-gray-300"
    Idea.innerText =  `${Data.Themes[Math.round(Math.random()*(Data.Themes.length -1))]} ${Data.Champions[Math.round(Math.random()*(Data.Champions.length -1))]}`
    IdeaList.appendChild(Idea)
  }
}