// ===============================
// 📸 ToolsCapture — Captura exacta del mapa visible
// ===============================
window.ToolsCapture = (() => {
  async function capture(map) {
    try {
      if (!map) throw new Error("Mapa no inicializado");

      // Forzar repintado del mapa
      map.triggerRepaint();
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = map.getCanvas();
      const rect = canvas.getBoundingClientRect();

      // Crear un canvas del mismo tamaño visible en pantalla
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = rect.width;
      exportCanvas.height = rect.height;

      const ctx = exportCanvas.getContext("2d");

      // Factor de corrección para evitar que se “alargue”
      const scale = rect.width / canvas.width;
      ctx.scale(scale, scale);

      // Copiar solo la parte visible del mapa
      ctx.drawImage(canvas, 0, 0);

      // Descargar el PNG
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = exportCanvas.toDataURL("image/png");
      link.download = `captura_mision_${timestamp}.png`;
      link.click();

      console.info("📸 Captura exportada correctamente");
    } catch (err) {
      console.error("❌ Error en ToolsCapture:", err);
    }
  }

  return { capture };
})();
