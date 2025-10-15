const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA BASE (Dark Matter + controles) ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-2.5, 32.5], // centro didáctico (ajusta al AOI)
  zoom: 8.2,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === HELPER GENERAL ===
function addGeoLayer({ id, path, type, paint = {}, layout = {}, promoteId }) {
  if (map.getSource(id)) return;
  map.addSource(id, { type: 'geojson', data: path, promoteId });
  map.addLayer({ id, type, source: id, paint, layout });
}

// === EVENTO PRINCIPAL ===
map.on('load', () => {

  map.once('idle', () => {
    document.getElementById('map').classList.add('ready'); // ← activa el fade-in
    map.resize();
    map.triggerRepaint();
  });

  // === 1️⃣ CAPA DE RELIEVE ===
  map.addSource('hillshade', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

  const firstLayerId = map.getStyle().layers[0].id;

  map.addLayer({
    id: 'hillshade-layer',
    type: 'raster',
    source: 'hillshade',
    paint: {
      'raster-opacity': 0.45,
      'raster-contrast': 0.25,
      'raster-brightness-min': 0.7,
      'raster-brightness-max': 1.0
    },
    layout: { visibility: 'none' }
  }, firstLayerId);

  // === 2️⃣ CAPA SATÉLITE ===
  map.addSource('satellite', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

  map.addLayer({
    id: 'satellite-layer',
    type: 'raster',
    source: 'satellite',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' }
  });

  
});

// === CENTRAR MAPA DESDE POPUP ===
function centrarM3(lon, lat) {
  map.flyTo({ center: [lon, lat], zoom: 12.5 });
}

// === GESTIÓN DE TOGGLES ===
function bindToggles() {
  const setVis = (id, on) => {
    if (!map.getLayer(id)) return;
    map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
  };

  document.getElementById('chk-aoi').addEventListener('change', e => setVis('aoi', e.target.checked));
  document.getElementById('chk-cambios').addEventListener('change', e => setVis('cambios', e.target.checked));
  document.getElementById('chk-conducciones').addEventListener('change', e => setVis('conducciones', e.target.checked));
  document.getElementById('chk-instalaciones').addEventListener('change', e => setVis('instalaciones', e.target.checked));
  document.getElementById('chk-poblados').addEventListener('change', e => setVis('poblados', e.target.checked));

  // === TOGGLES DE CAPAS BASE ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  if (toggleHillshade) {
    toggleHillshade.addEventListener('click', () => {
      const vis = map.getLayoutProperty('hillshade-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('hillshade-layer', 'visibility', newVis);
      toggleHillshade.classList.toggle('active', newVis === 'visible');

      // si se activa relieve → apaga satélite
      if (newVis === 'visible') {
        map.setLayoutProperty('satellite-layer', 'visibility', 'none');
        toggleSat?.classList.remove('active');
      }
    });
  }

  if (toggleSat) {
    toggleSat.addEventListener('click', () => {
      const vis = map.getLayoutProperty('satellite-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('satellite-layer', 'visibility', newVis);
      toggleSat.classList.toggle('active', newVis === 'visible');

      // si se activa satélite → apaga relieve
      if (newVis === 'visible') {
        map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
        toggleHillshade?.classList.remove('active');
      }
    });
  }
}

// === BOTÓN REGRESO ===
document.getElementById('btn-back').addEventListener('click', () => {
  sessionStorage.setItem('introSeen', 'true');
  window.location.href = '../../index.html';
});
