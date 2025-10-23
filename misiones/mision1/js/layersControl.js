export function initLayersControl(map, capas) {
  const panel = document.createElement('div');
  panel.id = 'layers-panel';
  panel.className = 'layers-panel';
  panel.innerHTML = `<h3>Capas de misión</h3>`;

  capas.forEach(c => {
    const item = document.createElement('div');
    item.className = 'layer-item';
    item.innerHTML = `
      <label>
        <input type="checkbox" data-id="${c.id}" ${c.visible ? 'checked' : ''}>
        ${c.name}
      </label>`;
    panel.appendChild(item);
  });

  document.body.appendChild(panel);

  panel.addEventListener('change', e => {
    if (!e.target.matches('input[type="checkbox"]')) return;
    const id = e.target.dataset.id;
    const visible = e.target.checked;
    console.log(`🧭 Intentando cambiar visibilidad de: ${id} → ${visible}`);
    if (!map.getLayer(id)) {
      console.warn(`⚠️ La capa ${id} aún no existe en el mapa`);
      return;
    }
    map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    console.log(`✅ Visibilidad de ${id} cambiada correctamente`);
  });
}
