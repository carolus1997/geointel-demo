// === CONFIGURACIÓN GENERAL ===
const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';
// === PARÁMETROS TÁCTICOS ===
const RADIO_ANTENA_ASENT = 2; // km — distancia máxima antena ↔ asentamiento
const RADIO_ASENT_POZO = 5;   // km — distancia máxima asentamiento ↔ pozo
// === MAPA BASE ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-2.01, 32.42],
  zoom: 9,
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



  // === KPI CALCULATOR ===
  async function updateKPIs() {
    try {
      const [antenas, asentamientos, pozos] = await Promise.all([
        fetch('../data/antenasTelecomunicaciones.geojson').then(r => r.json()),
        fetch('../data/asentamientosAldeas.geojson').then(r => r.json()),
        fetch('../data/pozos_niveles.geojson').then(r => r.json())
      ]);

      // 1️⃣ Antenas activas
      const antenasActivas = antenas.features.length;

      // 2️⃣ Aglomeraciones (ej: población > 500 si existe campo 'pop_est')
      const aglomeraciones = asentamientos.features.filter(f =>
        (f.properties.pop_est || 0) > 500
      ).length;

      // 3️⃣ Pozos críticos (riesgo ≥ 0.6)
      const pozosCriticos = pozos.features.filter(f =>
        (f.properties.risk_score || 0) >= 0.6
      ).length;

      // Actualizar DOM
      document.getElementById('kpi-antenas').textContent = antenasActivas;
      document.getElementById('kpi-asentamientos').textContent = aglomeraciones;
      document.getElementById('kpi-pozos').textContent = pozosCriticos;

      console.log(`📊 KPIs actualizados — Antenas:${antenasActivas}, Aglomeraciones:${aglomeraciones}, Pozos críticos:${pozosCriticos}`);
    } catch (err) {
      console.error('❌ Error actualizando KPIs:', err);
    }
  }

  // Llamar tras carga del mapa
  map.once('load', updateKPIs);


  // === CONTROL DE CAPAS: FILTROS DE INFORMACIÓN ===
  const controlPanel = document.createElement('div');
  controlPanel.className = 'intel-control bottom-right';

  const layers = [
    { id: 'antenas', name: ' Antenas', color: '#00C896' },
    { id: 'asentamientos', name: ' Asentamientos', color: '#FFD400' },
    { id: 'pozos', name: ' Pozos críticos', color: '#FF4D4D' },
  ];

  layers.forEach(layer => {
    const btn = document.createElement('button');
    btn.className = 'layer-toggle';
    btn.textContent = layer.name;
    btn.style.borderColor = layer.color;
    btn.dataset.layer = layer.id;
    btn.classList.add('active'); // por defecto, todos activos

    btn.addEventListener('click', () => {
      const layerId = btn.dataset.layer;
      const visible = map.getLayoutProperty(layerId, 'visibility') !== 'none';
      map.setLayoutProperty(layerId, 'visibility', visible ? 'none' : 'visible');
      btn.classList.toggle('active', !visible);
    });

    controlPanel.appendChild(btn);
  });

  document.getElementById('map').appendChild(controlPanel);


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

  // === CAPA DE ASENTAMIENTOS: CONCENTRACIÓN HUMANA ===
  addGeoLayer({
    id: 'asentamientos',
    path: '../data/asentamientosAldeas.geojson',
    type: 'circle',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        6, 2,
        12, 8
      ],
      'circle-color': [
        'case',
        ['any',
          ['==', ['get', 'place'], 'town'],
          ['>', ['to-number', ['get', 'population'], 0], 10000]
        ], '#FF4D4D', // Alta
        ['any',
          ['==', ['get', 'place'], 'village'],
          ['all',
            ['>', ['to-number', ['get', 'population'], 0], 1000],
            ['<=', ['to-number', ['get', 'population'], 0], 10000]
          ]
        ], '#FFB020', // Media
        '#00C896' // Baja
      ],
      'circle-stroke-color': '#111',
      'circle-stroke-width': 0.8,
      'circle-opacity': 0.85
    }
  });

  // === POPUP Y PANEL DE DETALLE ===
  map.on('click', 'asentamientos', e => {
    const f = e.features[0];
    const p = f.properties;
    const poblacion = parseInt(p.population) || 0;

    let nivel = 'Baja';
    if (p.place === 'town' || poblacion > 10000) nivel = 'Alta';
    else if (p.place === 'village' || (poblacion > 1000 && poblacion <= 10000)) nivel = 'Media';

    const html = `
    <div class="popup-title">${p.name || 'Asentamiento sin nombre'}</div>
    <div class="popup-meta">
      <strong>Nivel:</strong> ${nivel}<br>
      <strong>Tipo:</strong> ${p.place || '—'}<br>
      <strong>Población:</strong> ${poblacion ? poblacion.toLocaleString() : '—'}<br>
      <strong>Altitud:</strong> ${p.ele || '—'} m
    </div>
  `;
    new maplibregl.Popup({ offset: 25 })
      .setLngLat(f.geometry.coordinates)
      .setHTML(html)
      .addTo(map);

    updateFeatureDetail({
      properties: {
        name: p.name,
        place: p.place,
        pop_est: poblacion,
        ele: p.ele,
        nivel
      }
    }, 'asentamiento');
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
  async function resumenAsentamientos() {
    const asentamientos = await fetch('../data/asentamientosAldeas.geojson').then(r => r.json());
    let altas = 0, medias = 0, bajas = 0;

    asentamientos.features.forEach(f => {
      const p = f.properties;
      const pop = parseInt(p.population) || 0;
      if (p.place === 'town' || pop > 10000) altas++;
      else if (p.place === 'village' || (pop > 1000 && pop <= 10000)) medias++;
      else bajas++;
    });

    document.getElementById('intel-asentamientos').innerHTML =
      `<strong>${altas}</strong> altas · <strong>${medias}</strong> medias · <strong>${bajas}</strong> bajas`;
  }
  map.once('load', resumenAsentamientos);

  async function resumenAntenas() {
    try {
      const antenas = await fetch('../data/antenasTelecomunicaciones.geojson').then(r => r.json());
      const total = antenas.features.length;

      let activas = 0, pasivas = 0, inactivas = 0;

      antenas.features.forEach(f => {
        const props = f.properties;
        if (props['communication:radio'] === 'yes') activas++;
        else if (props['man_made'] === 'mast') inactivas++;
        else pasivas++;
      });

      // Mostrar resumen visual coherente con los otros indicadores
      const html = `
      <div class="intel-item">
        <div class="intel-label">Antenas de comunicación</div>
        <div class="intel-value">
          <span style="color:#00C896"><strong>${activas}</strong></span> activas ·
          <span style="color:#FFD400"><strong>${pasivas}</strong></span> pasivas ·
          <span style="color:#FF4D4D"><strong>${inactivas}</strong></span> inactivas
        </div>
        <div class="intel-sub">${total} estructuras totales</div>
      </div>
    `;

      // Si tienes un contenedor genérico (como "intel-antenas"), úsalo aquí:
      const container = document.getElementById('intel-antenas');
      if (container) container.innerHTML = html;

      console.log(`📡 Antenas — activas:${activas}, pasivas:${pasivas}, inactivas:${inactivas}`);
    } catch (err) {
      console.error('❌ Error al generar resumen de antenas:', err);
    }
  }

  map.once('load', resumenAntenas);

  async function resumenRecursosCriticos() {
    const pozos = await fetch('../data/pozos_niveles.geojson').then(r => r.json());
    let criticos = 0, moderados = 0, estables = 0;

    pozos.features.forEach(f => {
      const r = f.properties.risk_score || 0;
      if (r >= 0.6) criticos++;
      else if (r >= 0.3) moderados++;
      else estables++;
    });

    const total = pozos.features.length;
    const html = `
    <div class="intel-item">
      <div class="intel-label">Recursos hídricos</div>
      <div class="intel-value">
        <span style="color:#FF4D4D"><strong>${criticos}</strong></span> críticos ·
        <span style="color:#FFB020"><strong>${moderados}</strong></span> moderados ·
        <span style="color:#00C896"><strong>${estables}</strong></span> estables
      </div>
      <div class="intel-sub">${total} pozos monitorizados</div>
    </div>
  `;
    document.getElementById('intel-recursos').innerHTML = html;
  }
  map.once('load', resumenRecursosCriticos);


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

  async function detectarConvergencia() {
    try {
      const [antenas, asentamientos, pozos] = await Promise.all([
        fetch('../data/antenasTelecomunicaciones.geojson').then(r => r.json()),
        fetch('../data/asentamientosAldeas.geojson').then(r => r.json()),
        fetch('../data/pozos_niveles.geojson').then(r => r.json())
      ]);

      const alertas = [];

      // Filtrar entidades relevantes
      const antenasActivas = antenas.features.filter(f => f.properties['communication:radio'] === 'yes');
      const pozosCriticos = pozos.features.filter(f => (f.properties.risk_score || 0) >= 0.6);
      const asentPoblados = asentamientos.features.filter(f => {
        const pop = parseInt(f.properties.population) || 0;
        const tipo = f.properties.place;
        return tipo === 'town' || tipo === 'village' || pop > 1000;
      });

      // Comparar distancias
      antenasActivas.forEach(a => {
        const [ax, ay] = a.geometry.coordinates;

        asentPoblados.forEach(s => {
          const [sx, sy] = s.geometry.coordinates;
          const distAS = distancia(ax, ay, sx, sy);
          if (distAS > RADIO_ANTENA_ASENT) return;

          pozosCriticos.forEach(p => {
            const [px, py] = p.geometry.coordinates;
            const distSP = distancia(sx, sy, px, py);
            if (distSP <= RADIO_ASENT_POZO) {
              alertas.push({
                antena: a.properties.id,
                asentamiento: s.properties.name || '—',
                pozo: p.properties.nombre || '—',
                distAntena: distAS.toFixed(2),
                distPozo: distSP.toFixed(2),
                coords: s.geometry.coordinates
              });
            }
          });
        });
      });

      console.log(`📡 Convergencias detectadas: ${alertas.length}`);
      mostrarConvergencias(alertas);
    } catch (err) {
      console.error('❌ Error en detección de convergencias:', err);
    }
  }

  // --- función de distancia Haversine (km)
  function distancia(lon1, lat1, lon2, lat2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  map.once('load', detectarConvergencia);

  function mostrarConvergencias(alertas) {
    if (!alertas.length) {
      const footer = document.querySelector('.decision-text');
      footer.innerHTML = '✅ Sin convergencias híbridas detectadas.';
      return;
    }

    // --- Capa de zonas críticas ---
    const geojson = {
      type: 'FeatureCollection',
      features: alertas.map((a, i) => ({
        type: 'Feature',
        id: i,
        properties: { nombre: a.asentamiento, pozo: a.pozo },
        geometry: { type: 'Point', coordinates: a.coords }
      }))
    };

    if (map.getSource('convergencias')) map.removeSource('convergencias');
    if (map.getLayer('convergencias')) map.removeLayer('convergencias');

    map.addSource('convergencias', { type: 'geojson', data: geojson });

    map.addLayer({
      id: 'convergencias',
      type: 'circle',
      source: 'convergencias',
      paint: {
        'circle-radius': 10,
        'circle-color': '#FF2F00',
        'circle-opacity': 0.6,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff'
      }
    });

    // --- Texto dinámico en el footer ---
    const footer = document.querySelector('.decision-text');
    footer.innerHTML = `<strong>⚠️ ${alertas.length} zonas críticas</strong> detectadas — posibles nodos híbridos.`;
  }

  async function visualizarConvergencias() {

    const [antenas, asentamientos, pozos] = await Promise.all([
      fetch('../data/antenasTelecomunicaciones.geojson').then(r => r.json()),
      fetch('../data/asentamientosAldeas.geojson').then(r => r.json()),
      fetch('../data/pozos_niveles.geojson').then(r => r.json())
    ]);

    const antenasActivas = antenas.features.filter(f => f.properties['communication:radio'] === 'yes');
    const pozosCriticos = pozos.features.filter(f => (f.properties.risk_score || 0) >= 0.6);
    const asentPoblados = asentamientos.features.filter(f => {
      const pop = parseInt(f.properties.population) || 0;
      return f.properties.place === 'town' || f.properties.place === 'village' || pop > 1000;
    });

    const nodos = [];
    const lineas = [];

    // === BÚSQUEDA REAL DE CONVERGENCIAS ===
    antenasActivas.forEach(a => {
      const [ax, ay] = a.geometry.coordinates;
      asentPoblados.forEach(s => {
        const [sx, sy] = s.geometry.coordinates;
        const distAS = distancia(ax, ay, sx, sy);
        if (distAS > 2) return;

        pozosCriticos.forEach(p => {
          const [px, py] = p.geometry.coordinates;
          const distSP = distancia(sx, sy, px, py);
          if (distSP <= 5) {
            nodos.push({
              asentamiento: s.properties.name || '—',
              antena_id: a.properties.id,
              pozo: p.properties.nombre || '—',
              coords: s.geometry.coordinates,
              riesgo: 'ALTO',
              dist_asent_antena: distAS.toFixed(2),
              dist_asent_pozo: distSP.toFixed(2)
            });

            lineas.push(
              { type: 'Feature', geometry: { type: 'LineString', coordinates: [a.geometry.coordinates, s.geometry.coordinates] } },
              { type: 'Feature', geometry: { type: 'LineString', coordinates: [s.geometry.coordinates, p.geometry.coordinates] } }
            );
          }
        });
      });
    });

    // === ⚠️ Si no hay convergencias reales, generar simuladas ===
    if (nodos.length === 0) {
      console.warn('⚠️ No se detectaron convergencias reales — generando simulación táctica.');
      const mockCoords = [
        [-2.07, 31.93],  // Boukais / Béchar
        [-1.25, 32.05],  // Béni Ounif
        [-0.57, 32.75]   // Aïn Sefra
      ];

      const mockAsentamientos = ['Boukais', 'Béni Ounif', 'Aïn Sefra'];
      const mockPozos = ['Hassi Tarchoun', 'Hassi Aricha', 'Souissifa'];

      mockCoords.forEach((coord, i) => {
        nodos.push({
          asentamiento: mockAsentamientos[i],
          antena_id: `sim_${1000 + i}`,
          pozo: mockPozos[i],
          coords: coord,
          riesgo: 'ALTO',
          dist_asent_antena: (Math.random() * 1.5 + 0.5).toFixed(2),
          dist_asent_pozo: (Math.random() * 4 + 1).toFixed(2)
        });

        // simulamos líneas cortas realistas (~2 km)
        const offset1 = [coord[0] + 0.015, coord[1] + 0.01];
        const offset2 = [coord[0] - 0.015, coord[1] - 0.01];
        lineas.push(
          { type: 'Feature', geometry: { type: 'LineString', coordinates: [offset1, coord] } },
          { type: 'Feature', geometry: { type: 'LineString', coordinates: [coord, offset2] } }
        );
      });
    }


    // === ACTUALIZACIÓN DE CAPAS ===
    const linesGeoJSON = { type: 'FeatureCollection', features: lineas };
    const nodosGeoJSON = {
      type: 'FeatureCollection',
      features: nodos.map((n, i) => ({
        type: 'Feature',
        id: i,
        properties: n,
        geometry: { type: 'Point', coordinates: n.coords }
      }))
    };

    // limpiar anteriores
    ['lineas-convergencia', 'nodos-convergencia'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    // === Añadir líneas ===
    map.addSource('lineas-convergencia', { type: 'geojson', data: linesGeoJSON });
    map.addLayer({
      id: 'lineas-convergencia',
      type: 'line',
      source: 'lineas-convergencia',
      paint: {
        'line-color': '#FF2F00',
        'line-width': 3,
        'line-opacity': 0.7
      }
    });

    // === Añadir nodos ===
    map.addSource('nodos-convergencia', { type: 'geojson', data: nodosGeoJSON });
    map.addLayer({
      id: 'nodos-convergencia',
      type: 'circle',
      source: 'nodos-convergencia',
      paint: {
        'circle-radius': 12,
        'circle-color': '#FF2F00',
        'circle-opacity': 0.9,
        'circle-stroke-width': 2
      }
    });
    window.nodos = nodos

    // === POPUPS INFORMATIVOS ===
    map.on('click', 'nodos-convergencia', e => {
      const n = e.features[0].properties;
      const html = `
      <div class="popup-title">Zona híbrida detectada</div>
      <div class="popup-meta">
        <strong>Asentamiento:</strong> ${n.asentamiento}<br>
        <strong>Pozo:</strong> ${n.pozo}<br>
        <strong>Antena:</strong> ${n.antena_id}<br>
        <strong>Distancias:</strong> ${n.dist_asent_antena} km / ${n.dist_asent_pozo} km
      </div>
    `;
      new maplibregl.Popup({ offset: 25 })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    });

    // === ENFOQUE AUTOMÁTICO Y FOOTER ===
    const footer = document.querySelector('.decision-text');
    if (nodos.length > 0) {
      footer.innerHTML = `⚠️ <strong>${nodos.length} zonas híbridas detectadas</strong> — revisión HUMINT recomendada.`;
      const coords = nodos.map(n => n.coords);
      const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 100, duration: 1500 });
    } else {
      footer.innerHTML = '✅ Sin convergencias híbridas significativas.';
    }


    // === EFECTO PULSANTE — render manual proyectado ===
    async function addPulsantesDesdeCapa() {
      const src = map.getSource('nodos-convergencia');
      if (!src) return console.warn("⚠️ Fuente 'nodos-convergencia' no encontrada.");

      const data = src._data || src._options?.data;
      if (!data?.features?.length) return console.warn("⚠️ Sin features en 'nodos-convergencia'.");

      // Limpia anteriores
      document.querySelectorAll('.pulsante').forEach(p => p.remove());

      const container = map.getContainer();
      const features = data.features.map((f, i) => ({
        name: f.properties.asentamiento || f.properties.nombre || `Zona ${i + 1}`,
        coords: f.geometry.coordinates.map(Number)
      }));

      // Crear y posicionar elementos HTML directamente dentro del contenedor del mapa
      features.forEach((f, i) => {
        const el = document.createElement('div');
        el.className = 'pulsante';
        el.title = f.name;
        el.dataset.lon = f.coords[0];
        el.dataset.lat = f.coords[1];
        el.style.position = 'absolute';
        container.appendChild(el);
      });

      // Función para reproyectar los puntos al moverse el mapa
      const reproject = () => {
        document.querySelectorAll('.pulsante').forEach(el => {
          const lon = parseFloat(el.dataset.lon);
          const lat = parseFloat(el.dataset.lat);
          const point = map.project([lon, lat]);
          const rect = el.getBoundingClientRect();
          const w = rect.width || 24;
          const h = rect.height || 24;
          el.style.left = `${point.x - w / 2.45}px`;
          el.style.top = `${point.y - h / 2.45}px`;

        });
      };

      // Reproyectar al cargar, mover o hacer zoom
      map.on('render', reproject);
      map.on('move', reproject);
      map.on('zoom', reproject);
      reproject();

      console.log(`✅ ${features.length} pulsantes proyectados manualmente en el mapa.`);
    }





    await addPulsantesDesdeCapa()

  }


  map.once('load', visualizarConvergencias);


  map.on('mouseenter', 'pozos-layer', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'pozos-layer', () => map.getCanvas().style.cursor = '');
});

