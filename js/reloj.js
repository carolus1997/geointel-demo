// === RELOJ LED GLOBAL ===
function initFooterClock() {
  function updateFooterClock() {
    const now = new Date();
    const madridTime = now.toLocaleTimeString('es-ES', {
      timeZone: 'Europe/Madrid',
      hour12: false
    });
    const madridDate = now.toLocaleDateString('es-ES', {
      timeZone: 'Europe/Madrid',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });

    const t = document.getElementById('clock-time');
    const d = document.getElementById('clock-date');
    if (t && d) {
      t.textContent = madridTime;
      d.textContent = madridDate.toUpperCase();
    }
  }

  updateFooterClock();
  setInterval(updateFooterClock, 1000);
}
