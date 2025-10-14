// debugHUD.js — monitor táctico de depuración
import { Logger } from "./logger.js";

export const DebugHUD = (() => {
  let hudEl;

  function init() {
    document.addEventListener("keydown", (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "d") toggleHUD();
    });
  }

  function toggleHUD() {
    if (hudEl) {
      hudEl.remove();
      hudEl = null;
      Logger.ui("Debug HUD oculto");
      return;
    }

    hudEl = document.createElement("div");
    hudEl.id = "debug-hud";
    hudEl.innerHTML = `
      <h4>🧩 DEBUG HUD</h4>
      <p id="fps-info">FPS: ...</p>
      <p id="layer-info">Capas: ...</p>
    `;
    document.body.appendChild(hudEl);
    Logger.ui("Debug HUD activado");
    startFPSCounter();
  }

  function startFPSCounter() {
    let last = performance.now(), frames = 0;
    const fpsEl = document.getElementById("fps-info");

    function loop() {
      const now = performance.now();
      frames++;
      if (now - last >= 1000) {
        fpsEl.textContent = `FPS: ${frames}`;
        frames = 0;
        last = now;
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  return { init };
})();
