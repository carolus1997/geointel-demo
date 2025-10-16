// js/ui/simulationPanel.js
window.SimulationPanel = (() => {
  function init() {
    // Crear panel dinámicamente si no existe
    if (!document.getElementById("simulation-panel")) {
      const panel = document.createElement("div");
      panel.id = "simulation-panel";
      panel.className = "sim-panel";
      panel.innerHTML = `
        <button id="sim-slower" title="Reducir velocidad">⏪</button>
        <button id="sim-pause" title="Pausar / Reanudar">⏸️</button>
        <button id="sim-normal" title="Velocidad normal">▶️ 1x</button>
        <button id="sim-faster" title="Aumentar velocidad">⏩</button>
      `;
      document.body.appendChild(panel);
    }

    const slower = document.getElementById("sim-slower");
    const pause = document.getElementById("sim-pause");
    const normal = document.getElementById("sim-normal");
    const faster = document.getElementById("sim-faster");

    slower.addEventListener("click", () => {
      window.SIMULATION_SPEED = Math.max(0.25, window.SIMULATION_SPEED / 2);
      updateLabel();
    });

    faster.addEventListener("click", () => {
      window.SIMULATION_SPEED = Math.min(32, window.SIMULATION_SPEED * 2);
      updateLabel();
    });

    normal.addEventListener("click", () => {
      window.SIMULATION_SPEED = 1;
      updateLabel();
    });

    pause.addEventListener("click", () => {
      window.SIMULATION_PAUSED = !window.SIMULATION_PAUSED;
      pause.textContent = window.SIMULATION_PAUSED ? "▶️" : "⏸️";
    });

    updateLabel();
  }

  function updateLabel() {
    const normal = document.getElementById("sim-normal");
    if (normal) normal.textContent = `▶️ ${window.SIMULATION_SPEED.toFixed(2)}x`;
  }

  return { init };
})();
