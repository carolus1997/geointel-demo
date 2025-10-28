// ==========================
//  Misión 2 — mision2.js
// ==========================

// === CONFIG MAPLIBRE ===
const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
  center: [-5.35, 35.95], // Estrecho de Gibraltar
  zoom: 9,
  attributionControl: false,
  preserveDrawingBuffer: true
});

// === CONTROLES BÁSICOS ===
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

// 🕹️ === CONFIGURACIÓN GLOBAL DE SIMULACIÓN ===
window.SIMULATION_SPEED = 1;   // 1x = velocidad normal
window.SIMULATION_PAUSED = false; // pausa desactivada al inicio

// === UTIL: añadir capa GeoJSON de polígonos (si hiciera falta) ===
function addLayer(srcId, dataPath, color) {
  if (map.getSource(srcId)) return;
  map.addSource(srcId, { type: 'geojson', data: dataPath });
  map.addLayer({
    id: srcId,
    type: 'fill',
    source: srcId,
    paint: {
      'fill-color': color,
      'fill-opacity': 0.35,
      'fill-outline-color': '#00E5FF'
    }
  });
}

// === ARRANQUE CUANDO EL MAPA ESTÁ LISTO ===
map.on('load', async () => {
  console.log('🗺️ MapLibre listo');
  

  // Fade-in del canvas
  map.once('idle', () => {
    const el = document.getElementById('map');
    if (el) el.classList.add('ready');
    map.resize();
    map.triggerRepaint();
  });




  // === 1) CAPAS BASE: RELIEVE + SATÉLITE ===
  try {
    const firstLayerId = map.getStyle().layers?.[0]?.id;

    if (!map.getSource('hillshade')) {
      map.addSource('hillshade', {
        type: 'raster',
        tiles: [
          `https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
        ],
        tileSize: 256,
        attribution: '&copy; MapTiler terrain-hillshade'
      });
    }

    if (!map.getLayer('hillshade-layer')) {
      map.addLayer({
        id: 'hillshade-layer',
        type: 'raster',
        source: 'hillshade',
        paint: {
          'raster-opacity': 0.4,
          'raster-brightness-min': 0.8,
          'raster-brightness-max': 1.0
        },
        layout: { visibility: 'none' }
      }, firstLayerId);
    }

    if (!map.getSource('satellite')) {
      map.addSource('satellite', {
        type: 'raster',
        tiles: [
          `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
        ],
        tileSize: 256,
        attribution: '&copy; MapTiler satellite-v2'
      });
    }

    if (!map.getLayer('satellite-layer')) {
      map.addLayer({
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        paint: { 'raster-opacity': 1.0 },
        layout: { visibility: 'none' }
      });
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron añadir capas base:', e);
  }

  // === 🌬️ Capa de viento (OpenWeatherMap wind_new - free tile service) ===
  try {
    const OWM_KEY = '192ba88ae3bb8c31ff216d8bb4df16c0';
    const OWM_LAYER_ID = 'wind-layer';
    const OWM_URL = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`;

    if (!map.getSource('wind')) {
      map.addSource('wind', {
        type: 'raster',
        tiles: [OWM_URL],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a> (Wind Layer)'
      });
    }

    if (!map.getLayer(OWM_LAYER_ID)) {
      map.addLayer({
        id: OWM_LAYER_ID,
        type: 'raster',
        source: 'wind',
        paint: { 'raster-opacity': 0.7 },
        layout: { visibility: 'none' } // empieza oculta
      });
    }

    console.log('🌬️ Capa de viento (wind_new) añadida correctamente.');
  } catch (e) {
    console.warn('⚠️ No se pudo añadir la capa de viento:', e);
  }




  // === 2) RUTAS MARÍTIMAS (líneas de referencia) ===
  try {
    if (!map.getSource('routes')) {
      map.addSource('routes', { type: 'geojson', data: '../../data/Rutas.geojson' });
    }
    if (!map.getLayer('routes-line')) {
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': ['case', ['has', 'stroke'], ['get', 'stroke'], '#00E5FF'],
          'line-width': ['case', ['has', 'stroke-width'], ['get', 'stroke-width'], 2],
          'line-opacity': 0.9
        }
      });
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron añadir las rutas:', e);
  }


  function getBasePath() {
    return window.location.origin + '/misiones/mision2/';
  }
  // === 🌬️ Capa de viento local (tileado con gdal2tiles) ===







  // === 3) TOGGLES de base ===
  const toggleHillshade = document.getElementById('toggle-hillshade');
  const toggleSat = document.getElementById('toggle-sat');

  if (toggleHillshade) {
    toggleHillshade.addEventListener('click', () => {
      const vis = map.getLayoutProperty('hillshade-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('hillshade-layer', 'visibility', newVis);
      toggleHillshade.classList.toggle('active', newVis === 'visible');
      if (newVis === 'visible') {
        map.setLayoutProperty('satellite-layer', 'visibility', 'none');
        toggleSat?.classList.remove('active');
      }
    });
  }

  if (toggleSat) {
    toggleSat.addEventListener('click', () => {
      const vis = map.getLayoutProperty('satellite-layer', 'visibility');
      const newVis = vis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty('satellite-layer', 'visibility', newVis);
      toggleSat.classList.toggle('active', newVis === 'visible');
      if (newVis === 'visible') {
        map.setLayoutProperty('hillshade-layer', 'visibility', 'none');
        toggleHillshade?.classList.remove('active');
      }
    });
  }

  const toggleWindLocal = document.getElementById('toggle-wind-local');

  if (toggleWindLocal) {
    toggleWindLocal.addEventListener('click', () => {
      const layerId = 'wind-layer';
      if (!map.getLayer(layerId)) {
        console.warn('⚠️ La capa de viento no está cargada todavía.');
        return;
      }

      const currentVis = map.getLayoutProperty(layerId, 'visibility');
      const newVis = currentVis === 'none' ? 'visible' : 'none';
      map.setLayoutProperty(layerId, 'visibility', newVis);
      toggleWindLocal.classList.toggle('active', newVis === 'visible');
    });
  }

  // === 4) Dibujo (Draw) + Toolbox flotante ===
  try {
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

    map.addControl(Draw, "top-right"); // mejor en top-right para no chocar con toolbox

    // 🧩 Inicializar toolbox táctico
    map.once("idle", () => {
      console.log("🧭 Inicializando Toolbox...");
      Toolbox.init(map, Draw);
    });

  } catch (err) {
    console.error("❌ Error al inicializar Draw/Toolbox:", err);
  }


  // === 5) Esperar a que los módulos globales estén listos ===
  await waitForModules([
    'MovimientoModule',
    'RadarModule',
    'HelicopterModule',
    'GuardiaCivilModule',
    'PulseModule'
  ]);

  // === 6) Lanzar misión principal ===
  if (typeof startMision2 === 'function') {
    await startMision2();
  } else {
    console.error('❌ startMision2() no está definida.');
  }

  // === 7) Inicializar panel de simulación (si existe)
  if (window.SimulationPanel?.init) SimulationPanel.init();


});


// ————————————————————————————————
// Helpers
// ————————————————————————————————
function waitForModules(names, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    (function check() {
      const missing = names.filter(n => !window[n]);
      if (missing.length === 0) return resolve();
      if (performance.now() - t0 > timeoutMs) {
        console.warn('⏳ Módulos que no llegaron a tiempo:', missing);
        return resolve();
      }
      setTimeout(check, 100);
    })();
  });
}


// ————————————————————————————————
//  Bloque principal de la misión
// ————————————————————————————————
async function startMision2() {
  try {
    console.log('🚀 Iniciando Misión 2...');


    // 🔹 Función segura para obtener coordenadas (Point o Polygon)
    function getCoords(geom) {
      if (!geom) return null;
      if (geom.type === "Point") return geom.coordinates;
      if (Array.isArray(geom.coordinates?.[0])) return geom.coordinates[0];
      return geom.coordinates;
    }


    // 1️⃣ Cargar unidades principales
    await MovimientoModule.init(map, '../../data/unidades_maritimas.geojson');
    await waitForModules(['MovimientoModule', 'RadarModule', 'HelicopterModule']);


    if (window.PulseModule?.init) PulseModule.init(map);
    console.log("🧩 svgRoot en PulseModule:", document.querySelector(".pulse-svg-overlay"));



    if (window.HelicopterRadar?.init) HelicopterRadar.init(map);


    // 2️⃣ Inicializar helicóptero (sobre BAM)
    if (window.HelicopterModule?.init) {
      HelicopterModule.init(map, 'helicoptero');
    }
    if (window.HelicopterRadar?.init) HelicopterRadar.init(map);


    // 3️⃣ Cargar rutas desde GeoJSON
    const routes = await MovimientoModule.loadRoutes('../../data/Rutas.geojson');
    const bamRoute = routes.get('ruta_bam')?.coords;
    const narcoRoute = routes.get('ruta_narcolancha')?.coords;

    // 4️⃣ Animaciones
    const BAM_SPEED = 13;
    const NARCO_SPEED = 20;
    if (bamRoute) MovimientoModule.animateUnit('bam', bamRoute, BAM_SPEED);
    if (narcoRoute) MovimientoModule.animateUnit('narcolancha', narcoRoute, NARCO_SPEED);

    // ⬇️ Coloca esto tras las animaciones del BAM y la narcolancha
    startInterceptionWatcher();

    function startInterceptionWatcher() {
      let fired = false;
      const THRESH_KM = 1.0;

      function tick() {
        const heli = MovimientoModule.getPosition("helicoptero");
        const narco = MovimientoModule.getPosition("narcolancha");
        if (!heli || !narco) return requestAnimationFrame(tick);

        const d = turf.distance(turf.point(heli), turf.point(narco), {
          units: "kilometers"
        });

        if (!fired && d <= THRESH_KM) {
          fired = true;
          console.log("🚨 Interceptación confirmada por NH90");
          


          // === 1️⃣ ACTIVAR PULSO AMARILLO (Helicóptero ↔ BAM)
          console.log("🟡 Activando enlace directo Helicóptero ↔ BAM");
          PulseModule.link(
            "heli-bam",
            () => MovimientoModule.getPosition("helicoptero"),
            () => MovimientoModule.getPosition("bam"),
            { color: "#FFD000", frequency: 1, speed: 0.7 }
          );

          // === 2️⃣ ACTIVAR PULSOS VERDES (Comandancias ↔ Cuarteles)
          console.log("🟩 Activando red terrestre de Guardia Civil...");
          const { asignaciones } =
            GuardiaCivilModule.assignCuartelesToNearestComandancia?.() || {};

          asignaciones?.forEach((cuarteles, cmdNombre) => {
            const cmd = GuardiaCivilModule._gcComandancias.find(
              c => c.properties.nombre === cmdNombre
            );
            if (!cmd) return;

            cuarteles.forEach((cuartel, j) => {
              console.log(`🟩 Enlace ${cmdNombre} → ${cuartel.properties.nombre}`);
              PulseModule.link(
                `cmd-${cmdNombre}-${j}`,
                () => getCoords(cmd.geometry),
                () => getCoords(cuartel.geometry),
                { color: "#00FF90", frequency: 0.4, speed: 0.4 }
              );

            });
          });

          // === 3️⃣ Notificar a las comandancias y propagar alerta
          window.GuardiaCivilModule?.notifyComandancias({
            message: "Interceptación confirmada por helicóptero NH90.",
            source: "Helicóptero",
            level: "alerta"
          });

          setTimeout(() => {
            window.GuardiaCivilModule?.propagateAlertNearest?.();
          }, 900);

          return; // 🔚 Detener watcher tras interceptar
        }


        if (!fired) requestAnimationFrame(tick);

      }

      requestAnimationFrame(tick);
    }






    // 4️⃣ BIS) Desplegar Guardia Civil (cuarteles fijos)
    try {
      console.log('🟩 Desplegando cuarteles de la Guardia Civil...');

      const res = await fetch('./guadiaCivil4326.geojson');
      const data = await res.json();

      // Registrar el icono si no está cargado
      if (!map.hasImage('icon_guardia_civil')) {
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.src = '../../img/icons/icon_guardia_civil.png';
          image.onload = () => resolve(image);
          image.onerror = reject;
        });
        map.addImage('icon_guardia_civil', img);
      }

      // Crear la fuente GeoJSON
      if (!map.getSource('guardia_civil')) {
        map.addSource('guardia_civil', { type: 'geojson', data });
      }

      // Añadir la capa de símbolos
      if (!map.getLayer('guardia_civil_layer')) {
        map.addLayer({
          id: 'guardia_civil_layer',
          type: 'symbol',
          source: 'guardia_civil',
          layout: {
            'icon-image': 'icon_guardia_civil',
            'icon-size': 0.1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });
      }

      console.log(`✅ ${data.features.length} cuarteles de la Guardia Civil desplegados`);

      // === Enlaces dinámicos de comunicación ===
      console.log("⚡ Activando enlaces de comunicación táctica...");



      // 🟦 y 🟩 se activan cuando Guardia Civil esté lista
      window.addEventListener("GC_READY", () => {
        console.log("🟩 Guardia Civil lista — creando enlaces a comandancias y cuarteles");

        // 🟦 BAM → Comandancias
        window.GuardiaCivilModule._gcComandancias?.forEach((cmd, i) => {
          console.log(`🟦 Enlace BAM → ${cmd.properties.nombre}`);
          const bamMarker = MovimientoModule.getMarker("bam");
          const bamPos = bamMarker?.getLngLat();
          const cmdCoords = getCoords(cmd.geometry);
          if (!bamPos || !cmdCoords) return;

          PulseModule.link(
            `bam-${cmd.properties.nombre.replace(/\s+/g, '_')}`,
            () => MovimientoModule.getPosition("bam"),
            () => getCoords(cmd.geometry),
            { color: "#00fbffff", frequency: 1.0, speed: 0.8 }
          );

        });


      });

    } catch (err) {
      console.error('❌ Error al cargar cuarteles de la Guardia Civil:', err);
    }

    // === POPUPS tácticos estilizados ===
    map.on('click', 'guardia_civil_layer', (e) => {
      const props = e.features[0].properties;

      const popupHTML = `
    <div class="popup-title">${props.nombre}</div>
    <div class="popup-meta">
      <span> ${props.localidad}</span><br>
      ${props.direccion ? `<span>${props.direccion}</span><br>` : ''}
      <span>${props.provincia}</span>
    </div>
    <div style="margin-top:0.6rem; display:flex; gap:6px;">
      <button class="btn green" onclick="alert('Enviar helicóptero a ${props.localidad}')">Enviar helicóptero</button>
      <button class="btn amber" onclick="alert('Marcar ${props.localidad} en alerta')">Alerta</button>
    </div>
  `;

      new maplibregl.Popup({
        offset: 18,
        closeButton: true,
        closeOnClick: true,
        className: 'popup-tactico'
      })
        .setLngLat(e.lngLat)
        .setHTML(popupHTML)
        .addTo(map);
    });

    // 🧭 Cambia el cursor al pasar sobre los iconos
    map.on('mouseenter', 'guardia_civil_layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'guardia_civil_layer', () => {
      map.getCanvas().style.cursor = '';
    });

    // 4️⃣ BIS+) Inicializar módulo de Guardia Civil con líneas a comandancias
    if (window.GuardiaCivilModule?.init) {
      await GuardiaCivilModule.init(map, './guadiaCivil4326.geojson');
    }


    // 5️⃣ Radar + detección
    setTimeout(() => {
      if (window.RadarModule?.init) RadarModule.init(map, 'bam');
      if (window.TacticoModule?.monitorDetection)
        TacticoModule.monitorDetection('bam', 'narcolancha');
    }, 1000);

    console.log('🟢 Misión 2 activada con flujo de intercepción');
  } catch (err) {
    console.error('❌ Error en startMision2:', err);
  }
}

map.on("render", () => {
  if (window.PulseModule?.update) PulseModule.update();
  if (window.GuardiaCivilModule?.updateConnections) GuardiaCivilModule.updateConnections();
});


// ————————————————————————————————
//  Botón de regreso
// ————————————————————————————————
const btnBack = document.getElementById('btn-back');
if (btnBack) {
  btnBack.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
}
