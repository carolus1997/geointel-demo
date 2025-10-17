window.ToolBuffer = (() => {
  let panel;

  function init(container, map, draw) {
    if (document.getElementById("buffer-panel")) return;

    panel = document.createElement("div");
    panel.id = "buffer-panel";
    panel.classList.add("dropdown-panel");
    panel.innerHTML = `
      <h4>Generar Buffer</h4>
      <div class="form-row">
        <label>Distancia:</label>
        <input type="number" id="buffer-dist" value="2" min="0.1" step="0.1">
      </div>
      <div class="form-row">
        <label>Unidad:</label>
        <select id="buffer-unit">
          <option value="km">km</option>
          <option value="m">m</option>
        </select>
      </div>
      <button id="btn-buffer-apply" class="apply">Aplicar</button>
    `;
    container.appendChild(panel);

    document.getElementById("btn-buffer-apply").onclick = () => aplicar(map, draw);
  }

  function toggle() {
    if (!panel) return;
    panel.classList.toggle("visible");
  }

  function posicionarRespecto(btn) {
    if (!panel || !btn) return;
    const rect = btn.getBoundingClientRect();
    
  }

  function aplicar(map, draw) {
    const dist = parseFloat(document.getElementById("buffer-dist").value);
    const unit = document.getElementById("buffer-unit").value;
    const selected = draw.getSelected();

    if (!selected.features.length) return alert("Selecciona una geometría primero.");

    const base = selected.features[0];
    const buffered = turf.buffer(base, dist, { units: unit === "km" ? "kilometers" : "meters" });

    const color = window.ACTIVE_DRAW_COLOR || "#00E5FF";
    const id = `buffer-${Date.now()}`;

    map.addSource(id, { type: "geojson", data: buffered });
    map.addLayer({
      id,
      type: "fill",
      source: id,
      paint: { "fill-color": color, "fill-opacity": 0.25 }
    });
  }

  return { init, toggle, posicionarRespecto };
})();
