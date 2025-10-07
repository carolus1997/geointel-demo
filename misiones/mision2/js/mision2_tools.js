// === HERRAMIENTAS DE DIBUJO ===
map.on('load', () => {
  const Draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      point: true,
      line_string: true,
      polygon: true,
      trash: true
    },
    styles: [
      {
        'id': 'gl-draw-polygon-fill',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        'paint': { 'fill-color': '#00E5FF', 'fill-opacity': 0.1 }
      },
      {
        'id': 'gl-draw-polygon-stroke-active',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        'paint': { 'line-color': '#00C896', 'line-width': 2 }
      },
      {
        'id': 'gl-draw-line-active',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        'paint': { 'line-color': '#00E5FF', 'line-width': 2 }
      },
      {
        'id': 'gl-draw-point-point',
        'type': 'circle',
        'filter': ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
        'paint': {
          'circle-radius': 6,
          'circle-color': '#FF6B00',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.5
        }
      }
    ]
  });

  // === Añadir el control de dibujo una vez cargado el mapa ===
  map.addControl(Draw, 'top-left');

  // === CONTROL DE NOTAS ===
  map.on('draw.create', e => {
    const feature = e.features[0];
    if (feature.geometry.type === 'Point') {
      const note = prompt("📍 Nota para este punto:");
      if (note) feature.properties.note = note;
    }
  });

  // Mostrar nota en popup al hacer clic
  map.on('click', e => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['gl-draw-point-point'] });
    if (!features.length) return;
    const note = features[0].properties.note;
    if (note) {
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<strong>Nota:</strong> ${note}`)
        .addTo(map);
    }
  });

  // === EXPORTAR MAPA A IMAGEN ===
  function exportarMapa() {
    const mapContainer = document.getElementById('map');
    html2canvas(mapContainer, { useCORS: true }).then(canvas => {
      const enlace = document.createElement('a');
      enlace.download = `captura_mision2_${Date.now()}.png`;
      enlace.href = canvas.toDataURL();
      enlace.click();
    });
  }

  // === CONTROLES PERSONALIZADOS ===
  const toolbar = document.createElement('div');
  toolbar.className = 'map-toolbar';
  toolbar.innerHTML = `
    <button id="btn-exportar"><i class="fa-solid fa-camera"></i> Capturar</button>
    <button id="btn-limpiar"><i class="fa-solid fa-eraser"></i> Limpiar</button>
  `;
  document.getElementById('map-container').appendChild(toolbar);

  // === EVENTOS ===
  document.getElementById('btn-exportar').addEventListener('click', exportarMapa);
  document.getElementById('btn-limpiar').addEventListener('click', () => Draw.deleteAll());
});
