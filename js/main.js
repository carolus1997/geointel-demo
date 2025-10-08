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

  // Eliminar todos los ../ o ./ del inicio, dejando la ruta limpia
  let cleanPath = relativePath.replace(/^(\.\/|\.\.\/)+/, '');

  // Si por algún motivo no empieza por "misiones/", lo añadimos
  if (!cleanPath.startsWith('misiones/')) {
    cleanPath = 'misiones/' + cleanPath;
  }

  return base + cleanPath;
}


// === MAPA PRINCIPAL (MAPLIBRE) ===
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

// === CARGAR MISIONES (HUDs tácticos) ===
map.on('load', () => {
  // Ruta dinámica del archivo según entorno
  const dataPath = `${getBasePath()}data/misiones.geojson`;

  fetch(dataPath)
    .then(res => {
      if (!res.ok) throw new Error(`Error al cargar misiones.geojson (${res.status})`);
      return res.json();
    })
    .then(data => {
      const missionsContainer = document.getElementById('missions-container');

      data.features.forEach(feature => {
        const { nombre, descripcion, enlace, estado } = feature.properties;
        const coords = feature.geometry.coordinates;

        // Validar coordenadas
        if (!Array.isArray(coords) || coords.length !== 2) {
          console.warn(`⚠️ Coordenadas no válidas para ${nombre}:`, coords);
          return;
        }

        const lon = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        if (isNaN(lon) || isNaN(lat)) return;

        console.log(`✅ ${nombre}: [${lon}, ${lat}]`);

        // === MARCADOR INVISIBLE (anclaje) ===
        const anchor = document.createElement('div');
        anchor.className = 'invisible-anchor';

        // === HUD circular animado ===
        const hud = document.createElement('div');
        hud.className = 'hud-marker';
        if (estado) hud.classList.add(estado.toLowerCase());

        const label = document.createElement('span');
        label.textContent = nombre;
        hud.appendChild(label);

        // HUD dentro del ancla
        anchor.appendChild(hud);

        // === Añadir marcador al mapa ===
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

        // Click en el botón → ir a misión
        card.querySelector('button').addEventListener('click', () => {
          window.location.href = getMisionURL(enlace);
        });

        // Click en la tarjeta → centrar mapa
        card.addEventListener('click', () => {
          map.flyTo({ center: [lon, lat], zoom: 7 });
        });

        missionsContainer.appendChild(card);
      });
    })
    .catch(err => console.error('❌ Error cargando misiones:', err));
});
