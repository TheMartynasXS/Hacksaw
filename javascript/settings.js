const Store = require("electron-store");
const storage = new Store();

function getWinSettings() {
  const default_bounds = [800, 600];
  const size = storage.get("win-size");

  const position = storage.get("win-position");
  let settings = {
    size: size || default_bounds,
    position: position || undefined,
  };
  if (!settings.size) {
    storage.set("win-size", default_bounds);
  }
  return settings;
}

function saveBounds(position) {
  storage.set("win-size", [position.width, position.height]);
  storage.set("win-position", [position.x, position.y]);
}

module.exports = {
  getWinSettings,
  saveBounds,
};
