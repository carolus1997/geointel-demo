import { renderZonasRiesgo } from './puntosRiesgo.js';
import { initLayersControl } from './layersControl.js';

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
  window.map = map; // Para acceder desde consola

  map.once('idle', () => {
    document.getElementById('map').classList.add('ready');
    map.resize();
    map.triggerRepaint();
  });

  // === CAPAS BASE: RELIEVE Y SATÉLITE ===

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
  // === CARGA DE CAPAS GEOJSON ===
  const dataPath = './data/';

  // === Dentro de mision1.js ===
  async function addGeoJSONLayer(id, file, type, paint, visible = false) {
    const res = await fetch(`${dataPath}${file}`);
    if (!res.ok) return console.warn(`⚠️ No se pudo cargar ${file}`);
    const data = await res.json();

    map.addSource(id, { type: 'geojson', data });

    // 🧹 Eliminar propiedades no soportadas por MapLibre
    if (type === 'fill') {
      delete paint['fill-outline-width'];
    }

    const layer = { id, type, source: id, paint, layout: { visibility: visible ? 'visible' : 'none' } };

    const lastLayer = map.getStyle().layers.at(-1).id;
    map.addLayer(layer, lastLayer);

    console.log(`✅ Capa añadida: ${id}`);
  }


  // === CARGA DE TODAS LAS CAPAS ===
  (async () => {
    const styles = await (await fetch('./data/estilos/data/styles.json')).json();

    const capas = [
      ['barrios', 'barrios.geojson', 'fill', { 'fill-opacity': 0 }],
      ['Comisarias', 'comisarias.geojson', 'circle', styles.Comisarias],
      ['Mezquitas', 'Mezquitas.geojson', 'circle', styles.Mezquitas],
      ['Parques', 'Parques.geojson', 'fill', styles.Parques],
      ['FuentesAgua', 'FuentesAguaParques.geojson', 'circle', styles.FuentesAgua],
      ['BancosParques', 'BancosParques.geojson', 'circle', styles.BancosParques],
      ['EstacionesMetro', 'EstacionesMetro.geojson', 'circle', styles.EstacionesMetro],
      ['bufferMetro', '200mMetro.geojson', 'fill', styles['200mMetro']],
      ['SSCCDemografia', 'SSCCDemografia.geojson', 'fill', styles.SSCC]
    ];

    // Añadir capas
    for (const [id, file, type, paint] of capas) {
      await addGeoJSONLayer(id, file, type, paint, id === 'barrios');
    }

    // Esperar un poco
    await new Promise(r => setTimeout(r, 200));

    // Añadir etiquetas de barrios
    map.addLayer({
      id: 'barrios-labels',
      type: 'symbol',
      source: 'barrios',
      layout: {
        'text-field': ['get', 'NOMBRE'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-allow-overlap': false,
        'text-offset': [0, 0.8],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1.2
      }
    });

    // Crear panel de capas (sin barrios)
    initLayersControl(map, [
      { id: 'barrios-labels', name: 'Barrios', visible: true },
      { id: 'Comisarias', name: 'Comisarías', visible: false },
      { id: 'Mezquitas', name: 'Mezquitas', visible: false },
      { id: 'Parques', name: 'Parques', visible: false },
      { id: 'FuentesAgua', name: 'Fuentes de agua', visible: false },
      { id: 'BancosParques', name: 'Bancos de parques', visible: false },
      { id: 'EstacionesMetro', name: 'Estaciones de metro', visible: false },
      { id: 'bufferMetro', name: 'Área 200 m de metro', visible: false },
      { id: 'SSCCDemografia', name: 'Demografía (SSCC)', visible: false }
    ]);
  })();



  map.triggerRepaint();



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
