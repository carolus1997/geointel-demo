import { renderZonasRiesgo } from './puntosRiesgo.js';
import { initLayersControl } from './layersControl.js';

const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// === Crear el mapa ===
const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-3.7038, 40.4168],
  zoom: 10.5,
  pitch: 0,
  bearing: 0,
  attributionControl: false
});

// === Controles básicos ===
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// === Al cargar el mapa ===
map.on('load', () => {
  window.map = map; // Para acceder desde consola

  map.once('idle', () => {
    document.getElementById('map').classList.add('ready');
    map.resize();
    map.triggerRepaint();
  });

  // === CAPAS BASE: SATÉLITE ===

  map.addSource('satellite', {
    type: 'raster',
    tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

  map.addLayer({
    id: 'satellite-layer',
    type: 'raster',
    source: 'satellite',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' }
  });


  // 🟢 =====================================================
  // 🟢 FUNCIÓN PARA MARCADORES SVG + POPUPS TÁCTICOS
  // 🟢 =====================================================
  function addSvgMarkers(geojsonUrl, svgPath, sizePx = 28, groupName = null) {
    fetch(geojsonUrl)
      .then(res => res.json())
      .then(data => {
        if (!window._svgMarkers) window._svgMarkers = {};
        if (groupName && !window._svgMarkers[groupName]) {
          window._svgMarkers[groupName] = [];
        }

        data.features.forEach(f => {
          const coords = f.geometry.coordinates;
          const props = f.properties || {};

          // === Crear elemento SVG ===
          const el = document.createElement('div');
          el.innerHTML = `
          <img src="${svgPath}" 
               style="width:${sizePx}px;
                      height:auto;
                      aspect-ratio:1/1;
                      object-fit:contain;
                      display:block;
                      cursor:pointer;
                      transition:transform 0.2s ease;
                      filter:drop-shadow(0 0 2px #000);
                      transform-origin:center;">`;

          const img = el.firstElementChild;

          // === Efecto hover ===
          img.addEventListener('mouseenter', () => (img.style.transform = 'scale(1.25)'));
          img.addEventListener('mouseleave', () => (img.style.transform = 'scale(1)'));

          // === Popup táctico según grupo ===
          let popupHtml = "";

          switch (groupName) {
            case "Comisarías":
              popupHtml = `
              <div class="popup-tactico">
                <div class="popup-title"> ${props["NOMBRE"] || "Comisaría"}</div>
                <div class="popup-meta">
                  <div><span>Distrito:</span> ${props["DISTRITO"] || "-"}</div>
                  <div><span>Barrio:</span> ${props["BARRIO"] || "-"}</div>
                  <div><span>Dirección:</span> ${props["NOMBRE-VIA"] || ""} ${props["NUM"] || ""}</div>
                  <div><span>Horario:</span> ${props["HORARIO"] || "-"}</div>
                  <div><span>Teléfono:</span> ${props["TELEFONO"] || "-"}</div>
                  <div><span>Transporte:</span> ${props["TRANSPORTE"] || "-"}</div>
                </div>
              </div>`;
              break;

            case "Mezquitas":
              popupHtml = `
              <div class="popup-tactico">
                <div class="popup-title"> ${props["name"] || "Mezquita"}</div>
                <div class="popup-meta">
                  <div><span>Dirección:</span> ${props["addr_stree"] || ""} ${props["addr_house"] || ""}</div>
                  <div><span>Ciudad:</span> ${props["addr_city"] || "-"}</div>
                  <div><span>Denominación:</span> ${props["denominati"] || "-"}</div>
                  <div><span>Operador:</span> ${props["operator"] || "-"}</div>
                  <div><span>Teléfono:</span> ${props["phone"] || "-"}</div>
                </div>
              </div>`;
              break;

            case "Parques":
              popupHtml = `
              <div class="popup-tactico">
                <div class="popup-title"> ${props["name"] || "Parque"}</div>
                <div class="popup-meta">
                  <div><span>Dirección:</span> ${props["addr:street"] || ""}, ${props["addr:city"] || ""}</div>
                  <div><span>Horario:</span> ${props["opening_hours"] || "-"}</div>
                  <div><span>Operador:</span> ${props["operator"] || "-"}</div>
                  <div><span>Teléfono:</span> ${props["phone"] || "-"}</div>
                  <div><span>Acceso:</span> ${props["access"] || "-"}</div>
                </div>
              </div>`;
              break;

            case "Estaciones de metro":
              popupHtml = `
              <div class="popup-tactico">
                <div class="popup-title"> ${props["DENOMINACI"] || "Estación de Metro"}</div>
                <div class="popup-meta">
                  <div><span>Línea:</span> ${props["LINEAS"] || "-"}</div>
                  <div><span>Dirección:</span> ${props["NOMBREVIA"] || ""} ${props["NUMEROPORT"] || ""}</div>
                  <div><span>Distrito:</span> ${props["DISTRITO"] || "-"}</div>
                  <div><span>Accesibilidad:</span> ${props["GRADOACCES"] || "-"}</div>
                  <div><span>Zona tarifaria:</span> ${props["CORONATARI"] || "-"}</div>
                </div>
              </div>`;
              break;
          }

          // === Crear popup y vincular ===
          const popup = new maplibregl.Popup({ offset: 25, closeButton: false, className: "popup-tactico" })
            .setHTML(popupHtml);

          // === Crear marcador y vincular popup ===
          const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(map);

          if (groupName) window._svgMarkers[groupName].push(marker);
        });

        console.log(`✅ Marcadores SVG + popups añadidos desde ${geojsonUrl}`);
      })
      .catch(err => console.error(`❌ Error cargando ${geojsonUrl}:`, err));
  }



  // ======================================================
  // CARGA DE CAPAS GEOJSON (solo las que necesitan capas reales)
  // ======================================================
  const dataPath = './data/';

  async function addGeoJSONLayer(id, file, type, paint, visible = false) {
    const res = await fetch(`${dataPath}${file}`);
    if (!res.ok) return console.warn(`⚠️ No se pudo cargar ${file}`);
    const data = await res.json();

    map.addSource(id, { type: 'geojson', data });

    // 🧹 Eliminar propiedades no soportadas por MapLibre
    if (type === 'fill') delete paint['fill-outline-width'];

    const layer = {
      id,
      type,
      source: id,
      layout: { visibility: visible ? 'visible' : 'none' },
      paint
    };

    const lastLayer = map.getStyle().layers.at(-1).id;
    map.addLayer(layer, lastLayer);

    // 🧠 Si la capa es "SSCCDemografia", aplicamos popup y cursor táctico
    if (id === "SSCCDemografia") {
      map.on("click", id, e => {
        const f = e.features[0];
        const p = f.properties;

        // Clasificación textual del nivel de riesgo
        let nivel = "Bajo";
        if (p.IRC >= 0.50) nivel = "Alto";
        else if (p.IRC >= 0.34) nivel = "Medio-Alto";
        else if (p.IRC >= 0.20) nivel = "Medio-Bajo";

        const popupHtml = `
      <div class="popup-tactico">
        <div class="popup-title">Sección ${p["COD_SECCIO"] || ""}</div>
        <div class="popup-meta">
          <div><span>Distrito:</span> ${p["NOM_DIS"] || "-"}</div>
          <div><span>Barrio:</span> ${p["NOM_BAR"] || "-"}</div>
          <div><span>IRC:</span> ${(p["IRC"] * 100).toFixed(1)} / 100 (${nivel})</div>
          <div><span>IVU:</span> ${(p["IVU"] * 100).toFixed(1) || "-"} / 100</div>
          <div><span>Densidad:</span> ${(p["Densidad"] ? (p["Densidad"] * 10000).toFixed(1) : "-")} hab/km²</div>
          <div><span>Paro:</span> ${(p["Paro"] ? (p["Paro"] * 100).toFixed(1) + "%" : "-")}</div>
          <div><span>Renta inversa:</span> ${(p["RentInv"] ? (p["RentInv"] * 100).toFixed(1) + "%" : "-")}</div>
          <div><span>Inmigración:</span> ${(p["PropImmExt"] ? (p["PropImmExt"] * 100).toFixed(1) + "%" : "-")}</div>
          <div><span>Índice de juventud:</span> ${p["IndJuventud"]?.toFixed(2) || "-"}</div>
        </div>
      </div>`;

        new maplibregl.Popup({ closeButton: false, offset: 20, className: "popup-tactico" })
          .setLngLat(e.lngLat)
          .setHTML(popupHtml)
          .addTo(map);
      });

      // Cambiar cursor
      map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
    }



    console.log(`✅ Capa añadida: ${id}`);
  }

  // ======================================================
  // CARGA DE TODAS LAS CAPAS (combinando SVG + capas normales)
  // ======================================================
  (async () => {
    const styles = await (await fetch('./data/estilos/data/styles.json')).json();

    // === Capas normales ===
    const capas = [
      ['barrios', 'barrios.geojson', 'fill', { 'fill-opacity': 0 }],
      ['Parques', 'Parques.geojson', 'fill', styles.Parques],
      ['FuentesAgua', 'FuentesAguaParques.geojson', 'circle', styles.FuentesAgua],
      ['BancosParques', 'BancosParques.geojson', 'circle', styles.BancosParques],
      ['bufferMetro', '200mMetro.geojson', 'fill', styles['200mMetro']],
      ['SSCCDemografia', 'SSCCDemografia.geojson', 'fill', styles.SSCCDemografia]

    ];

    for (const [id, file, type, paint] of capas) {
      await addGeoJSONLayer(id, file, type, paint, id === 'barrios');
    }
    // === Popups tácticos para Parques (capa fill) ===
    map.on('click', 'Parques', e => {
      const f = e.features[0];
      const props = f.properties || {};

      const popupHtml = `
    <div class="popup-tactico">
      <div class="popup-title">${props["name"] || "Parque"}</div>
      <div class="popup-meta">
        <div><span>Dirección:</span> ${props["addr:street"] || ""}, ${props["addr:city"] || ""}</div>
        <div><span>Horario:</span> ${props["opening_hours"] || "-"}</div>
        <div><span>Operador:</span> ${props["operator"] || "-"}</div>
        <div><span>Acceso:</span> ${props["access"] || "-"}</div>
        <div><span>Superficie:</span> ${props["area"] || "-"} m²</div>
      </div>
    </div>
  `;

      new maplibregl.Popup({
        closeButton: false,
        offset: 20,
        className: 'popup-tactico'
      })
        .setLngLat(e.lngLat)
        .setHTML(popupHtml)
        .addTo(map);
    });

    // 🖱️ Cambiar cursor al pasar sobre parques
    map.on('mouseenter', 'Parques', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'Parques', () => (map.getCanvas().style.cursor = ''));

    // === Capas con iconos SVG personalizados ===
    addSvgMarkers(`${dataPath}comisarias.geojson`, '../../img/logos/logoCNP.svg', 26, 'Comisarías');
    addSvgMarkers(`${dataPath}Mezquitas.geojson`, '../../img/logos/mezquita.svg', 22, 'Mezquitas');
    addSvgMarkers(`${dataPath}EstacionesMetro.geojson`, '../../img/logos/MetroMadridLogo.svg', 24, 'Estaciones de metro');

    // === Etiquetas de barrios ===
    map.addLayer({
      id: 'barrios-labels',
      type: 'symbol',
      source: 'barrios',
      layout: {
        'text-field': ['get', 'NOMBRE'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-allow-overlap': false,
        'text-offset': [0, 0.8],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1.2
      }
    });

    // === Panel de capas (añadimos también los grupos SVG) ===
    initLayersControl(map, [
      { id: 'barrios-labels', name: 'Barrios', visible: true },

      // 🟢 NUEVOS GRUPOS SVG
      { id: 'Comisarías', name: 'Comisarías', visible: false },
      { id: 'Mezquitas', name: 'Mezquitas', visible: false },
      { id: 'Estaciones de metro', name: 'Estaciones de metro', visible: false },
      { id: 'Parques', name: 'Parques', visible: false },
      { id: 'FuentesAgua', name: 'Fuentes de agua', visible: false },
      { id: 'BancosParques', name: 'Bancos de parques', visible: false },
      { id: 'bufferMetro', name: 'Área 200 m de metro', visible: false },
      { id: 'SSCCDemografia', name: 'Demografía (SSCC)', visible: false }
    ]);

    // === LEYENDA IRC ===
    const legend = document.createElement('div');
    legend.className = 'irc-legend';
    legend.innerHTML = `
  <h4>Índice de Riesgo Compuesto (IRC)</h4>
  <div><span style="background:#2ECC71"></span>Bajo</div>
  <div><span style="background:#F1C40F"></span>Medio-Bajo</div>
  <div><span style="background:#E67E22"></span>Medio-Alto</div>
  <div><span style="background:#C0392B"></span>Alto</div>
`;
    document.body.appendChild(legend);

  })();

  map.triggerRepaint();



  // === TOGGLES DE CAPA BASE ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  function updateBasemapState(activeLayer) {
    const isHillshade = activeLayer === 'hillshade';
    const isSatellite = activeLayer === 'satellite';

    map.setLayoutProperty('hillshade-layer', 'visibility', isHillshade ? 'visible' : 'none');
    map.setLayoutProperty('satellite-layer', 'visibility', isSatellite ? 'visible' : 'none');

    toggleHillshade?.classList.toggle('active', isHillshade);
    toggleSat?.classList.toggle('active', isSatellite);
    map.triggerRepaint();
  }

  toggleHillshade?.addEventListener('click', () => {
    const active = toggleHillshade.classList.contains('active');
    updateBasemapState(active ? null : 'hillshade');
  });

  toggleSat?.addEventListener('click', () => {
    const active = toggleSat.classList.contains('active');
    updateBasemapState(active ? null : 'satellite');
  });

  // === HUD ZONAS DE RIESGO ===
  try {
    renderZonasRiesgo(map);
  } catch (e) {
    console.warn("⚠️ No se pudo cargar renderZonasRiesgo:", e);
  }

  // === TOOLBOX + DIBUJO ===
  try {
    console.log("📦 Comprobando si MapboxDraw está definido...");
    console.log("🧪 typeof MapboxDraw:", typeof MapboxDraw);

    if (typeof MapboxDraw === 'undefined') {
      throw new Error("❌ MapboxDraw no está definido. Posible fallo en la carga del script.");
    }

    console.log("✅ MapboxDraw está definido, intentando instanciar...");

    const Draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: { "fill-color": "#00E5FF", "fill-opacity": 0.1 }
        },
        {
          id: "gl-draw-line-active",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
          paint: { "line-color": "#00C896", "line-width": 2 }
        },
        {
          id: "gl-draw-point-active",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["!=", "mode", "static"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#FF6B00",
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 1.5
          }
        }
      ]
    });

    console.log("✅ Instancia de MapboxDraw creada.");
    console.log("🧭 Comprobando si 'map' está definido:", typeof map);

    map.addControl(Draw, 'top-right');
    console.log("✅ Control Draw añadido al mapa.");

    if (typeof Toolbox === 'undefined') {
      throw new Error("❌ Toolbox no está definido. ¿Cargaste ui_toolbox.js correctamente?");
    }

    console.log("🧪 Iniciando Toolbox...");
    Toolbox.init(map, Draw);
    console.log("✅ Toolbox inicializado.");

  } catch (err) {
    console.error("❌ Error al inicializar Toolbox o Draw:", err);
  }



});

// === HUD COORDENADAS Y HORA ===
const coordDisplay = document.getElementById('coords');
const timeDisplay = document.getElementById('time');

if (coordDisplay) {
  map.on('mousemove', e => {
    const { lng, lat } = e.lngLat;
    coordDisplay.textContent = `${lng.toFixed(4)}, ${lat.toFixed(4)}`;
  });
}

if (timeDisplay) {
  const updateTime = () => {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' });
  };
  setInterval(updateTime, 1000);
  updateTime();
}

// === BOTÓN REGRESO ===
document.getElementById('btn-back')?.addEventListener('click', () => {
  window.location.href = '../../index.html';
});
