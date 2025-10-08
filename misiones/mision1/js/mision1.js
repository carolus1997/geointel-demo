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

  // === CAPA DE MEZQUITAS (desde GeoServer Docker) ===
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


  // === POPUP táctico ===
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


});

// === CHECKBOX DE CAPAS ===

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
