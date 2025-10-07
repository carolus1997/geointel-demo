const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === MAPA GLOBAL ===
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

      // Crear marcador en el mapa
      const el = document.createElement('div');
      el.className = 'marker';
      new maplibregl.Marker(el)
        .setLngLat(coords)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
          <strong>${nombre}</strong><br>
          <a href="${enlace}" style="color:#00C896;">Ver misión →</a>
        `))
        .addTo(map);

      // Crear tarjeta en el panel lateral
      const card = document.createElement('div');
      card.className = 'mission-card';
      card.innerHTML = `
        <h3>${nombre}</h3>
        <p>${descripcion}</p>
        <button>Ver misión</button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        transitionTo(enlace);
      });
      
      // Centrar mapa al hacer clic en la tarjeta
      card.addEventListener('click', () => {
        map.flyTo({ center: coords, zoom: 7 });
      });

      missionsContainer.appendChild(card);
    });
  });


