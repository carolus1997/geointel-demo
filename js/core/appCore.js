// js/core/appCore.js
import { initMap } from "./mapModule.js";
import { loadMissions } from "./missionsModule.js";
import { showIntro, hideIntro, updateIntroStatus } from "./uiModule.js";
import { delay } from "./utils.js";
import { DebugHUD } from "./debugHUD.js";

window.addEventListener("DOMContentLoaded", async () => {
  await AppCore.init();
});

export const AppCore = (() => {
  async function init() {
    DebugHUD.init();
    showIntro("Inicializando módulo de mapa...");
    await delay(600);

    const map = await initMap();
    updateIntroStatus("Cargando misiones activas...");
    await loadMissions(map);

    updateIntroStatus("Sincronizando interfaz...");
    await delay(600);

    hideIntro();
    console.log("✅ Plataforma inicializada correctamente");
  }

  return { init };
})();
