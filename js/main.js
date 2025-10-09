const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === FUNCIONES DE ENTORNO ===
function getBasePath() {
  const pathParts = window.location.pathname.split('/');
  const isGitHub = window.location.hostname.includes('github.io');
  if (isGitHub) {
    const repoName = pathParts[1];
    return `/${repoName}/`;
  }
  return '/';
}

function getMisionURL(relativePath) {
  const base = getBasePath();
  let cleanPath = relativePath.replace(/^(\.\/|\.\.\/)+/, '');
  if (!cleanPath.startsWith('misiones/')) cleanPath = 'misiones/' + cleanPath;

  const fileMatch = cleanPath.match(/(mision\d+)\.html$/i);
  if (fileMatch) {
    const folderName = fileMatch[1];
    if (!cleanPath.includes(`/${folderName}/`))
      cleanPath = cleanPath.replace(`${folderName}.html`, `${folderName}/${folderName}.html`);
  }
  return `${base}${cleanPath}`.replace(/([^:]\/)\/+/g, '$1');
}

// === MAPA PRINCIPAL ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-3.7038, 40.4168], // Madrid
  zoom: 5.5,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// === CARGA DE CAPAS RASTER (hillshade y satélite) ===
map.on('load', () => {
  // RELIEVE
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
      'raster-opacity': 0.35,
      'raster-brightness-min': 0.8,
      'raster-brightness-max': 1.0   // ✅ corregido
    },
    layout: { visibility: 'none' }
  }, firstLayerId);

  // SATÉLITE
  map.addSource('satellite', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

  map.addLayer({
    id: 'satellite-layer',
    type: 'raster',
    source: 'satellite',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' }
  });
});

// === ESPERAR A QUE EL MAPA TERMINE DE RENDERIZAR ===
map.once('idle', () => {
  console.log('🛰️ Mapa listo — añadiendo misiones...');

  const dataPath = `${getBasePath()}data/misiones.geojson`;

  fetch(dataPath)
    .then(res => res.json())
    .then(data => {
      const missionsContainer = document.getElementById('missions-container');
      data.features.forEach(feature => {
        const { nombre, descripcion, enlace, estado } = feature.properties;
        const [lon, lat] = feature.geometry.coordinates.map(Number);
        if (isNaN(lon) || isNaN(lat)) return;

        // === HUD MARCADOR ===
        const anchor = document.createElement('div');
        anchor.className = 'invisible-anchor';
        const hud = document.createElement('div');
        hud.className = 'hud-marker';
        if (estado) hud.classList.add(estado.toLowerCase());
        const label = document.createElement('span');
        label.textContent = nombre;
        hud.appendChild(label);
        anchor.appendChild(hud);

        new maplibregl.Marker({ element: anchor, anchor: 'center' })
          .setLngLat([lon, lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="popup-hud">
                <strong>${nombre}</strong><br>
                <a href="${getMisionURL(enlace)}" style="color:#00ffc6;">Iniciar misión →</a>
              </div>
            `)
          )
          .addTo(map);

        // === TARJETA LATERAL ===
        const card = document.createElement('div');
        card.className = 'mission-card';
        card.innerHTML = `
          <h3>${nombre}</h3>
          <p>${descripcion}</p>
          <button>Ver misión</button>
        `;
        card.querySelector('button').addEventListener('click', () => {
          window.location.href = getMisionURL(enlace);
        });
        card.addEventListener('click', () => {
          map.flyTo({ center: [lon, lat], zoom: 7 });
        });

        missionsContainer.appendChild(card);
      });
    })
    .catch(err => console.error('❌ Error cargando misiones:', err));


  // === TOGGLES DE CAPAS BASE (ya existen las capas) ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  if (toggleHillshade) {
    toggleHillshade.addEventListener('click', () => {
      const vis = map.getLayoutProperty('hillshade-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('hillshade-layer', 'visibility', newVis);
      toggleHillshade.classList.toggle('active', newVis === 'visible');

      // apaga satélite
      if (newVis === 'visible') {
        map.setLayoutProperty('satellite-layer', 'visibility', 'none');
        toggleSat?.classList.remove('active');
      }
    });
  }

  if (toggleSat) {
    toggleSat.addEventListener('click', () => {
      const vis = map.getLayoutProperty('satellite-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('satellite-layer', 'visibility', newVis);
      toggleSat.classList.toggle('active', newVis === 'visible');

      // apaga relieve
      if (newVis === 'visible') {
        map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
        toggleHillshade?.classList.remove('active');
      }
    });
  }
});
