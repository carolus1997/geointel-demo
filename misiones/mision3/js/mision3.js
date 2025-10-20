const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA BASE (Dark Matter + controles) ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-2.5, 32.5],
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
    document.getElementById('map').classList.add('ready');
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

  map.addLayer({
    id: 'satellite-layer',
    type: 'raster',
    source: 'satellite',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' }
  }, firstLayerId);

  // === 3️⃣ CAPAS GEOJSON CON ESTILOS ===

  // --- RED VIAL ---
  // --- RED VIAL (líneas base) ---
  addGeoLayer({
    id: 'red-vial',
    path: './data/redVial.geojson',
    type: 'line',
    paint: {
      'line-color': [
        'match',
        ['get', 'highway'],
        'motorway', '#ff3b30',
        'primary', '#ff9500',
        'secondary', '#ffd60a',
        'tertiary', '#f7f7f7',
        'unclassified', '#b0b0b0',
        'track', '#996633',
      /* default */ '#cfcfcf'
      ],
      'line-width': [
        'case',
        ['==', ['get', 'highway'], 'motorway'], 2.8,
        ['==', ['get', 'highway'], 'primary'], 2.2,
        ['==', ['get', 'highway'], 'secondary'], 1.8,
        ['==', ['get', 'highway'], 'tertiary'], 1.3,
        ['==', ['get', 'highway'], 'track'], 0.8,
        1.0
      ],
      'line-opacity': 0.9
    }
  });


  // --- ETIQUETAS DE CARRETERAS (campo ref con fondo simulado) ---
  addGeoLayer({
    id: 'red-vial-labels',
    path: './data/redVial.geojson',
    type: 'symbol',
    layout: {
      'symbol-placement': 'line',             // el texto sigue la carretera
      'text-field': ['get', 'ref'],
      'text-font': ['Arial Bold', 'Arial Unicode MS Regular'],
      'text-size': 10,
      'text-allow-overlap': false,
      'text-ignore-placement': false,
      'symbol-spacing': 400,
      'text-offset': [0, 0],
    },
    paint: {
      // === COLOR DE TEXTO SEGÚN TIPO ===
      'text-color': [
        'match',
        ['get', 'highway'],
        'motorway', '#ffffff',     // texto blanco en fondo azul
        'primary', '#000000',      // texto negro
        'secondary', '#000000',
        'tertiary', '#000000',
        'track', '#000000',
        '#000000'
      ],

      // === SIMULACIÓN DE FONDO CON HALO GRUESO ===
      'text-halo-color': [
        'match',
        ['get', 'highway'],
        'motorway', '#004C99',     // fondo azul autovía
        'primary', '#ffcc00',      // fondo amarillo
        'secondary', '#ffffff',    // fondo blanco
        'tertiary', '#d9d9d9',     // gris claro
        'track', '#e6e6e6',
        '#cccccc'
      ],
      'text-halo-width': 4,        // halo ancho = simula rectángulo
      'text-halo-blur': 0.5,
      'text-opacity': 0.95
    }
  });



  // --- ASENTAMIENTOS (etiquetas) ---
  addGeoLayer({
    id: 'asentamientos',
    path: './data/asentamientosAldeas.geojson',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'name:fr'],
      'text-font': ['Neo Sans Medium', 'Arial Unicode MS Regular'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        6, 10,
        12, 14
      ],
      'text-offset': [0, 0],
      'text-anchor': 'center',
      'text-allow-overlap': false
    },
    paint: {
      'text-color': '#cccccc',
      'text-halo-color': '#000000',
      'text-halo-width': 1.0,
      'text-opacity': 0.95
    }
  });

  // --- POZOS ---
  addGeoLayer({
    id: 'pozos',
    path: './data/pozos.geojson',
    type: 'circle',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        6, 3,
        12, 6
      ],
      'circle-color': '#00c9ff',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.2,
      'circle-opacity': 0.95
    }
  });

  // --- ANTENAS TELECOM (verde fosforito) ---
  map.loadImage('../../img/icons/signal-round-svgrepo-com.png', (error, image) => {
    if (error) throw error;
    if (!map.hasImage('icon-antena')) map.addImage('icon-antena', image);

    addGeoLayer({
      id: 'antenas',
      path: './data/antenasTelecomunicaciones.geojson',
      type: 'symbol',
      layout: {
        'icon-image': 'icon-antena',
        'icon-size': 0.048,              // ≈ 20 px para PNG 256x256
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      },
      paint: {
        'icon-opacity': 0.95
      }
    });
  });

  // === GESTIÓN DE TOGGLES ===
  function bindToggles() {
    const toggleHillshade = document.getElementById('toggle-hillshade');
    const toggleSat = document.getElementById('toggle-sat');

    if (!toggleHillshade || !toggleSat) return console.warn("⚠️ Botones de capas base no encontrados.");

    toggleHillshade.addEventListener('click', () => {
      const vis = map.getLayoutProperty('hillshade-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('hillshade-layer', 'visibility', newVis);
      toggleHillshade.classList.toggle('active', newVis === 'visible');

      // apagar satélite si se enciende relieve
      if (newVis === 'visible') {
        map.setLayoutProperty('satellite-layer', 'visibility', 'none');
        toggleSat.classList.remove('active');
      }
    });

    toggleSat.addEventListener('click', () => {
      const vis = map.getLayoutProperty('satellite-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('satellite-layer', 'visibility', newVis);
      toggleSat.classList.toggle('active', newVis === 'visible');

      // apagar relieve si se enciende satélite
      if (newVis === 'visible') {
        map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
        toggleHillshade.classList.remove('active');
      }
    });
  }

  // === TOOLBOX + DIBUJO ===
  try {
    if (typeof MapboxDraw === 'undefined') throw new Error("MapboxDraw no está definido.");

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

    map.addControl(Draw, 'top-right');

    if (typeof Toolbox === 'undefined') throw new Error("Toolbox no está definido.");

    Toolbox.init(map, Draw);
  } catch (err) {
    console.error("❌ Error al inicializar Toolbox o Draw:", err);
  }

  // === ACTIVAR TOGGLES DE BASEMAP ===
  bindToggles();
});

// === BOTÓN REGRESO ===
document.getElementById('btn-back').addEventListener('click', () => {
  sessionStorage.setItem('introSeen', 'true');
  window.location.href = '../../index.html';
});
