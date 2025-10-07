// === TRANSICIÓN ENTRE PÁGINAS / MISIONES ===
// Crea una animación de fundido antes de cambiar de URL
function transitionTo(url) {
    // Crear overlay negro con animación
    const overlay = document.createElement('div');
    overlay.id = 'transition-overlay';
    document.body.appendChild(overlay);
  
    // Esperar a que el overlay cubra la pantalla y cambiar de página
    setTimeout(() => {
      window.location.href = url;
    }, 800); // 800ms = duración del fundido
  }
  
  // Aplicar transición a todos los botones "Ver misión"
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.mission-card button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const enlace = btn.getAttribute('onclick') || btn.dataset.href || btn.parentElement.dataset.enlace;
        // Si ya tienes el enlace en el atributo href del botón:
        const url = btn.getAttribute('data-url') || btn.getAttribute('href') || btn.closest('.mission-card')?.dataset.url;
        // O si lo defines manualmente en tu script principal
        transitionTo(btn.getAttribute('data-url') || btn.dataset.url || btn.dataset.href);
      });
    });
  });
  