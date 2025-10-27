// ======================================================
// 🗒️ ToolsNotes — Viñetas tácticas ancladas al mapa (versión universal)
// ======================================================
window.ToolsNotes = (() => {
  let map;
  let active = false;
  let currentGlobalColor = "#00C896";
  let noteCounter = 0;
  const notes = new Map(); // id → { el, lngLat }

  const COLORS = [
    { name: "seguro", color: "#00C896" },
    { name: "riesgo", color: "#FFD400" },
    { name: "hostil", color: "#FF2F00" },
    { name: "observacion", color: "#00E5FF" },
  ];

  // ======================================================
  function init(_map) {
    map = _map;
    if (!map) {
      console.warn("⚠️ ToolsNotes.init llamado sin mapa válido");
      return;
    }
    console.log("🗒️ ToolsNotes inicializado para:", map._container?.id || "mapa desconocido");

    // Escuchar cambios globales de color táctico
    document.addEventListener("TACTICAL_COLOR_CHANGED", (e) => {
      currentGlobalColor = e.detail.color;
    });

    // Actualización sincronizada con render
    // 🔄 Actualiza la posición de las notas en todos los eventos de movimiento del mapa
    ["move", "zoom", "resize", "pitch", "rotate"].forEach(ev => {
      map.on(ev, () => {
        if (map.loaded()) updatePositions();
      });
    });

  }

  // ======================================================
  function activate() {
    if (!map) return console.warn("⚠️ Map no inicializado en ToolsNotes");
    active = !active;
    console.log(active ? "🟢 Modo notas activado" : "🔴 Modo notas desactivado");
    map.getCanvas().style.cursor = active ? "text" : "";

    if (active) {
      map.once("click", (e) => {
        createNoteAt(e.lngLat);
        activate(); // desactivar después de crear
      });
    }
  }

  // ======================================================
  function createNoteAt(lngLat) {
    const container =
      document.getElementById("map-container") ||
      document.querySelector(".map-container") ||
      map.getContainer();

    const id = `note-${++noteCounter}`;
    const color = currentGlobalColor;

    // === Nota base ===
    const note = document.createElement("div");
    note.id = id;
    note.className = "map-note";
    note.dataset.color = color;
    note.style.setProperty("--note-color", color);
    Object.assign(note.style, {
      border: `2px solid ${color}`,
      background: "rgba(0,0,0,0.6)",
      borderRadius: "6px",
      padding: "6px 8px",
      minWidth: "120px",
      color: "#fff",
      fontSize: "13px",
      userSelect: "none",
      cursor: "move",
      zIndex: 900,
      backdropFilter: "blur(2px)",
      position: "absolute",
      transition: "border-color 0.2s",
      transformOrigin: "bottom center",
    });

    // === Texto editable ===
    const input = document.createElement("div");
    input.className = "note-input";
    input.contentEditable = true;
    input.textContent = "Nueva nota...";
    Object.assign(input.style, {
      outline: "none",
      background: "transparent",
      paddingRight: "16px",
      userSelect: "text"          // ⬅️ permite seleccionar/escribir
    });
    // ⬇️ evita que el mapa capture eventos y desactiva drag/zoom mientras editas
    input.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    input.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    input.addEventListener("click", (e) => {
      e.stopPropagation();
      input.focus();
    });
    input.addEventListener("focus", () => {
      map?.dragPan?.disable?.();
      map?.scrollZoom?.disable?.();
    });
    input.addEventListener("blur", () => {
      map?.dragPan?.enable?.();
      map?.scrollZoom?.enable?.();
    });

    note.appendChild(input);

    // === Piquito táctico ===
    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "absolute",
      bottom: "-8px",
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderTop: `8px solid ${color}`,
    });
    note.appendChild(tip);

    // === Botón de color ===
    const colorBtn = document.createElement("div");
    colorBtn.className = "note-color-btn";
    Object.assign(colorBtn.style, {
      position: "absolute",
      top: "4px",
      right: "4px",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      background: color,
      border: "1px solid #000",
      cursor: "pointer",
    });
    colorBtn.title = "Cambiar color táctico";
    colorBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentIndex = COLORS.findIndex((c) => c.color === note.dataset.color);
      const next = COLORS[(currentIndex + 1) % COLORS.length];
      note.dataset.color = next.color;
      note.style.borderColor = next.color;
      note.style.setProperty("--note-color", next.color);
      colorBtn.style.background = next.color;
      tip.style.borderTopColor = next.color;
    });
    note.appendChild(colorBtn);

    // === Añadir al mapa ===
    container.appendChild(note);
    const marker = new maplibregl.Marker({ element: note })
      .setLngLat(lngLat)
      .addTo(map);

    // ⬅️ muy importante: permitir interacción del contentEditable
    if (note.parentElement) {
      note.parentElement.style.pointerEvents = "auto";
    }

    notes.set(id, { el: note, lngLat, marker });
    makeDraggable(note, id);

  }

  // ======================================================
  function updatePositions() {
    const zoom = map.getZoom();
    const scale = Math.min(1, zoom / 10);
    for (const [id] of notes) updatePosition(id, scale);
  }

  function updatePosition(id, scale = 1) {
    const data = notes.get(id);
    if (!data) return;

    // Actualizamos la posición del marcador si existe
    if (data.marker) {
      data.marker.setLngLat(data.lngLat);
    } else {
      // Seguridad: si por alguna razón no tiene marker, lo reconstruimos
      const marker = new maplibregl.Marker({ element: data.el })
        .setLngLat(data.lngLat)
        .addTo(map);

      // 💡 Permitir interacción con el contenido editable
      if (data.el.parentElement) {
        data.el.parentElement.style.pointerEvents = "auto";
      }

      data.marker = marker;
      notes.set(id, data);
    }

    // Ajuste visual de escala según zoom
    data.el.style.transform = `translate(-50%, -100%) scale(${scale})`;
  }


  // ======================================================
  function makeDraggable(el, id) {
    let isDragging = false;
    let startX, startY, initialLngLat;

    el.addEventListener("mousedown", (e) => {
      if (e.target.contentEditable === "true" || e.target.classList.contains("note-color-btn"))
        return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLngLat = notes.get(id)?.lngLat;
      el.style.opacity = "0.8";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const current = map.project(initialLngLat);
      const moved = new maplibregl.Point(current.x + dx, current.y + dy);
      const newLngLat = map.unproject(moved);
      notes.set(id, { el, lngLat: newLngLat });
      updatePosition(id);
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        el.style.opacity = "1";
      }
    });
  }

  // ======================================================
  function removeByElement(el) {
    if (!el) return;
    notes.delete(el.id);
    el.remove();
  }

  function clearAll() {
    for (const [id, obj] of notes) obj.el.remove();
    notes.clear();
  }

  // ======================================================
  return { init, activate, removeByElement, clearAll };
})();
