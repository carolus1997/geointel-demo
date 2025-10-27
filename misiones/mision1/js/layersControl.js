// === layersControl.js ===
// Control de capas con drag & drop + soporte para marcadores SVG personalizados

export function initLayersControl(map, capas) {
  const panel = document.createElement('div');
  panel.id = 'layers-panel';
  panel.className = 'layers-panel';
  panel.innerHTML = `<h3>Capas de misión</h3>`;

  capas.forEach(c => {
    const item = document.createElement('div');
    item.className = 'layer-item';
    item.draggable = true; // 🟢 Permitir arrastre
    item.dataset.id = c.id;

    item.innerHTML = `
      <label>
        <input type="checkbox" data-id="${c.id}" ${c.visible ? 'checked' : ''}>
        <span class="layer-name">${c.name}</span>
      </label>
      <span class="drag-handle" title="Arrastrar capa">☰</span>
    `;
    panel.appendChild(item);
  });

  document.body.appendChild(panel);

  // === Evento: cambiar visibilidad ===
  panel.addEventListener('change', e => {
    if (!e.target.matches('input[type="checkbox"]')) return;
    const id = e.target.dataset.id;
    const visible = e.target.checked;

    // 🟢 Si es una capa normal del mapa
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    }

    // 🟢 Si es un grupo SVG personalizado
    if (window._svgMarkers && window._svgMarkers[id]) {
      window._svgMarkers[id].forEach(marker => {
        marker.getElement().style.display = visible ? 'block' : 'none';
      });
    }
  });

  // === Eventos drag & drop ===
  let dragSrcEl = null;

  panel.addEventListener('dragstart', e => {
    const item = e.target.closest('.layer-item');
    if (!item) return;
    dragSrcEl = item;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.id);
    item.classList.add('dragging');
  });

  panel.addEventListener('dragover', e => {
    e.preventDefault();
    const item = e.target.closest('.layer-item');
    if (!item || item === dragSrcEl) return;
    const bounding = item.getBoundingClientRect();
    const offset = bounding.y + bounding.height / 2;
    if (e.clientY - offset > 0) {
      item.after(dragSrcEl);
    } else {
      item.before(dragSrcEl);
    }
  });

  panel.addEventListener('drop', e => {
    e.preventDefault();
    const items = Array.from(panel.querySelectorAll('.layer-item'));
    const newOrder = items.map(i => i.dataset.id);

    // 🧭 Invertir orden lógico
    const reversedOrder = [...newOrder].reverse();

    for (let i = 0; i < reversedOrder.length; i++) {
      const id = reversedOrder[i];
      const beforeId = reversedOrder[i + 1];

      // Solo mover si ambos son capas reales del mapa
      if (map.getLayer(id)) {
        if (beforeId && map.getLayer(beforeId)) {
          map.moveLayer(id, beforeId);
        } else {
          map.moveLayer(id);
        }
      }
    }


    capas.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    dragSrcEl?.classList.remove('dragging');
    console.log("🧭 Nuevo orden (panel arriba = mapa arriba):", reversedOrder);
  });

  panel.addEventListener('dragend', e => {
    e.target.classList.remove('dragging');
  });
}
