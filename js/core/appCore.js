// js/core/appCore.js — versión global y estable

window.AppCore = (() => {
  async function init() {
    try {
      // 1️⃣ Activa HUD de depuración
      if (window.DebugHUD) window.DebugHUD.init();

      // 2️⃣ Muestra intro animada
      window.showIntro("Inicializando módulo de mapa...");
      await window.delay(600);

      // 3️⃣ Inicializa el mapa
      const map = await window.initMap();
      window.updateIntroStatus("Cargando misiones activas...");
      await window.loadMissions(map);

      // 4️⃣ Verifica HUDs cargados
      setTimeout(() => {
        const inserted = document.querySelectorAll(".hud-marker");
        window.Logger.ui(`✅ HUDs visibles en DOM: ${inserted.length}`);
      }, 1000);

      // 5️⃣ Finaliza carga
      window.updateIntroStatus("Sincronizando interfaz...");
      await window.delay(600);

      window.hideIntro();
      window.Logger.ok("✅ Plataforma inicializada correctamente");
    } catch (err) {
      console.error("❌ Error crítico en AppCore:", err);
      if (window.showErrorMessage) {
        window.showErrorMessage("Error al inicializar la plataforma táctica.");
      }
    }
  }

  // Inicialización automática
  window.addEventListener("DOMContentLoaded", init);

  return { init };
})();
