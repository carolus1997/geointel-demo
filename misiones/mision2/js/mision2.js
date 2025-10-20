// ==========================
//  Misión 2 — mision2.js
// ==========================

// === CONFIG MAPLIBRE ===
const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-5.35, 35.95], // Estrecho de Gibraltar
  zoom: 9,
  attributionControl: false,
  preserveDrawingBuffer: true
});

// === CONTROLES BÁSICOS ===
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// 🕹️ === CONFIGURACIÓN GLOBAL DE SIMULACIÓN ===
window.SIMULATION_SPEED = 1;   // 1x = velocidad normal
window.SIMULATION_PAUSED = false; // pausa desactivada al inicio

// === UTIL: añadir capa GeoJSON de polígonos (si hiciera falta) ===
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

// === ARRANQUE CUANDO EL MAPA ESTÁ LISTO ===
map.on('load', async () => {
  console.log('🗺️ MapLibre listo');

  // Fade-in del canvas
  map.once('idle', () => {
    const el = document.getElementById('map');
    if (el) el.classList.add('ready');
    map.resize();
    map.triggerRepaint();
  });




  // === 1) CAPAS BASE: RELIEVE + SATÉLITE ===
  try {
    const firstLayerId = map.getStyle().layers?.[0]?.id;

    if (!map.getSource('hillshade')) {
      map.addSource('hillshade', {
        type: 'raster',
        tiles: [
          `https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
        ],
        tileSize: 256,
        attribution: '&copy; MapTiler terrain-hillshade'
      });
    }

    if (!map.getLayer('hillshade-layer')) {
      map.addLayer({
        id: 'hillshade-layer',
        type: 'raster',
        source: 'hillshade',
        paint: {
          'raster-opacity': 0.4,
          'raster-brightness-min': 0.8,
          'raster-brightness-max': 1.0
        },
        layout: { visibility: 'none' }
      }, firstLayerId);
    }

    if (!map.getSource('satellite')) {
      map.addSource('satellite', {
        type: 'raster',
        tiles: [
          `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
        ],
        tileSize: 256,
        attribution: '&copy; MapTiler satellite-v2'
      });
    }

    if (!map.getLayer('satellite-layer')) {
      map.addLayer({
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        paint: { 'raster-opacity': 1.0 },
        layout: { visibility: 'none' }
      });
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron añadir capas base:', e);
  }




  // === 2) RUTAS MARÍTIMAS (líneas de referencia) ===
  try {
    if (!map.getSource('routes')) {
      map.addSource('routes', { type: 'geojson', data: '../../data/Rutas.geojson' });
    }
    if (!map.getLayer('routes-line')) {
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': ['case', ['has', 'stroke'], ['get', 'stroke'], '#00E5FF'],
          'line-width': ['case', ['has', 'stroke-width'], ['get', 'stroke-width'], 2],
          'line-opacity': 0.9
        }
      });
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron añadir las rutas:', e);
  }


  function getBasePath() {
  return window.location.origin + '/misiones/mision2/';
}
  // === 🌬️ Capa de viento local (tileado con gdal2tiles) ===
  try {
    console.log('🌬️ Añadiendo capa de viento local (tiles XYZ)...');

    map.addSource('wind-local', {
      type: 'raster',
      tiles: [`${getBasePath()}tiles/WindMap/{z}/{x}/{y}.png`],
      tileSize: 256,
      attribution: '© WindMap local — Carlos M.P.'
    });

    map.addLayer({
      id: 'wind-local-layer',
      type: 'raster',
      source: 'wind-local',
      paint: {
        'raster-opacity': 0.85,
        'raster-brightness-min': 0.8,
        'raster-brightness-max': 1.0,
        'raster-contrast': 0.15
      },
      layout: { visibility: 'visible' }
    });

    console.log('✅ Capa de viento local añadida correctamente.');
  } catch (err) {
    console.error('❌ Error al añadir capa de viento local:', err);
  }








  // === 3) TOGGLES de base ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  if (toggleHillshade) {
    toggleHillshade.addEventListener('click', () => {
      const vis = map.getLayoutProperty('hillshade-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('hillshade-layer', 'visibility', newVis);
      toggleHillshade.classList.toggle('active', newVis === 'visible');
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
      if (newVis === 'visible') {
        map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
        toggleHillshade?.classList.remove('active');
      }
    });
  }

  const toggleWindLocal = document.getElementById('toggle-wind-local');

  if (toggleWindLocal) {
    toggleWindLocal.addEventListener('click', () => {
      if (!map.getLayer('wind-local-layer')) {
        console.warn('⚠️ La capa de viento todavía no está disponible.');
        return;
      }

      const currentVis = map.getLayoutProperty('wind-local-layer', 'visibility');
      const newVis = currentVis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('wind-local-layer', 'visibility', newVis);
      toggleWindLocal.classList.toggle('active', newVis === 'visible');
    });
  }





  // === 4) Dibujo (Draw) + Toolbox flotante ===
  try {
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

    map.addControl(Draw, "top-right"); // mejor en top-right para no chocar con toolbox

    // 🧩 Inicializar toolbox táctico
    map.once("idle", () => {
      console.log("🧭 Inicializando Toolbox...");
      Toolbox.init(map, Draw);
    });

  } catch (err) {
    console.error("❌ Error al inicializar Draw/Toolbox:", err);
  }


  // === 5) Esperar a que los módulos globales estén listos ===
  await waitForModules(['MovimientoModule', 'RadarModule', 'HelicopterModule']);

  // === 6) Lanzar misión principal ===
  if (typeof startMision2 === 'function') {
    await startMision2();
  } else {
    console.error('❌ startMision2() no está definida.');
  }

  // === 7) Inicializar panel de simulación (si existe)
  if (window.SimulationPanel?.init) SimulationPanel.init();


});


