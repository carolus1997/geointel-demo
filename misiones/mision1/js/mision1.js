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
  map.once('idle', () => {
    document.getElementById('map').classList.add('ready');
    map.resize();
    map.triggerRepaint();
  });


  // === CARGA DE CAPAS GEOJSON ===
  const dataPath = './data/';

  // === Dentro de mision1.js ===
  async function addGeoJSONLayer(id, file, type, paint, visible = false) {
    const res = await fetch(`${dataPath}${file}`);
    if (!res.ok) return console.warn(`⚠️ No se pudo cargar ${file}`);
    const data = await res.json();

    map.addSource(id, { type: 'geojson', data });
    const layer = { id, type, source: id, paint, layout: { visibility: visible ? 'visible' : 'none' } };

    // 🟢 Añadir encima de todo
    const lastLayer = map.getStyle().layers.at(-1).id;
    map.addLayer(layer, lastLayer);

    console.log(`✅ Capa añadida: ${id}`);
  }

  // === CARGA DE TODAS LAS CAPAS ===
  (async () => {
  const capas = [
    ['barrios', 'barrios.geojson', 'fill', { 'fill-color': '#f2ca50', 'fill-opacity': 0.4 }],
    ['comisarias', 'comisarias.geojson', 'circle', { 'circle-color': '#00C896', 'circle-radius': 6 }],
    ['Mezquitas', 'Mezquitas.geojson', 'circle', { 'circle-color': '#00E5FF', 'circle-radius': 6 }],
    ['Parques', 'Parques.geojson', 'fill', { 'fill-color': '#00FF88', 'fill-opacity': 0.4 }],
    ['Fuentes', 'FuentesAguaParques.geojson', 'circle', { 'circle-color': '#00BFFF', 'circle-radius': 4 }],
    ['BancosParques', 'BancosParques.geojson', 'circle', { 'circle-color': '#FF8C00', 'circle-radius': 4 }],
    ['EstacionesMetro', 'EstacionesMetro.geojson', 'circle', { 'circle-color': '#FFD700', 'circle-radius': 6 }],
    ['bufferMetro', '200mMetro.geojson', 'fill', { 'fill-color': '#8A2BE2', 'fill-opacity': 0.3 }],
    ['SSCCDemografia', 'SSCCDemografia.geojson', 'fill', { 'fill-color': '#C71585', 'fill-opacity': 0.3 }]
  ];

  // 1️⃣ Añadir todas las capas y esperar
  for (const [id, file, type, paint] of capas) {
    await addGeoJSONLayer(id, file, type, paint, id === 'barrios');
  }

  // 2️⃣ Esperar un frame para que se registren
  await new Promise(r => setTimeout(r, 200));

  // 3️⃣ Crear el panel solo cuando existan las capas
  initLayersControl(map, [
    { id: 'barrios', name: 'Barrios', visible: true },
    { id: 'comisarias', name: 'Comisarías', visible: false },
    { id: 'Mezquitas', name: 'Mezquitas', visible: false },
    { id: 'Parques', name: 'Parques', visible: false },
    { id: 'Fuentes', name: 'Fuentes de agua', visible: false },
    { id: 'BancosParques', name: 'Bancos de parques', visible: false },
    { id: 'EstacionesMetro', name: 'Estaciones de metro', visible: false },
    { id: 'bufferMetro', name: 'Área 200 m de metro', visible: false },
    { id: 'SSCCDemografia', name: 'Demografía (SSCC)', visible: false }
  ]);
 

})();

 map.triggerRepaint();

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
