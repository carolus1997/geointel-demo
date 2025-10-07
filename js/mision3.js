// === MAPA BASE ===
const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-2.5, 32.5], // centro aproximado didáctico (ajusta al AOI real que simules)
  zoom: 8.2,
  attributionControl: false
});
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === HELPER: Toggle capa vectorial (fill/line/circle) ===
function addGeoLayer({ id, path, type, paint = {}, layout = {}, promoteId }) {
  if (map.getSource(id)) return;
  map.addSource(id, { type: 'geojson', data: path, promoteId });
  map.addLayer({ id, type, source: id, paint, layout });
}

// === CARGA CAPAS ===
map.on('load', () => {
  // AOI (polígono)
  addGeoLayer({
    id: 'aoi',
    path: 'data/AOI.geojson',
    type: 'fill',
    paint: {
      'fill-color': '#00C896',
      'fill-opacity': 0.15,
      'fill-outline-color': '#00C896'
    }
  });

  // Zonas con ΔNDVI/ΔSAR (polígonos)
  addGeoLayer({
    id: 'cambios',
    path: 'data/cambios_derivados.geojson',
    type: 'fill',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'], ['coalesce', ['get', 'delta'], 0],
        -0.2, '#6B2A00',
        -0.05, '#8A5B00',
        0, '#444444',
        0.1, '#1e6b4a',
        0.2, '#00C896'
      ],
      'fill-opacity': 0.35,
      'fill-outline-color': '#1F262E'
    }
  });

  // Conducciones (líneas)
  addGeoLayer({
    id: 'conducciones',
    path: 'data/conducciones_osm.geojson',
    type: 'line',
    paint: {
      'line-color': '#9AA4AE',
      'line-width': 2,
      'line-dasharray': [2, 2]
    }
  });

  // Instalaciones (puntos como circles “neutros”)
  addGeoLayer({
    id: 'instalaciones',
    path: 'data/instalaciones.geojson',
    type: 'circle',
    paint: {
      'circle-radius': 4,
      'circle-color': '#00E5FF',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFFFFF'
    }
  });

  // Poblados (puntos)
  addGeoLayer({
    id: 'poblados',
    path: 'data/poblados.geojson',
    type: 'circle',
    paint: {
      'circle-radius': 3.5,
      'circle-color': '#B3B8BD',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#1F262E'
    }
  });

  // Pozos (marcadores circulares con riesgo: bajo/medio/alto)
  fetch('data/pozos.geojson')
    .then(r => r.json())
    .then(fc => {
      fc.features.forEach(f => {
        const [lon, lat] = f.geometry.coordinates;
        const props = f.properties || {};
        const riesgo = props.riesgo || 0; // 0..1
        const riesgoClas =
          riesgo >= 0.66 ? 'alto' : (riesgo >= 0.33 ? 'medio' : 'bajo');

        // elemento circular
        const el = document.createElement('div');
        el.className = 'circle-marker';
        el.style.boxShadow = '0 0 8px rgba(0, 229, 255, 0.7)';
        el.style.backgroundColor =
          riesgoClas === 'alto' ? '#FF2B2B' :
          riesgoClas === 'medio' ? '#FFA500' : '#00E5FF';

        // popup táctico
        const popupHTML = `
          <div class="popup-title">${props.nombre || 'Pozo'}</div>
          <div class="popup-meta">
            <div><strong>Riesgo:</strong> <span>${riesgoClas.toUpperCase()}</span></div>
            <div><strong>ΔNDVI:</strong> <span>${(props.delta_ndvi ?? 0).toFixed(2)}</span></div>
            <div><strong>ΔSAR dB:</strong> <span>${(props.delta_sar_db ?? 0).toFixed(2)}</span></div>
            <div><strong>Población dependiente:</strong> <span>${props.pobl_dep ?? '—'}</span></div>
          </div>
          <div class="popup-footer">
            <button onclick="centrarM3(${lon},${lat})">Centrar</button>
          </div>
        `;

        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lon, lat])
          .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(popupHTML))
          .addTo(map);
      });
    });

  // Checkboxes
  bindToggles();
});

// === CENTRAR desde popup ===
function centrarM3(lon, lat) {
  map.flyTo({ center: [lon, lat], zoom: 12.5 });
}

// === TOGGLES ===
function bindToggles() {
  const setVis = (id, on) => {
    if (!map.getLayer(id)) return;
    map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
  };

  document.getElementById('chk-aoi').addEventListener('change', e => setVis('aoi', e.target.checked));
  document.getElementById('chk-cambios').addEventListener('change', e => setVis('cambios', e.target.checked));
  document.getElementById('chk-conducciones').addEventListener('change', e => setVis('conducciones', e.target.checked));
  document.getElementById('chk-instalaciones').addEventListener('change', e => setVis('instalaciones', e.target.checked));
  document.getElementById('chk-poblados').addEventListener('change', e => setVis('poblados', e.target.checked));
  // Pozos son Markers HTML, se controlan fácil ocultando/mostrando por clase si lo necesitas
}

// === BOTÓN REGRESO ===
document.getElementById('btn-back').addEventListener('click', () => {
  // marcamos intro vista para no repetir al volver
  sessionStorage.setItem('introSeen', 'true');
  transitionTo('index.html');
});
