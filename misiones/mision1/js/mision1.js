import { renderZonasRiesgo } from './puntosRiesgo.js';

const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === Crear el mapa ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-3.7038, 40.4168],
  zoom: 10.5,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});

// === Controles básicos ===
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === Al cargar el mapa ===
map.on('load', () => {
  map.once('idle', () => {
    document.getElementById('map').classList.add('ready');
    map.resize();
    map.triggerRepaint();
  });

  // === CAPAS BASE: RELIEVE Y SATÉLITE ===
  const firstLayerId = map.getStyle().layers[0].id;

  map.addSource('hillshade', {
    type: 'raster',
    tiles: [`https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

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
    layout: { visibility: 'visible' }
  }, firstLayerId);

  map.addSource('satellite', {
    type: 'raster',
    tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`],
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

  // === TOGGLES DE CAPA BASE ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  function updateBasemapState(activeLayer) {
    const isHillshade = activeLayer === 'hillshade';
    const isSatellite = activeLayer === 'satellite';

    map.setLayoutProperty('hillshade-layer', 'visibility', isHillshade ? 'visible' : 'none');
    map.setLayoutProperty('satellite-layer', 'visibility', isSatellite ? 'visible' : 'none');

    toggleHillshade?.classList.toggle('active', isHillshade);
    toggleSat?.classList.toggle('active', isSatellite);
    map.triggerRepaint();
  }

  toggleHillshade?.addEventListener('click', () => {
    const active = toggleHillshade.classList.contains('active');
    updateBasemapState(active ? null : 'hillshade');
  });

  toggleSat?.addEventListener('click', () => {
    const active = toggleSat.classList.contains('active');
    updateBasemapState(active ? null : 'satellite');
  });

  // === HUD ZONAS DE RIESGO ===
  try {
    renderZonasRiesgo(map);
  } catch (e) {
    console.warn("⚠️ No se pudo cargar renderZonasRiesgo:", e);
  }

  // === TOOLBOX + DIBUJO ===
  try {
    console.log("📦 Comprobando si MapboxDraw está definido...");
    console.log("🧪 typeof MapboxDraw:", typeof MapboxDraw);

    if (typeof MapboxDraw === 'undefined') {
      throw new Error("❌ MapboxDraw no está definido. Posible fallo en la carga del script.");
    }

    console.log("✅ MapboxDraw está definido, intentando instanciar...");

    const Draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: { "fill-color": "#00E5FF", "fill-opacity": 0.1 }
        },
        {
          id: "gl-draw-line-active",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
          paint: { "line-color": "#00C896", "line-width": 2 }
        },
        {
          id: "gl-draw-point-active",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["!=", "mode", "static"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#FF6B00",
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 1.5
          }
        }
      ]
    });

    console.log("✅ Instancia de MapboxDraw creada.");
    console.log("🧭 Comprobando si 'map' está definido:", typeof map);

    map.addControl(Draw, 'top-right');
    console.log("✅ Control Draw añadido al mapa.");

    if (typeof Toolbox === 'undefined') {
      throw new Error("❌ Toolbox no está definido. ¿Cargaste ui_toolbox.js correctamente?");
    }

    console.log("🧪 Iniciando Toolbox...");
    Toolbox.init(map, Draw);
    console.log("✅ Toolbox inicializado.");

  } catch (err) {
    console.error("❌ Error al inicializar Toolbox o Draw:", err);
  }

});

// === HUD COORDENADAS Y HORA ===
const coordDisplay = document.getElementById('coords');
const timeDisplay = document.getElementById('time');

if (coordDisplay) {
  map.on('mousemove', e => {
    const { lng, lat } = e.lngLat;
    coordDisplay.textContent = `${lng.toFixed(4)}, ${lat.toFixed(4)}`;
  });
}

if (timeDisplay) {
  const updateTime = () => {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' });
  };
  setInterval(updateTime, 1000);
  updateTime();
}

// === BOTÓN REGRESO ===
document.getElementById('btn-back')?.addEventListener('click', () => {
  window.location.href = '../../index.html';
});
