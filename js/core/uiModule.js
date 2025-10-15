// js/core/uiModule.js
export function showIntro(message = "Inicializando interfaz táctica...") {
  const intro = document.getElementById("intro-screen");
  const status = document.getElementById("intro-status");
  if (!intro) return;

  intro.classList.remove("hidden");
  intro.style.display = "flex";
  intro.style.opacity = "1";

  // Limpia y aplica el mensaje inicial con efecto de escritura
  if (status) typeText(status, message);

  // Añade el loader circular si no existe aún
  if (!document.querySelector(".intro-loader")) {
    const loader = document.createElement("div");
    loader.className = "intro-loader";
    intro.querySelector(".intro-content")?.appendChild(loader);
  }
}

export function updateIntroStatus(text) {
  const status = document.getElementById("intro-status");
  if (status) {
    status.textContent = ""; // limpia texto anterior
    typeText(status, text); // escribe nuevo texto con animación
  }
}

export function hideIntro() {
  const intro = document.getElementById("intro-screen");
  if (!intro) return;

  intro.classList.add("hidden");
  setTimeout(() => {
    intro.style.display = "none";
  }, 1000); // coincide con transición CSS
}

// === Animación de escritura táctica (mini-typewriter interno) ===
function typeText(element, text) {
  let i = 0;
  const cursor = document.createElement("span");
  cursor.className = "tw-cursor";
  cursor.textContent = "▌";
  element.appendChild(cursor);

  function type() {
    // Si el cursor o el elemento desaparecen, detener animación
    if (!cursor.isConnected || !element.isConnected) return;

    // Si el cursor ya no está dentro del elemento, abortar (evita el NotFoundError)
    if (i < text.length && element.contains(cursor)) {
      const charNode = document.createTextNode(text.charAt(i));
      element.insertBefore(charNode, cursor);
      i++;
      const delay = 15 + Math.random() * 35;
      setTimeout(type, delay);
    } else {
      // Final de texto o cursor perdido
      if (cursor.isConnected) {
        cursor.classList.add("fade-out");
        setTimeout(() => cursor.remove(), 500);
      }
    }
  }

  type();
}



export function showErrorMessage(message = "Error desconocido") {
  const container = document.createElement("div");
  container.className = "ui-error-hud";
  container.innerHTML = `
    <div class="ui-error-box">
      <h3>⚠️ ERROR</h3>
      <p>${message}</p>
      <button id="reload-btn">Reintentar</button>
    </div>
  `;
  document.body.appendChild(container);

  document.getElementById("reload-btn").addEventListener("click", () => {
    window.location.reload();
  });
}
