import { getBasePath, getMisionURL } from "./utils.js";
import { Logger } from "./logger.js";
import { showErrorMessage } from "./uiModule.js";

/**
 * Carga el archivo misiones.geojson y genera los elementos
 * del panel lateral y los marcadores HUD en el mapa.
 */
export async function loadMissions(map) {
  const dataPath = `${getBasePath()}data/misiones.geojson`;

  try {
    // === 1. Petición y validación del archivo ===
    const res = await fetch(dataPath);
    if (!res.ok) throw new Error("No se pudo acceder a misiones.geojson");

    const data = await res.json();
    if (!data.features || !data.features.length) {
      throw new Error("No hay misiones disponibles en el GeoJSON");
    }

    const missionsContainer = document.getElementById("missions-container");
    missionsContainer.innerHTML = ""; // limpia antes de generar

    Logger.mission(`Cargando ${data.features.length} misiones...`);

    // === 2. Iterar misiones y crear HUD + tarjetas ===
    data.features.forEach((feature, idx) => {
      const { nombre, descripcion, enlace, estado } = feature.properties;
      const [lon, lat] = feature.geometry.coordinates.map(Number);
      if (isNaN(lon) || isNaN(lat)) {
        Logger.error(`Coordenadas inválidas en misión ${nombre || idx}`);
        return;
      }

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
              <a href="${getMisionURL(enlace)}" style="color:#00ffc6;">Iniciar misión →</a>
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
        <button>Ver misión</button>
      `;

      // Clic en botón → abrir misión
      card.querySelector("button").addEventListener("click", (e) => {
        e.stopPropagation();
        Logger.ui(`Abriendo misión: ${nombre}`);
        window.location.href = getMisionURL(enlace);
      });

      // Clic en tarjeta → centrar mapa
      card.addEventListener("click", () => {
        map.flyTo({ center: [lon, lat], zoom: 7 });
      });

      missionsContainer.appendChild(card);
    });

    Logger.ok("Misiones cargadas correctamente.");
  } catch (err) {
    Logger.error("Error al cargar las misiones", err);
    showErrorMessage("No se pudieron cargar las misiones activas. Verifica el archivo misiones.geojson.");
  }
}