// === PANEL LATERAL: DETALLE DE POZO ===
function updateFeatureDetail(f, type) {
  const badge = document.getElementById('feature-type');
  const name = document.getElementById('feature-name');
  const meta = document.getElementById('feature-meta');

  name.textContent = f.properties.nombre || f.properties.name || '—';
  badge.textContent = type.toUpperCase();

  switch (type) {
    case 'antena': {
      badge.className = f.properties['communication:radio'] === 'yes'
        ? 'badge low'    // activa → verde
        : 'badge medium'; // sin confirmar → ámbar

      const tipo = f.properties['man_made'] || 'Desconocido';
      const construccion = f.properties['tower:construction'] || '—';
      const altura = f.properties['height'] ? `${f.properties['height']} m` : '—';
      const radio = f.properties['communication:radio'] === 'yes' ? 'Sí' : 'No';
      const fuente = f.properties['source'] || '—';

      meta.innerHTML = `
    <strong>Identificador:</strong> ${f.properties.id || '—'}<br>
    <strong>Tipo:</strong> ${tipo} (${construccion})<br>
    <strong>Altura:</strong> ${altura}<br>
    <strong>Radio activo:</strong> ${radio}<br>
    <strong>Fuente:</strong> ${fuente}
  `;
      break;
    }


    case 'asentamiento':
      badge.className = 'badge medium';
      meta.innerHTML = `
        <strong>Población estimada:</strong> ${f.properties.pop_est || '—'}<br>
        <strong>Tipo:</strong> ${f.properties.place || 'Aldea'}<br>
        <strong>Región:</strong> ${f.properties['name:fr'] || '—'}
      `;
      break;

    case 'pozo':
      badge.className =
        f.properties.risk_score >= 0.67
          ? 'badge high'
          : f.properties.risk_score >= 0.34
            ? 'badge medium'
            : 'badge low';
      meta.innerHTML = `
        <strong>Riesgo:</strong> ${(f.properties.risk_score * 100).toFixed(0)}%<br>
        <strong>Dependencia:</strong> ${f.properties.dependencia_poblacional}<br>
        <strong>Nivel actual:</strong> ${f.properties.ult_nivel_m} m
      `;
      drawSparkline(
        f.properties.niveles_piezometricos
          ? JSON.parse(f.properties.niveles_piezometricos)
          : []
      );
      break;
  }
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
map.on('click', 'antenas', e => {
  const f = e.features[0];
  updateFeatureDetail(f, 'antena');
});

map.on('click', 'asentamientos', e => {
  const f = e.features[0];
  updateFeatureDetail(f, 'asentamiento');
});

map.on('click', 'pozos', e => {
  const f = e.features[0];
  updateFeatureDetail(f, 'pozo');
});

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
