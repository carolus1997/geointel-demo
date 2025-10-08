const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA BASE ===
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

// === HUD COORDENADAS Y HORA ===
const coordDisplay = document.getElementById('coords');
const timeDisplay = document.getElementById('time');

map.on('mousemove', e => {
  const { lng, lat } = e.lngLat;
  coordDisplay.textContent = `${lng.toFixed(4)}, ${lat.toFixed(4)}`;
});

function updateTime() {
  const now = new Date();
  timeDisplay.textContent = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' });
}
setInterval(updateTime, 1000);

// === CAPAS GEOJSON ===
map.on('load', () => {
  // 🔹 Zonas de vulnerabilidad (polígonos)
  map.addSource('zonas', {
    type: 'geojson',
    data: 'data/zonas_vulnerabilidad.geojson'
  });

  map.addLayer({
    id: 'zonas-layer',
    type: 'fill',
    source: 'zonas',
    paint: {
      'fill-color': '#FF2B2B',
      'fill-opacity': 0.25,
      'fill-outline-color': '#FF4D4D'
    },
    layout: { visibility: 'none' }
  });

  // 🔹 Incidentes registrados (puntos)
  map.addSource('incidentes', {
    type: 'geojson',
    data: 'data/incidentes.geojson'
  });

  map.addLayer({
    id: 'incidentes-layer',
    type: 'circle',
    source: 'incidentes',
    paint: {
      'circle-radius': 5,
      'circle-color': '#FFA500',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    },
    layout: { visibility: 'none' }
  });

  // 🔹 Mezquitas y centros religiosos (puntos)
  map.addSource('mezquitas', {
    type: 'geojson',
    data: 'data/mezquitas.geojson'
  });

  map.addLayer({
    id: 'mezquitas-layer',
    type: 'symbol',
    source: 'mezquitas',
    layout: {
      'icon-image': 'religious-muslim-15',
      'icon-size': 1,
      'visibility': 'none'
    }
  });

  // === POPUPS INTERACTIVOS ===
  map.on('click', 'incidentes-layer', e => {
    const f = e.features[0];
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>Tipo:</strong> ${f.properties.tipo}<br>
        <strong>Fecha:</strong> ${f.properties.fecha}<br>
        <strong>Descripción:</strong> ${f.properties.descripcion || 'Sin datos'}
      `)
      .addTo(map);
  });

  map.on('click', 'mezquitas-layer', e => {
    const f = e.features[0];
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>${f.properties.nombre}</strong><br>
        <em>${f.properties.distrito || ''}</em><br>
        Tipo: ${f.properties.tipo || 'Centro religioso'}
      `)
      .addTo(map);
  });
});

// === CHECKBOX DE CAPAS ===
document.getElementById('chk-zonas').addEventListener('change', e => {
  map.setLayoutProperty('zonas-layer', 'visibility', e.target.checked ? 'visible' : 'none');
});

document.getElementById('chk-incidentes').addEventListener('change', e => {
  map.setLayoutProperty('incidentes-layer', 'visibility', e.target.checked ? 'visible' : 'none');
});

document.getElementById('chk-mezquitas').addEventListener('change', e => {
  map.setLayoutProperty('mezquitas-layer', 'visibility', e.target.checked ? 'visible' : 'none');
});

// === BOTÓN DE REGRESO ===
document.getElementById('btn-back').addEventListener('click', () => {
  window.location.href = '../../index.html';
});

// === TRANSICIÓN ENTRE MISIONES ===
function transitionTo(url) {
  const overlay = document.createElement('div');
  overlay.id = 'transition-overlay';
  document.body.appendChild(overlay);
  setTimeout(() => { window.location.href = url; }, 800);
}
