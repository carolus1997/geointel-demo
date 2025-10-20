export function renderZonasRiesgo(map) {
  const zonasRiesgo = [
    { nombre: 'Lavapiés', descripcion: 'Alta diversidad cultural y desempleo juvenil elevado.', estado: 'activa', id: 'zona1', coords: [-3.7045, 40.4099] },
    { nombre: 'Puente de Vallecas', descripcion: 'Historial de conflictos sociales y vulnerabilidad.', estado: 'activa', id: 'zona2', coords: [-3.6548, 40.3845] },
    { nombre: 'Usera', descripcion: 'Área evaluada, intervención en marcha.', estado: 'activa', id: 'zona3', coords: [-3.7091, 40.3825] },
    { nombre: 'Tetuán', descripcion: 'Alta concentración de población migrante.', estado: 'activa', id: 'zona4', coords: [-3.7043, 40.4633] },
    { nombre: 'San Blas', descripcion: 'Registro de incidentes recientes.', estado: 'activa', id: 'zona5', coords: [-3.6175, 40.4401] }
  ];

  // 🔹 Buscamos el contenedor grid (no el padre)
  const grid = document.querySelector('#risk-container .risk-grid');
  if (!grid) {
    console.warn('⚠️ No se encontró .risk-grid dentro de #risk-container');
    return;
  }

  grid.innerHTML = ''; // limpiamos tarjetas

  zonasRiesgo.forEach((zona) => {
    const { nombre, descripcion, coords, id } = zona;
    let estado = localStorage.getItem(`estado-${id}`) || zona.estado;

    // === HUD ===
    const anchor = document.createElement('div');
    anchor.className = 'invisible-anchor';

    const hud = document.createElement('div');
    hud.className = `hud-marker ${estado}`;
    const label = document.createElement('span');
    label.textContent = nombre;
    hud.appendChild(label);
    anchor.appendChild(hud);

    new maplibregl.Marker({ element: anchor, anchor: 'center' })
      .setLngLat(coords)
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="popup-title">${nombre}</div>
          <div class="popup-meta">${descripcion}</div>
        `)
      )
      .addTo(map);

    // === TARJETA ===
    const card = document.createElement('div');
    card.className = 'risk-card';
    card.innerHTML = `
      <h3>${nombre}</h3>
      <p>${descripcion}</p>
      <button></button>
    `;

    const btn = card.querySelector('button');

    // === Lógica de estado ===
    if (estado === 'completada') {
      btn.textContent = 'Completada';
      btn.disabled = true;
      btn.classList.add('btn-completada');
    } else if (estado === 'bloqueada') {
      btn.textContent = 'Bloqueada';
      btn.disabled = true;
      btn.classList.add('btn-bloqueada');
    } else {
      btn.textContent = 'Marcar completada';
      btn.classList.add('btn-activa');
      btn.addEventListener('click', () => {
        localStorage.setItem(`estado-${id}`, 'completada');
        hud.classList.remove('activa', 'bloqueada');
        hud.classList.add('completada');
        btn.textContent = 'Completada';
        btn.disabled = true;
        btn.className = 'btn-completada';
      });
    }

    // === Interacciones ===
    card.addEventListener('click', () => {
      map.flyTo({ center: coords, zoom: 13 });
    });

    hud.addEventListener('click', () => {
      if (estado !== 'completada') {
        map.flyTo({ center: coords, zoom: 13 });
        localStorage.setItem(`estado-${id}`, 'completada');
        hud.classList.remove('activa', 'bloqueada');
        hud.classList.add('completada');
        btn.textContent = 'Completada';
        btn.disabled = true;
        btn.className = 'btn-completada';
      }
    });

    // 🔹 Añadimos la tarjeta dentro del grid (no del container)
    grid.appendChild(card);
  });
}