// ————————————————————————————————
// Helpers
// ————————————————————————————————
function waitForModules(names, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    (function check() {
      const missing = names.filter(n => !window[n]);
      if (missing.length === 0) return resolve();
      if (performance.now() - t0 > timeoutMs) {
        console.warn('⏳ Módulos que no llegaron a tiempo:', missing);
        return resolve();
      }
      setTimeout(check, 100);
    })();
  });
}


// ————————————————————————————————
//  Bloque principal de la misión
// ————————————————————————————————
async function startMision2() {
  try {
    console.log('🚀 Iniciando Misión 2...');

    // 1️⃣ Cargar unidades principales
    await MovimientoModule.init(map, '../../data/unidades_maritimas.geojson');
    await waitForModules(['MovimientoModule', 'RadarModule', 'HelicopterModule']);
    if (window.HelicopterRadar?.init) HelicopterRadar.init(map);


    // 2️⃣ Inicializar helicóptero (sobre BAM)
    if (window.HelicopterModule?.init) {
      HelicopterModule.init(map, 'helicoptero');
    }
    if (window.HelicopterRadar?.init) HelicopterRadar.init(map);


    // 3️⃣ Cargar rutas desde GeoJSON
    const routes = await MovimientoModule.loadRoutes('../../data/Rutas.geojson');
    const bamRoute = routes.get('ruta_bam')?.coords;
    const narcoRoute = routes.get('ruta_narcolancha')?.coords;

    // 4️⃣ Animaciones
    const BAM_SPEED = 13;
    const NARCO_SPEED = 20;
    if (bamRoute) MovimientoModule.animateUnit('bam', bamRoute, BAM_SPEED);
    if (narcoRoute) MovimientoModule.animateUnit('narcolancha', narcoRoute, NARCO_SPEED);

    // 5️⃣ Radar + detección
    setTimeout(() => {
      if (window.RadarModule?.init) RadarModule.init(map, 'bam');
      if (window.TacticoModule?.monitorDetection)
        TacticoModule.monitorDetection('bam', 'narcolancha');
    }, 1000);

    console.log('🟢 Misión 2 activada con flujo de intercepción');
  } catch (err) {
    console.error('❌ Error en startMision2:', err);
  }
}


// ————————————————————————————————
//  Botón de regreso
// ————————————————————————————————
const btnBack = document.getElementById('btn-back');
if (btnBack) {
  btnBack.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
}
