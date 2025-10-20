// ======================================================
// 🎛️ autoHidePanels.js — gestión de desplegables inteligentes
// ======================================================
window.AutoHidePanels = (() => {

  /**
   * Activa autocierre por hover-out en un panel.
   * @param {HTMLElement} panel - el panel desplegable (color, buffer, etc.)
   * @param {Function} hideFn - función que lo oculte (por ej. ToolColorSelector.toggle(false))
   * @param {number} delay - milisegundos de gracia antes de ocultar (default: 400)
   */
  function bind(panel, hideFn, delay = 400) {
    if (!panel) return;

    let timer;

    panel.addEventListener('mouseenter', () => {
      clearTimeout(timer);
    });

    panel.addEventListener('mouseleave', () => {
      timer = setTimeout(() => {
        hideFn(false);
      }, delay);
    });

    // Por si sale rápido del panel sin volver (safety)
    panel.addEventListener('blur', () => hideFn(false));
  }

  return { bind };
})();
