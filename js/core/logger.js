// js/core/logger.js — Logger táctico avanzado

window.Logger = (() => {
  const colors = {
    map: "color:#00E5FF",
    mission: "color:#00FFC6",
    ui: "color:#FFD700",
    core: "color:#B366FF",
    error: "color:#FF4D4D",
    success: "color:#00FF99",
    default: "color:#ccc"
  };

  const icon = {
    map: "🛰️",
    mission: "🎯",
    ui: "🧩",
    core: "⚙️",
    error: "❌",
    success: "✅",
    default: "ℹ️"
  };

  const history = [];
  let silent = false;

  function log(type, message, extra = "") {
    const now = new Date().toLocaleTimeString("es-ES", { hour12: false });
    const color = colors[type] || colors.default;
    const prefix = icon[type] || icon.default;
    const entry = { time: now, type, message, extra };

    history.push(entry);
    if (history.length > 200) history.shift(); // límite circular

    if (!silent) console.log(`%c[${now}] ${prefix} ${message}`, color, extra);

    // Emitir evento global para HUD o panel
    document.dispatchEvent(new CustomEvent("logger:update", { detail: entry }));
  }

  return {
    core: (msg) => log("core", msg),
    map: (msg) => log("map", msg),
    mission: (msg) => log("mission", msg),
    ui: (msg) => log("ui", msg),
    ok: (msg) => log("success", msg),
    error: (msg, extra) => log("error", msg, extra),
    get history() { return [...history]; },
    clear: () => history.length = 0,
    mute: () => { silent = true; },
    unmute: () => { silent = false; }
  };
})();
