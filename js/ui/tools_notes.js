// ======================================================
// 📸 tools_capture.js — Captura táctica con proporción real
// ======================================================
window.ToolsCapture = (() => {
  let map;

  function init(_map) {
    map = _map;
    console.log("📸 ToolsCapture inicializado (modo canvas real)");
  }

  async function capture() {
    if (!map) return console.warn("⚠️ Map no inicializado en ToolsCapture");

    const mapContainer = document.getElementById("map-container");
    const mapCanvas = map.getCanvas();
    const uiElements = document.querySelectorAll("#toolbox, .dropdown-panel, #simulation-panel, #side-panel, #basemap-controls");

    // 1️⃣ Ocultar interfaz
    uiElements.forEach(el => (el.style.display = "none"));

    try {
      // 2️⃣ Crear canvas temporal del mapa
      const width = mapCanvas.width;
      const height = mapCanvas.height;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = width;
      exportCanvas.height = height;
      const ctx = exportCanvas.getContext("2d");

      // Copiar el mapa renderizado
      ctx.drawImage(mapCanvas, 0, 0, width, height);

      // 3️⃣ Capturar overlays HTML (notas, radar, etc.)
      const overlays = document.querySelectorAll(".map-note, .radar-sector, .custom-overlay");
      for (const el of overlays) {
        const canvasOverlay = await html2canvas(el, {
          backgroundColor: null,
          useCORS: true,
          logging: false,
          scale: 2
        });

        const rect = el.getBoundingClientRect();
        const mapRect = mapContainer.getBoundingClientRect();
        const x = rect.left - mapRect.left;
        const y = rect.top - mapRect.top;
        ctx.drawImage(canvasOverlay, x, y);
      }

      // 4️⃣ Exportar como PNG
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `captura_mision_${timestamp}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();

      flash("📸 Captura guardada correctamente");
    } catch (err) {
      console.error("❌ Error en ToolsCapture:", err);
      flash("⚠️ Error al capturar");
    } finally {
      // 5️⃣ Restaurar interfaz
      uiElements.forEach(el => (el.style.display = ""));
    }
  }

  // 🧩 Notificación temporal
  function flash(msg) {
    const el = document.createElement("div");
    el.className = "note-tip";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  return { init, capture };
})();
