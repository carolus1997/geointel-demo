// ===========================================
// 🔹 loadFooter.js — Carga dinámica del footer táctico
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Crear el elemento <footer>
  const footer = document.createElement("footer");
  footer.className = "app-footer";

  // 2️⃣ Estructura del footer
  footer.innerHTML = `
    <div class="footer-left">
      <span>© Centro de Operaciones — Geointeligencia Táctica</span>
    </div>

    <div class="footer-right">
      <div id="hud-clock">
        <div id="clock-time">--:--:--</div>
        <div id="clock-date">--/--/----</div>
      </div>
    </div>
  `;

  // 3️⃣ Insertar el footer al final del #app-container (correcto para flex layout)
  const appContainer = document.getElementById("app-container");
  if (appContainer) {
    appContainer.appendChild(footer);
  } else {
    console.warn("⚠️ No se encontró #app-container. Footer no insertado.");
  }

  // 4️⃣ Inicializar el reloj
  initClock();
});


// ===========================================
// 🔹 Reloj LED rojo táctico
// ===========================================
function initClock() {
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");

  if (!timeEl || !dateEl) return;

  function updateClock() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    dateEl.textContent = `${day}/${month}/${year}`;
  }

  // Actualización cada segundo
  updateClock();
  setInterval(updateClock, 1000);
}
