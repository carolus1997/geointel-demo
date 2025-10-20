// === CONFIGURACIÓN GENERAL ===
const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA BASE ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-4.21875, 31.42],
  zoom: 8,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === HELPER GENERAL PARA CAPAS GEOJSON ===
function addGeoLayer({ id, path, type, paint = {}, layout = {}, promoteId }) {
  if (map.getSource(id)) {
    console.warn(`⚠️ La fuente ${id} ya existe, se omite.`);
    return;
  }

  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
      return res.json();
    })
    .then(data => {
      map.addSource(id, { type: 'geojson', data, promoteId });
      map.addLayer({ id, type, source: id, paint, layout });
      console.log(`✅ Capa ${id} añadida correctamente.`);
    })
    .catch(err => console.error(`❌ Error añadiendo capa ${id}:`, err));
}

// === CAPAS RASTER ===
map.on('load', () => {
  const rasters = [
    { id: 'ndvi', name: 'ΔNDVI', path: 'tiles/dndvi/{z}/{x}/{y}.png', opacity: 0.95 },
    { id: 'sar', name: 'ΔSAR', path: 'tiles/dsar/{z}/{x}/{y}.png', opacity: 0.65 },
    { id: 'dem', name: 'DEM', path: 'tiles/dem/{z}/{x}/{y}.png', opacity: 0.55 },
    { id: 'thermal', name: 'THERMAL', path: 'tiles/thermal/{z}/{x}/{y}.png', opacity: 0.5 }
  ];

  const styleMap = {
    ndvi: { opacity: 0.5, brightnessMin: 0.3, brightnessMax: 0.9 },
    sar: { opacity: 0.6, contrast: 0.7 },
    dem: { opacity: 0.4, brightnessMax: 0.8 },
    thermal: { opacity: 0.5, contrast: 1.0, brightnessMin: 0.2 }
  };

  rasters.forEach(r => {
    const s = styleMap[r.id] || {};
    map.addSource(r.id, {
      type: 'raster',
      tiles: [r.path],
      tileSize: 256,
      scheme: 'tms',
      minzoom: 6,
      maxzoom: 10,
      bounds: [-2.3, 31.9, -1.7, 32.3]
    });
    map.addLayer({
      id: `${r.id}-layer`,
      type: 'raster',
      source: r.id,
      paint: {
        'raster-opacity': s.opacity ?? 0.6,
        'raster-brightness-min': s.brightnessMin ?? 0,
        'raster-brightness-max': s.brightnessMax ?? 1,
        'raster-contrast': s.contrast ?? 0
      },
      layout: { visibility: r.id === 'ndvi' ? 'visible' : 'none' }
    });
  });

  // === CONTROL DE CAPAS RASTER ===
  const controlBar = document.createElement('div');
  controlBar.className = 'raster-control bottom-right';
  rasters.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'layer-btn';
    btn.textContent = r.name;
    btn.dataset.layer = r.id;
    if (r.id === 'ndvi') btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rasters.forEach(rr => {
        map.setLayoutProperty(`${rr.id}-layer`, 'visibility', rr.id === r.id ? 'visible' : 'none');
      });
    });
    controlBar.appendChild(btn);
  });
  document.getElementById('map').appendChild(controlBar);

  // === CAPA SATÉLITE ===
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

  const firstLayerId = map.getStyle().layers[0]?.id;

  map.addLayer({
    id: 'satellite-layer',
    type: 'raster',
    source: 'satellite',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' }
  }, firstLayerId);

  // === CAPAS GEOJSON ===
  // --- POZOS (niveles piezométricos incluidos) ---
  addGeoLayer({
    id: 'pozos',
    path: '../data/pozos_niveles.geojson',
    type: 'circle',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'],
        ['coalesce', ['get', 'risk_score'], 0],
        0, 4,
        1, 14
      ],
      'circle-color': [
        'interpolate', ['linear'],
        ['coalesce', ['get', 'risk_score'], 0],
        0.0, '#00C896',
        0.33, '#FFB020',
        0.66, '#FF4D4D'
      ],
      'circle-stroke-color': '#FFF',
      'circle-stroke-width': 1,
      'circle-opacity': 0.85
    }
  });

  // --- RED VIAL ---
  addGeoLayer({
    id: 'red-vial',
    path: '../data/redVial.geojson',
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
        '#cfcfcf'
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

  // --- ETIQUETAS DE CARRETERAS ---
  addGeoLayer({
    id: 'red-vial-labels',
    path: '../data/redVial.geojson',
    type: 'symbol',
    layout: {
      'symbol-placement': 'line',
      'text-field': ['get', 'ref'],
      'text-font': ['Arial Bold', 'Arial Unicode MS Regular'],
      'text-size': 10,
      'symbol-spacing': 400
    },
    paint: {
      'text-color': '#000',
      'text-halo-color': '#FFF',
      'text-halo-width': 3
    }
  });

  // --- ASENTAMIENTOS ---
  addGeoLayer({
    id: 'asentamientos',
    path: '../data/asentamientosAldeas.geojson',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'name:fr'],
      'text-font': ['Neo Sans Medium', 'Arial Unicode MS Regular'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        6, 10,
        12, 14
      ],
      'text-anchor': 'center'
    },
    paint: {
      'text-color': '#cccccc',
      'text-halo-color': '#000000',
      'text-halo-width': 1.0,
      'text-opacity': 0.95
    }
  });

  // --- ANTENAS TELECOM ---
  map.loadImage('../../../img/icons/signal-round-svgrepo-com.png', (error, image) => {
    if (error) {
      console.error("❌ Error al cargar icono de antena:", error);
      return;
    }

    if (!map.hasImage('icon-antena')) map.addImage('icon-antena', image);

    addGeoLayer({
      id: 'antenas',
      path: '../data/antenasTelecomunicaciones.geojson',
      type: 'symbol',
      layout: {
        'icon-image': 'icon-antena',
        'icon-size': 0.05,
        'icon-allow-overlap': true
      },
      paint: { 'icon-opacity': 0.95 }
    });
  });

  // === EVENTOS ===
  map.on('click', 'pozos-layer', e => {
    const f = e.features[0];
    const p = f.properties;
    const html = `
      <div class="popup-title">${p.nombre}</div>
      <div class="popup-meta">
        <strong>Riesgo:</strong> ${(p.risk_score * 100).toFixed(0)}%<br>
        <strong>Dependencia:</strong> ${p.dependencia_poblacional}<br>
        <strong>Nivel actual:</strong> ${p.ult_nivel_m} m
      </div>
    `;
    new maplibregl.Popup({ offset: 25 })
      .setLngLat(f.geometry.coordinates)
      .setHTML(html)
      .addTo(map);
    updateWellDetail(p);
  });

  map.on('mouseenter', 'pozos-layer', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'pozos-layer', () => map.getCanvas().style.cursor = '');
});

