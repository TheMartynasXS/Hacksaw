let { ipcRenderer } = require('electron')
let fs = require('fs')
let CssPath = `${ipcRenderer.sendSync('UserPath')}\\Customize.css`
let CustomCss = fs.existsSync(CssPath) == true ? fs.readFileSync(CssPath, "utf-8") : null
if (CustomCss == undefined) {
    fs.writeFileSync(CssPath, `:root {
    --bg-one: #3a3b41;
    --bg-two: #303136;
    --bg-three: #28292e;
    --bg-accent: #484950;
    --accent-one: #4eff92;
    --accent-two: #4db3fe;
    --accent-three: #844efe;
    --accent-four: #ffc24f;
    --text-one: #eee;
}
*{
    font-size:14px;
}`)
    CustomCss = fs.readFileSync(CssPath, "utf-8")
}
let link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = CssPath;
document.head.appendChild(link)