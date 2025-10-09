// === CONFIGURACIÓN GENERAL ===
const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA BASE ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-4.21875, 31.42],  // centrado en tu tile existente
  zoom: 8,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});


map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

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
      scheme: 'tms',                          // <- ESTA LÍNEA ES LA CLAVE
      minzoom: 6,
      maxzoom: 10,
      bounds: [-2.3, 31.9, -1.7, 32.3]        // opcional, evita peticiones fuera del AOI
    });
    map.addLayer({
      id: `${r.id}-layer`,
      type: 'raster',
      source: r.id,
      paint: {
        'raster-opacity': s.opacity ?? 0.6,
        'raster-brightness-min': s.brightnessMin ?? 0,
        'raster-brightness-max': s.brightnessMax ?? 1,
        'raster-contrast': s.contrast ?? 0,
        'raster-hue-rotate': s.hue ?? 0
      },
      layout: { visibility: r.id === 'ndvi' ? 'visible' : 'none' }
    });
  });




  // === CONTROL DE CAPAS RASTER (inferior derecha) ===
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


  // === CAPA GEOJSON: POZOS ===
  fetch('../data/pozos.geojson')
    .then(res => res.json())
    .then(data => {
      map.addSource('pozos', { type: 'geojson', data });

      map.addLayer({
        id: 'pozos-layer',
        type: 'circle',
        source: 'pozos',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'risk_score'], 0, 4, 1, 14],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'risk_score'],
            0.0, '#00C896',   // bajo → verde
            0.33, '#FFB020',  // medio → ámbar
            0.66, '#FF4D4D'   // alto → rojo
          ],
          'circle-stroke-color': '#FFF',
          'circle-stroke-width': 1,
          'circle-opacity': 0.85
        }
      });

      // === CAPA GEOJSON: INFOOPS ===
      fetch('../data/infoops.geojson')
        .then(res => res.json())
        .then(data => {
          map.addSource('infoops', { type: 'geojson', data });

          map.addLayer({
            id: 'infoops-layer',
            type: 'circle',
            source: 'infoops',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['get', 'riesgo_info'], 0, 4, 1, 16],
              'circle-color': [
                'interpolate', ['linear'], ['get', 'riesgo_info'],
                0.0, '#00C896',  // bajo → verde
                0.5, '#FFB020',  // medio → ámbar
                1.0, '#FF4D4D'   // alto → rojo
              ],
              'circle-stroke-color': '#FFF',
              'circle-stroke-width': 1.5,
              'circle-opacity': 0.85
            }
          });

          // === POPUP ===
          map.on('click', 'infoops-layer', e => {
            const f = e.features[0];
            const p = f.properties;
            const html = `
        <div class="popup-title">${p.tema}</div>
        <div class="popup-meta">
          <strong>Fuente:</strong> ${p.fuente}<br>
          <strong>Menciones:</strong> ${p.menciones}<br>
          <strong>Riesgo informativo:</strong> ${(p.riesgo_info * 100).toFixed(0)}%
        </div>
      `;
            new maplibregl.Popup({ offset: 25 })
              .setLngLat(f.geometry.coordinates)
              .setHTML(html)
              .addTo(map);
          });

          // === Actualiza el indicador InfoOps global ===
          const avgRisk = average(data.features.map(f => f.properties.riesgo_info));
          document.getElementById('infoops-summary').textContent = (avgRisk * 100).toFixed(1) + '%';
        });

      // KPIs iniciales
      updateKPIs(data.features);

      updateIndicators(data.features);

      // POPUPS + panel lateral
      map.on('click', 'pozos-layer', e => {
        const f = e.features[0];
        const p = f.properties;
        const html = `
          <div class="popup-title">${p.nombre}</div>
          <div class="popup-meta">
            <strong>Riesgo:</strong> ${(p.risk_score * 100).toFixed(0)}%<br>
            <strong>Dependencia:</strong> ${p.dependencia_poblacional}<br>
            <strong>Nivel:</strong> ${p.ult_nivel_m} m
          </div>
        `;
        new maplibregl.Popup({ offset: 25 })
          .setLngLat(f.geometry.coordinates)
          .setHTML(html)
          .addTo(map);
        updateWellDetail(p);
        updateIndicatorsForSelection(p);

      });

      map.on('mouseenter', 'pozos-layer', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'pozos-layer', () => map.getCanvas().style.cursor = '');
    });
});


