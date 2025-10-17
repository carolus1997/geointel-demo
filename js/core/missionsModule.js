// js/core/missionsModule.js — versión global (window.*)

window.loadMissions = async function (map) {
  console.log("🧪 loadMissions() ejecutándose...");
  const dataPath = `${window.getBasePath()}data/misiones.geojson`;

  try {
    const res = await fetch(dataPath);
    if (!res.ok) throw new Error("No se pudo acceder a misiones.geojson");

    const data = await res.json();
    if (!data.features || !data.features.length) {
      throw new Error("No hay misiones disponibles en el GeoJSON");
    }

    const missionsContainer = document.getElementById("missions-container");
    missionsContainer.innerHTML = ""; // limpia antes de generar

    window.Logger?.mission(`Cargando ${data.features.length} misiones...`);

    data.features.forEach((feature, idx) => {
      let { nombre, descripcion, enlace, estado } = feature.properties;
      const [lon, lat] = feature.geometry.coordinates.map(Number);
      if (isNaN(lon) || isNaN(lat)) {
        window.Logger?.error(`Coordenadas inválidas en misión ${nombre || idx}`);
        return;
      }

      // Verificar si el estado está guardado en localStorage
      const estadoGuardado = localStorage.getItem(`estado-${enlace}`);
      if (estadoGuardado) estado = estadoGuardado;

      // --- HUD marcador ---
      const anchor = document.createElement("div");
      anchor.className = "invisible-anchor";

      const hud = document.createElement("div");
      hud.className = `hud-marker ${estado?.toLowerCase() || ""}`;

      const label = document.createElement("span");
      label.textContent = nombre;
      hud.appendChild(label);
      anchor.appendChild(hud);

      new maplibregl.Marker({ element: anchor, anchor: "center" })
        .setLngLat([lon, lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="popup-hud">
              <strong>${nombre}</strong><br>
              <a href="${window.getMisionURL(enlace)}" style="color:#00ffc6;">Iniciar misión →</a>
            </div>
          `)
        )
        .addTo(map);

      // --- Tarjeta lateral ---
      const card = document.createElement("div");
      card.className = "mission-card";
      card.innerHTML = `
        <h3>${nombre}</h3>
        <p>${descripcion}</p>
        <button></button>
      `;

      const btn = card.querySelector("button");

      // Estado visual del botón
      if (estado === "completada") {
        btn.textContent = "Completada";
        btn.disabled = true;
        btn.classList.add("btn-completada");
      } else if (estado === "bloqueada") {
        btn.textContent = "Bloqueada";
        btn.disabled = true;
        btn.classList.add("btn-bloqueada");
      } else {
        btn.textContent = "Ver misión";
        btn.classList.add("btn-activa");
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.Logger?.ui(`Abriendo misión: ${nombre}`);

          localStorage.setItem(`estado-${enlace}`, "completada");
          hud.classList.remove("activa", "bloqueada");
          hud.classList.add("completada");

          window.location.href = window.getMisionURL(enlace);
        });
      }

      // Clic en tarjeta → centrar mapa
      card.addEventListener("click", () => {
        map.flyTo({ center: [lon, lat], zoom: 7 });
      });

      missionsContainer.appendChild(card);
    });

    window.Logger?.ok("Misiones cargadas correctamente.");
  } catch (err) {
    window.Logger?.error?.("Error al cargar las misiones", err);
    window.showErrorMessage?.("No se pudieron cargar las misiones activas. Verifica el archivo misiones.geojson.");
  }

  // Botón para resetear misiones
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Resetear misiones";
  resetBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #222;
    color: #00ffc6;
    border: 1px solid #00ffc6;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    z-index: 2000;
  `;
  resetBtn.addEventListener("click", () => {
    const confirmReset = confirm("¿Seguro que quieres resetear el estado de todas las misiones?");
    if (!confirmReset) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith("estado-"))
      .forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  });
  document.body.appendChild(resetBtn);
};
