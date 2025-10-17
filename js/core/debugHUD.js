// js/core/debugHUD.js — HUD táctico extendido
window.DebugHUD = (() => {
  let hudEl, logsEl, fpsEl, errors = 0;
  let active = false;

  function init() {
    document.addEventListener("keydown", (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "d") toggleHUD();
    });

    // Escucha los logs
    document.addEventListener("logger:update", (e) => {
      if (!active) return;
      const { time, type, message } = e.detail;
      const line = document.createElement("div");
      line.textContent = `[${time}] ${type.toUpperCase()}: ${message}`;
      line.className = `log-line ${type}`;
      logsEl.prepend(line);
      if (logsEl.children.length > 20) logsEl.removeChild(logsEl.lastChild);
      if (type === "error") errors++;
      updateStatus();
    });
  }

  function toggleHUD() {
    if (active) {
      hudEl.remove();
      active = false;
      return;
    }

    hudEl = document.createElement("div");
    hudEl.id = "debug-hud";
    hudEl.innerHTML = `
      <h4>🧩 DEBUG HUD</h4>
      <div id="hud-status">FPS: ... | Errores: 0</div>
      <div id="hud-logs" class="log-container"></div>
    `;
    document.body.appendChild(hudEl);

    logsEl = hudEl.querySelector("#hud-logs");
    fpsEl = hudEl.querySelector("#hud-status");
    active = true;
    startFPSCounter();
  }

  function startFPSCounter() {
    let last = performance.now(), frames = 0;
    function loop() {
      const now = performance.now();
      frames++;
      if (now - last >= 1000) {
        updateStatus(frames);
        frames = 0;
        last = now;
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  function updateStatus(fps = 0) {
    if (fpsEl) fpsEl.textContent = `FPS: ${fps} | Errores: ${errors}`;
  }

  return { init };
})();