// === FUNCIONES KPI PRINCIPALES ===
function updateKPIs(features) {
  const highs = features.filter(f => f.properties.riesgo >= 0.67);
  const ewicount = features.filter(f => f.properties.riesgo >= 0.34).length;
  const totalPop = features.reduce((sum, f) => sum + Number(f.properties.pobl_dep || 0), 0);

  document.getElementById('kpi-high').textContent = highs.length;
  document.getElementById('kpi-ewi').textContent = ewicount;
  document.getElementById('kpi-pop').textContent = totalPop.toLocaleString();

  if (highs.length > 0) document.querySelector('.decision-panel').classList.add('alerting');
}

// === INDICADORES CLAVE (barra lateral) ===
function updateIndicators(features) {
  if (!features || features.length === 0) return;

  // Promedios globales
  const ndviAvg = average(features.map(f => Number(f.properties.delta_ndvi || 0)));
  const sarAvg = average(features.map(f => Number(f.properties.delta_sar_db || 0)));

  document.getElementById('ndvi-summary').textContent = ndviAvg.toFixed(2);
  document.getElementById('sar-summary').textContent = sarAvg.toFixed(2);
  document.getElementById('infoops-summary').textContent = '—';
}

// === Actualiza los indicadores al seleccionar un pozo ===
function updateIndicatorsForSelection(props) {
  document.getElementById('ndvi-summary').textContent =
    props.delta_ndvi !== undefined ? props.delta_ndvi.toFixed(2) : '—';
  document.getElementById('sar-summary').textContent =
    props.delta_sar_db !== undefined ? props.delta_sar_db.toFixed(2) : '—';
  document.getElementById('infoops-summary').textContent = '—';
}

// === Función auxiliar ===
function average(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}


// === PANEL LATERAL: DETALLE DE POZO ===
function updateWellDetail(p) {
  const risk = p.riesgo;
  const badge = document.getElementById('well-risk');
  const name = document.getElementById('well-name');
  const meta = document.getElementById('well-meta');

  name.textContent = p.nombre;
  meta.innerHTML = `
    <strong>Último ΔNDVI:</strong> ${p.delta_ndvi?.toFixed(2)}<br>
    <strong>ΔSAR (dB):</strong> ${p.delta_sar_db?.toFixed(2)}<br>
    <strong>Población dependiente:</strong> ${p.pobl_dep}
  `;

  if (risk >= 0.67) { badge.textContent = 'HIGH'; badge.className = 'badge high'; }
  else if (risk >= 0.34) { badge.textContent = 'MEDIUM'; badge.className = 'badge medium'; }
  else { badge.textContent = 'LOW'; badge.className = 'badge low'; }

  drawSparkline();
}



// === SPARKLINE (mini gráfico) ===
function drawSparkline() {
  const c = document.getElementById('sparkline');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#00C896';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const x = (i / 19) * c.width;
    const y = c.height - (Math.random() * c.height * 0.8 + c.height * 0.1);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}


// === ACCIONES EN FOOTER ===
function logAction(msg) {
  console.log(`[LOG] ${msg}`);
  const footer = document.querySelector('.decision-text');
  footer.innerHTML = `<strong>Última acción:</strong> ${msg}`;
}

document.getElementById('btn-verify').onclick = () => logAction('Verificación creada para pozo crítico.');
document.getElementById('btn-vhr').onclick = () => logAction('Solicitud de imagen VHR enviada.');
document.getElementById('btn-humint').onclick = () => logAction('Notificación enviada al equipo HUMINT.');
document.getElementById('btn-back').onclick = () => window.location.href = '../mision3.html';
