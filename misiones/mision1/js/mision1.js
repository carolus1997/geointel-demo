const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA BASE PRINCIPAL (DARKMATTER) ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-3.7038, 40.4168], // Madrid
  zoom: 10.5,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === EVENTO DE CARGA PRINCIPAL ===
map.on('load', () => {

  // === 1️⃣ CAPA DE RELIEVE (HILLSHADE) ===
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
    layout: { visibility: 'none' } // oculta al inicio
  }, firstLayerId); // debajo de todo


  // === 2️⃣ CAPA SATÉLITE (encima de todo, sin etiquetas visibles) ===
  map.addSource('satellite', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

  // sin beforeId -> se añade al tope (encima de todo)
  map.addLayer({
    id: 'satellite-layer',
    type: 'raster',
    source: 'satellite',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' } // oculta al inicio
  });


  // === 3️⃣ CAPA DE MEZQUITAS (GeoServer Docker) ===
  map.addSource('mezquitas', {
    type: 'geojson',
    data: 'http://172.29.48.1:8060/geoserver/geointel/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geointel:Mezquitas&outputFormat=application/json'
  });

  map.addLayer({
    id: 'mezquitas-layer',
    type: 'circle',
    source: 'mezquitas',
    paint: {
      'circle-radius': 5,
      'circle-color': '#FF6B00',
      'circle-stroke-color': '#FFF',
      'circle-stroke-width': 1
    }
  });

  // === POPUPS ===
  map.on('click', 'mezquitas-layer', e => {
    const f = e.features[0];
    const props = f.properties;
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>${props.nombre || 'Mezquita sin nombre'}</strong><br>
        <em>${props.distrito || 'Distrito no especificado'}</em><br>
        <strong>Tipo:</strong> ${props.tipo || 'Centro religioso'}
      `)
      .addTo(map);
  });


  // === 4️⃣ TOGGLES DE CAPAS BASE (LÓGICA COMBINADA) ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  function updateBasemapState(activeLayer) {
    const darkLayers = map.getStyle().layers.filter(l => l.id.includes('background'));

    // 🔹 Estado RELIEVE
    if (activeLayer === 'hillshade') {
      map.setLayoutProperty('hillshade-layer', 'visibility', 'visible');
      map.setLayoutProperty('satellite-layer', 'visibility', 'none');
      darkLayers.forEach(l => map.setPaintProperty(l.id, 'background-opacity', 0.65));

      toggleHillshade.classList.add('active');
      toggleSat.classList.remove('active');
    }

    // 🔹 Estado SATÉLITE
    else if (activeLayer === 'satellite') {
      map.setLayoutProperty('satellite-layer', 'visibility', 'visible');
      map.setLayoutProperty('hillshade-layer', 'visibility', 'none');

      // opacidad 0 del dark (para evitar superposición visual)
      darkLayers.forEach(l => map.setPaintProperty(l.id, 'background-opacity', 0.0));

      toggleSat.classList.add('active');
      toggleHillshade.classList.remove('active');
    }

    // 🔹 Estado DARK PURO
    else {
      map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
      map.setLayoutProperty('satellite-layer', 'visibility', 'none');
      darkLayers.forEach(l => map.setPaintProperty(l.id, 'background-opacity', 1.0));

      toggleHillshade.classList.remove('active');
      toggleSat.classList.remove('active');
    }
  }

  // === EVENTOS DE BOTONES ===
  if (toggleHillshade) {
    toggleHillshade.addEventListener('click', () => {
      const isActive = toggleHillshade.classList.contains('active');
      updateBasemapState(isActive ? null : 'hillshade');
    });
  }

  if (toggleSat) {
    toggleSat.addEventListener('click', () => {
      const isActive = toggleSat.classList.contains('active');
      updateBasemapState(isActive ? null : 'satellite');
    });
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
  function updateTime() {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' });
  }
  setInterval(updateTime, 1000);
  updateTime();
}


// === BOTÓN DE REGRESO ===
const btnBack = document.getElementById('btn-back');
if (btnBack) {
  btnBack.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
}
