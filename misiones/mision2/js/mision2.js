// === CONFIG MAPLIBRE ===
const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [13.19, 32.887], // Trípoli
  zoom: 12,
  attributionControl: false
});

// === CONTROLES BÁSICOS ===
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === FUNCIÓN PARA AÑADIR CAPAS GEOJSON ===
function addLayer(srcId, dataPath, color) {
  if (map.getSource(srcId)) return;
  map.addSource(srcId, { type: 'geojson', data: dataPath });
  map.addLayer({
    id: srcId,
    type: 'fill',
    source: srcId,
    paint: {
      'fill-color': color,
      'fill-opacity': 0.35,
      'fill-outline-color': '#00E5FF'
    }
  });
}

// === EVENTO PRINCIPAL DE CARGA ===
map.on('load', () => {

  // === 1️⃣ CAPA DE RELIEVE (sin errores 400) ===
  map.addSource('hillshade', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler terrain-hillshade'
  });

  const firstLayerId = map.getStyle().layers[0].id;

  map.addLayer({
    id: 'hillshade-layer',
    type: 'raster',
    source: 'hillshade',
    paint: {
      'raster-opacity': 0.4,
      'raster-brightness-min': 0.8,
      'raster-brightness-max': 1.0
    },
    layout: { visibility: 'none' } // empieza oculta
  }, firstLayerId);


  // === 2️⃣ CAPA SATÉLITE ===
  map.addSource('satellite', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler satellite-v2'
  });

  map.addLayer({
    id: 'satellite-layer',
    type: 'raster',
    source: 'satellite',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' } // oculta al inicio
  });


  // === 3️⃣ CAPAS GEOJSON (locales) ===
  // ⚠️ Estructura esperada: /misiones/mision2/data/...
  addLayer('cambios', 'data/cambios_opticos.geojson', '#00C896');
  addLayer('sar', 'data/rutas.geojson', '#FF6B00');

  // === 4️⃣ CAPA DE SENSORES (puntos con popups) ===
  fetch('data/sensores.geojson')
    .then(res => {
      if (!res.ok) throw new Error(`Error al cargar sensores.geojson (${res.status})`);
      return res.json();
    })
    .then(data => {
      data.features.forEach(f => {
        const el = document.createElement('div');
        el.className = 'circle-marker alert';

        const [lon, lat] = f.geometry.coordinates;
        const popupHTML = `
          <div class="popup-title">${f.properties.nombre}</div>
          <div class="popup-meta">
            <strong>Tipo:</strong> ${f.properties.tipo}<br>
            <strong>Estado:</strong> ${f.properties.estado}
          </div>`;

        new maplibregl.Marker(el)
          .setLngLat([lon, lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML))
          .addTo(map);
      });
    })
    .catch(err => console.error('❌ Error cargando sensores.geojson:', err));


  // === 5️⃣ TOGGLES DE CAPAS BASE ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  // 🗻 Toggle RELIEVE
  if (toggleHillshade) {
    toggleHillshade.addEventListener('click', () => {
      const vis = map.getLayoutProperty('hillshade-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('hillshade-layer', 'visibility', newVis);
      toggleHillshade.classList.toggle('active', newVis === 'visible');

      // apaga satélite si se activa relieve
      if (newVis === 'visible') {
        map.setLayoutProperty('satellite-layer', 'visibility', 'none');
        toggleSat?.classList.remove('active');
      }
    });
  }

  // 🛰️ Toggle SATÉLITE
  if (toggleSat) {
    toggleSat.addEventListener('click', () => {
      const vis = map.getLayoutProperty('satellite-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('satellite-layer', 'visibility', newVis);
      toggleSat.classList.toggle('active', newVis === 'visible');

      // apaga relieve si se activa satélite
      if (newVis === 'visible') {
        map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
        toggleHillshade?.classList.remove('active');
      }
    });
  }
});


// === BOTÓN DE REGRESO ===
const btnBack = document.getElementById('btn-back');
if (btnBack) {
  btnBack.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
}
