const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA BASE ===
const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
    center: [-1.65, 37.6],
    zoom: 7.3,
    pitch: 0,
    bearing: 0,
    attributionControl: false
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === HUD ===
const coordDisplay = document.getElementById('coords');
const timeDisplay = document.getElementById('time');

map.on('mousemove', e => {
    const { lng, lat } = e.lngLat;
    coordDisplay.textContent = `${lng.toFixed(4)}, ${lat.toFixed(4)}`;
});

function updateTime() {
    const now = new Date();
    timeDisplay.textContent = now.toUTCString().slice(17, 25);
}
setInterval(updateTime, 1000);

// === CARGAR CAPAS ===
map.on('load', () => {

    // Sensores (puntos)
    map.addSource('sensores', {
        type: 'geojson',
        data: 'data/mision1/sensores.geojson'
    });

    map.addLayer({
        id: 'sensores-layer',
        type: 'circle',
        source: 'sensores',
        paint: {
            'circle-radius': 6,
            'circle-color': '#00E5FF',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#FFFFFF'
        },
        layout: { visibility: 'none' }
    });

    // Rutas (líneas)
    map.addSource('rutas', {
        type: 'geojson',
        data: 'data/mision1/rutas.geojson'
    });

    map.addLayer({
        id: 'rutas-layer',
        type: 'line',
        source: 'rutas',
        paint: {
            'line-width': 2,
            'line-color': '#FF6B00'
        },
        layout: { visibility: 'none' }
    });

    // Crear marcadores animados y popups tácticos
    // Crear marcadores tácticos personalizados
    fetch('data/mision1/sensores.geojson')
        .then(res => res.json())
        .then(data => {
            data.features.forEach(f => {
                const el = document.createElement('div');
                el.className = 'marker-icon';

                // Determinar icono según tipo
                const tipo = f.properties.tipo || 'SIGINT';
                let icono = 'sensor_sigint.svg';
                if (tipo === 'ELINT') icono = 'sensor_elint.svg';
                if (tipo === 'RADAR') icono = 'radar.png';

                el.innerHTML = `<img src="img/icons/${icono}" alt="${tipo}">`;

                const [lon, lat] = f.geometry.coordinates;
                const popupHTML = `
      <div class="popup-title">${f.properties.nombre}</div>
      <div class="popup-meta">
        <strong>Tipo:</strong> <span>${tipo}</span><br>
        <strong>Estado:</strong> <span>${f.properties.estado}</span>
      </div>
    `;

                new maplibregl.Marker(el)
                    .setLngLat([lon, lat])
                    .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML))
                    .addTo(map);
            });
        });


});

// === UI EVENTS ===
document.getElementById('chk-sensores').addEventListener('change', e => {
    map.setLayoutProperty('sensores-layer', 'visibility', e.target.checked ? 'visible' : 'none');
});

document.getElementById('chk-rutas').addEventListener('change', e => {
    map.setLayoutProperty('rutas-layer', 'visibility', e.target.checked ? 'visible' : 'none');
});

// === BOTÓN DE REGRESO ===
// === BOTÓN "CENTRO DE OPERACIONES" ===
document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// === TRANSICIÓN ENTRE MISIONES ===
function transitionTo(url) {
    const overlay = document.createElement('div');
    overlay.id = 'transition-overlay';
    document.body.appendChild(overlay);
  
    setTimeout(() => {
      window.location.href = url;
    }, 800);
  }
  