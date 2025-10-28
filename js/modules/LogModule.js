function add(message, type = 'info') {
    panel.prepend(entry);
    panel.scrollTo({ top: 0, behavior: 'smooth' });

    if (!panel) return;

    const icons = {
        info: '🛰️',
        success: '✅',
        alert: '⚠️',
        system: '💾'
    };

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
    <span class="timestamp">${new Date().toLocaleTimeString('es-ES')}</span>
    <span>${icons[type] || ''}</span> ${message}
  `;

    // Añadir arriba de la pila
    panel.prepend(entry);

    // Actualizar contador
    const countEl = document.getElementById('log-count');
    if (countEl) countEl.textContent = panel.children.length;

    // Eliminar exceso (si hay más de 30 eventos)
    if (panel.children.length > 30) {
        panel.removeChild(panel.lastChild);
    }
}
