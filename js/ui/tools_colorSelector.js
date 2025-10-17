// 🎨 Selector de color táctico (desplegable desde el botón principal)
window.ToolColorSelector = (() => {
  const tipos = {
    seguro: "#00C896",
    riesgo: "#FFD400",
    hostil: "#FF2F00",
    observacion: "#00E5FF"
  };

  let activo = "seguro";
  let panel;

  function init(container = document.body) {
    if (document.getElementById("color-dropdown")) return;

    panel = document.createElement("div");
    panel.id = "color-dropdown";
    panel.classList.add("dropdown-panel");

    panel.innerHTML = Object.entries(tipos)
      .map(
        ([key, color]) => `
        <div class="color-opt" data-key="${key}" style="--clr:${color}" title="${key}"></div>
      `
      )
      .join("");

    container.appendChild(panel);

    panel.querySelectorAll(".color-opt").forEach((opt) => {
      opt.addEventListener("click", () => {
        activo = opt.dataset.key;
        window.ACTIVE_DRAW_COLOR = tipos[activo];
        actualizarUI();
      });
    });

    window.ACTIVE_DRAW_COLOR = tipos[activo];
    actualizarUI();
  }

  function toggle(show = null) {
    if (!panel) return;
    const visible = show !== null ? show : !panel.classList.contains("visible");
    panel.classList.toggle("visible", visible);
  }

  function posicionarRespecto(btn) {
    if (!panel || !btn) return;
    const rect = btn.getBoundingClientRect();
    panel.style.position = "absolute";
    
  }

  function actualizarUI() {
    panel.querySelectorAll(".color-opt").forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.key === activo);
    });
  }

  // 🔹 Método común para otros módulos (notas, polígonos, etc.)
  function getActivo() {
    return { tipo: activo, color: tipos[activo] };
  }

  return { init, toggle, getActivo, posicionarRespecto };
})();
