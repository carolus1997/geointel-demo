window.ToolsPanel = (() => {
    let panel, draw, map;

    function init(mapInstance, drawInstance, containerId = 'side-panel-tools') {
        map = mapInstance;
        draw = drawInstance;
        panel = document.getElementById(containerId);
        if (!panel) return console.error('❌ Panel no encontrado');

        panel.innerHTML = `
      <h2>Herramientas de Dibujo</h2>
      <div class="tool-group">
        <div class="tool-group">
            <button class="tool-btn" data-mode="point"><i class="fa-solid fa-location-dot"></i> Punto</button>
            <button class="tool-btn" data-mode="line_string"><i class="fa-solid fa-slash"></i> Línea</button>
            <button class="tool-btn" data-mode="polygon"><i class="fa-solid fa-draw-polygon"></i> Polígono</button>
            <button id="btn-texto" class="tool-btn"><i class="fa-solid fa-font"></i> Texto</button>
  </div>
      </div>

      <div class="tool-group spaced">
        <button id="btn-cancelar" class="tool-btn danger"><i class="fa-solid fa-xmark"></i> Cancelar</button>
        <button id="btn-limpiar" class="tool-btn danger"><i class="fa-solid fa-eraser"></i> Limpiar todo</button>
      </div>

      <div class="tool-group spaced">
        <button id="btn-exportar" class="tool-btn"><i class="fa-solid fa-download"></i> Exportar GeoJSON</button>
        <button id="btn-capturar" class="tool-btn"><i class="fa-solid fa-camera"></i> Capturar mapa</button>
      </div>

      <div id="tool-output"></div>
    `;
        // === HERRAMIENTA DE TEXTO ===
        const btnTexto = document.getElementById("btn-texto");
        if (btnTexto) {
            btnTexto.addEventListener("click", () => {
                activarModoTexto();
                actualizarEstado("Haz clic en el mapa para colocar texto.");
            });
        }
        // === Modos de dibujo ===
        panel.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', e => {
                const mode = e.target.closest('button').dataset.mode;
                draw.changeMode(`draw_${mode}`);
                actualizarEstado(`Modo: ${mode}`);
            });
        });

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            draw.changeMode('simple_select');
            actualizarEstado('Dibujo cancelado.');
        });

        document.getElementById('btn-limpiar').addEventListener('click', () => {
            draw.deleteAll();
            actualizarEstado('Limpieza completa.');
        });

        document.getElementById('btn-exportar').addEventListener('click', exportarGeoJSON);
        document.getElementById('btn-capturar').addEventListener('click', capturarMapa);
    }

    function actualizarEstado(msg) {
        const out = document.getElementById('tool-output');
        out.innerHTML = `<p>${msg}</p>`;
    }

    function exportarGeoJSON() {
        const data = draw.getAll();
        if (!data.features.length) return actualizarEstado('Nada que exportar.');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mision2_dibujo_${Date.now()}.geojson`;
        a.click();
        actualizarEstado('Exportado GeoJSON.');
    }

    function capturarMapa() {
        // Fuerza WebGL a conservar buffer
        const canvas = map.getCanvas();
        const dataURL = canvas.toDataURL('image/png');
        const enlace = document.createElement('a');
        enlace.download = `captura_mision2_${Date.now()}.png`;
        enlace.href = dataURL;
        enlace.click();
        actualizarEstado('Captura guardada.');
    }

    return { init };
})();
