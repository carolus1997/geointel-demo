const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === RUTAS COMPATIBLES LOCAL / GITHUB PAGES ===
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
  return base + relativePath.replace('../', '');
}

// === MAPA GLOBAL (MAPLIBRE) ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-3.7038, 40.4168],
  zoom: 5.5,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// === CARGAR MISIONES Y GENERAR TARJETAS ===
fetch('data/misiones.geojson')
  .then(res => res.json())
  .then(data => {
    const missionsContainer = document.getElementById('missions-container');

    data.features.forEach(feature => {
      const { nombre, descripcion, enlace } = feature.properties;
      const coords = feature.geometry.coordinates;

      // Corrige enlace según entorno
      const enlaceFinal = getMisionURL(enlace);

      // === MARCADOR EN EL MAPA ===
      const el = document.createElement('div');
      el.className = 'marker';
      new maplibregl.Marker(el)
        .setLngLat(coords)
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <strong>${nombre}</strong><br>
            <a href="${enlaceFinal}" style="color:#00C896;">Ver misión →</a>
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

      // Al hacer clic en botón, abrir misión
      card.querySelector('button').addEventListener('click', () => {
        window.location.href = enlaceFinal;
      });

      // Al hacer clic en la tarjeta, centrar mapa
      card.addEventListener('click', () => {
        map.flyTo({ center: coords, zoom: 7 });
      });

      missionsContainer.appendChild(card);
    });
  })
  .catch(err => console.error('Error cargando misiones:', err));
