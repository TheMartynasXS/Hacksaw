const Store = require("electron-store");
const storage = new Store();


function getWinSettings() {
  const default_bounds = [0, 0, 800, 600];
}

function saveBounds(bounds) {
  
}

module.exports = {
  getWinSettings,
  saveBounds,
};
