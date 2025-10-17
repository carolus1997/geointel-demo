// =========================================
// 📝 tools_notes.js — v2.2 (con integración total)
// =========================================
window.ToolsNotes = (() => {
  let map;
  const notes = [];

  // === Inicialización ===
  function init(_map) {
    map = _map;
    console.log("📝 Módulo de anotaciones activo");
  }

  // === Activar modo de anotación ===
  function activate() {
    if (!map) return;
    map.getCanvas().style.cursor = "text";

    // Tooltip temporal
    const tip = document.createElement("div");
    tip.className = "note-tip";
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 2500);

    map.once("click", (e) => {
      const { lng, lat } = e.lngLat;
      createNoteAt(lng, lat);
      map.getCanvas().style.cursor = "";
    });
  }

  // === Crear anotación ===
  function createNoteAt(lng, lat) {
    const el = document.createElement("div");
    el.className = "map-note";
    el.innerHTML = `
      <textarea placeholder="Escribe una nota..."></textarea>
      <button class="close-note"><i class="fa-solid fa-xmark"></i></button>
    `;

    const marker = new maplibregl.Marker({
      element: el,
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map);

    notes.push({ marker, el });

    el.querySelector(".close-note").addEventListener("click", () => {
      marker.remove();
      const idx = notes.findIndex(n => n.marker === marker);
      if (idx >= 0) notes.splice(idx, 1);
    });
  }

  return { init, activate };
})();
