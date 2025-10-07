// === CONFIG MAPLIBRE ===
const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/darkmatter/style.json?key=rk78lPIZURCYo6I9QQdi`,
    center: [13.19, 32.887], // Trípoli
    zoom: 12
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// === CAPAS GEOJSON ===
function addLayer(srcId, dataPath, color) {
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

map.on('load', () => {
    addLayer('cambios', 'data/cambios_opticos.geojson', '#00C896');
    addLayer('sar', 'data/rutas.geojson', '#FF6B00');

    // === Sensores ===
    fetch('data/sensores.geojson')
        .then(res => res.json())
        .then(data => {
            data.features.forEach(f => {
                const el = document.createElement('div');
                el.className = 'circle-marker alert';
                const [lon, lat] = f.geometry.coordinates;
                const popupHTML = `
            <div class="popup-title">${f.properties.nombre}</div>
            <div class="popup-meta">
              <strong>Tipo:</strong> ${f.properties.tipo}<br>
              <strong>Estado:</strong> ${f.properties.estado}
            </div>`;
                new maplibregl.Marker(el)
                    .setLngLat([lon, lat])
                    .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML))
                    .addTo(map);
            });
        });
});

// === BOTÓN DE REGRESO ===
// === BOTÓN "CENTRO DE OPERACIONES" ===
document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = 'index.html';
});