// === PANEL LATERAL: DETALLE DE POZO ===
function updateWellDetail(p) {
  const risk = p.risk_score;
  const badge = document.getElementById('well-risk');
  const name = document.getElementById('well-name');
  const meta = document.getElementById('well-meta');

  name.textContent = p.nombre;
  meta.innerHTML = `
    <strong>Último ΔNDVI:</strong> ${p.delta_ndvi?.toFixed(2) ?? '—'}<br>
    <strong>ΔSAR (dB):</strong> ${p.delta_sar_db?.toFixed(2) ?? '—'}<br>
    <strong>Población dependiente:</strong> ${p.dependencia_poblacional}
  `;

  if (risk >= 0.67) { badge.textContent = 'HIGH'; badge.className = 'badge high'; }
  else if (risk >= 0.34) { badge.textContent = 'MEDIUM'; badge.className = 'badge medium'; }
  else { badge.textContent = 'LOW'; badge.className = 'badge low'; }

  drawSparkline(p.niveles_piezometricos ? JSON.parse(p.niveles_piezometricos) : []);
}

// === SPARKLINE (niveles piezométricos) ===
function drawSparkline(levels = []) {
  const c = document.getElementById('sparkline');
  if (!c || levels.length === 0) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);

  const min = Math.min(...levels.map(l => l.nivel_m));
  const max = Math.max(...levels.map(l => l.nivel_m));

  ctx.strokeStyle = '#00C896';
  ctx.lineWidth = 2;
  ctx.beginPath();
  levels.forEach((l, i) => {
    const x = (i / (levels.length - 1)) * c.width;
    const y = c.height - ((l.nivel_m - min) / (max - min)) * c.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// === FOOTER ACTIONS ===
function logAction(msg) {
  console.log(`[LOG] ${msg}`);
  const footer = document.querySelector('.decision-text');
  footer.innerHTML = `<strong>Última acción:</strong> ${msg}`;
}

document.getElementById('btn-verify').onclick = () => logAction('Verificación creada para pozo crítico.');
document.getElementById('btn-vhr').onclick = () => logAction('Solicitud de imagen VHR enviada.');
document.getElementById('btn-humint').onclick = () => logAction('Notificación enviada al equipo HUMINT.');
document.getElementById('btn-back').onclick = () => window.location.href = '../mision3.html';
