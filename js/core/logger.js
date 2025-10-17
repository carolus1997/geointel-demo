// js/core/logger.js — Sistema de registro táctico unificado (modo global)

window.Logger = (() => {
  const colors = {
    map: "color:#00E5FF",
    mission: "color:#00FFC6",
    ui: "color:#FFD700",
    core: "color:#B366FF",
    error: "color:#FF4D4D",
    success: "color:#00FF99",
  };

  const icon = {
    map: "🛰️",
    mission: "🎯",
    ui: "🧩",
    core: "⚙️",
    error: "❌",
    success: "✅",
  };

  function log(type, message, extra = "") {
    const now = new Date().toLocaleTimeString("es-ES", { hour12: false });
    const color = colors[type] || "color:#ccc";
    const prefix = icon[type] || "ℹ️";
    console.log(`%c[${now}] ${prefix} ${message}`, color, extra);
  }

  return {
    core: (msg) => log("core", msg),
    map: (msg) => log("map", msg),
    mission: (msg) => log("mission", msg),
    ui: (msg) => log("ui", msg),
    ok: (msg) => log("success", msg),
    error: (msg, extra) => log("error", msg, extra),
  };
})();
