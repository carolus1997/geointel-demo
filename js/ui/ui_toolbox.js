// ======================================================
// 🧭 UI Toolbox — Barra flotante de herramientas tácticas
// ======================================================
window.Toolbox = (() => {
  function init(map, draw) {
    const mapContainer = document.getElementById("map-container");

    // === Crear toolbox flotante dentro del mapa ===
    const box = document.createElement("div");
    box.id = "toolbox";
    box.innerHTML = `
      <button id="btn-color" title="Color táctico"><i class="fa-solid fa-palette"></i></button>
      <button id="btn-point" title="Punto"><i class="fa-solid fa-location-dot"></i></button>
      <button id="btn-line" title="Línea"><i class="fa-solid fa-slash"></i></button>
      <button id="btn-poly" title="Polígono"><i class="fa-solid fa-draw-polygon"></i></button>
      <button id="btn-buffer" title="Buffer"><i class="fa-solid fa-circle-notch"></i></button>
      <button id="btn-capture" title="Captura táctica"><i class="fa-solid fa-camera"></i></button>
      <button id="btn-notes" title="Anotaciones"><i class="fa-regular fa-comment-dots"></i></button>
      <button id="btn-delete" title="Borrar elemento"><i class="fa-solid fa-eraser"></i></button>
      <button id="btn-clear-all" title="Borrar todo"><i class="fa-solid fa-broom"></i></button>
    `;
    mapContainer.appendChild(box);

    // === Inicializar color, buffer y notas ===
    if (window.ToolColorSelector?.init) ToolColorSelector.init(mapContainer);
    if (window.ToolBuffer?.init) ToolBuffer.init(mapContainer, map, draw);
    if (window.ToolsNotes?.init) ToolsNotes.init(map);
    if (window.ToolsDelete?.init) ToolsDelete.init(map, draw);
    if (window.ToolsCapture?.init) ToolsCapture.init(map);


    // === Botones principales ===
    const colorBtn = document.getElementById("btn-color");
    const bufferBtn = document.getElementById("btn-buffer");
    const notesBtn = document.getElementById("btn-notes");

    // === Eventos de UI desplegables ===
    colorBtn.onclick = () => {
      ToolColorSelector.posicionarRespecto(colorBtn);
      ToolColorSelector.toggle();
    };

    bufferBtn.onclick = () => {
      ToolBuffer.posicionarRespecto(bufferBtn);
      ToolBuffer.toggle();
    };

    notesBtn.onclick = () => {
      if (window.ToolsNotes?.activate) {
        ToolsNotes.activate();
      } else {
        console.warn("⚠️ ToolsNotes no está disponible.");
      }
    };

    // === Eventos de dibujo ===
    document.getElementById("btn-point").onclick = () =>
      ToolDraw.dibujar(map, draw, "point");
    document.getElementById("btn-line").onclick = () =>
      ToolDraw.dibujar(map, draw, "line_string");
    document.getElementById("btn-poly").onclick = () =>
      ToolDraw.dibujar(map, draw, "polygon");
    document.getElementById("btn-notes").onclick = () =>
      ToolsNotes.activate();
    document.getElementById("btn-delete").onclick = () =>
      ToolsDelete.toggle();
    document.getElementById("btn-clear-all").onclick = () =>
      ToolsDelete.clearAll();
    document.getElementById("btn-capture").onclick = () => 
      ToolsCapture.capture(window.MAP_INSTANCE || map);



  }

  return { init };
})();
