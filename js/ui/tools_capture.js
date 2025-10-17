// ======================================================
// 📸 ToolsCapture — Captura táctica con overlay de misión
// ======================================================
window.ToolsCapture = (() => {
  async function capturar(map) {
    const mapContainer = map.getContainer();

    html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scale: 2,
      logging: false
    }).then(canvas => {
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;

      // Franja táctica inferior
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, h - 100, w, 100);

      // Título
      ctx.font = "bold 28px 'Segoe UI'";
      ctx.fillStyle = "#00E5FF";
      ctx.fillText("Misión — Captura táctica", 40, h - 45);

      // Fecha
      ctx.font = "18px 'Segoe UI'";
      ctx.fillStyle = "#ccc";
      const now = new Date().toLocaleString("es-ES", { hour12: false });
      ctx.fillText(now, w - 220, h - 45);

      const link = document.createElement("a");
      link.download = `captura_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      alert("📸 Captura táctica guardada.");
    });
  }

  return { capturar };
})();
