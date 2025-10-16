// js/modules/helicopterModule.js
window.HelicopterModule = (() => {
  let map;
  let heliMarker = null;
  let heliIdDefault = 'helicoptero';
  let animFrame = null;
  let followFrame = null;
  let linkFrame = null;
  let pathCoords = [];
  const pathSourceId = 'heli-path';
  const linkSourceId = 'heli-link';
  let patrolFrame = null; // 🌀 animación circular (patrulla)
  const radarSourceId = 'heli-radar';
  let radarPulse = 0; // fase de animación del pulso


  // === INIT ===
  function init(mapInstance, heliId = heliIdDefault) {
    map = mapInstance;

    setTimeout(() => {
      heliMarker = MovimientoModule.getMarker(heliId);
      if (!heliMarker) {
        console.warn('⚠️ HelicopterModule.init: marcador no encontrado.');
        return;
      }

      const el = heliMarker.getElement();
      // Ocultar al inicio
      el.style.display = 'none';
      el.style.opacity = '0';
      el.style.transition = 'opacity 600ms ease, transform 400ms ease';

      // Crear rastro
      if (!map.getSource(pathSourceId)) {
        map.addSource(pathSourceId, {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        });
        map.addLayer({
          id: pathSourceId,
          type: 'line',
          source: pathSourceId,
          paint: {
            'line-color': '#00E5FF',
            'line-width': 2,
            'line-opacity': 0.7
          }
        });
      }

      // Crear enlace táctico BAM↔Heli
      if (!map.getSource(linkSourceId)) {
        map.addSource(linkSourceId, {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        });
        map.addLayer({
          id: linkSourceId,
          type: 'line',
          source: linkSourceId,
          paint: {
            'line-color': '#00E5FF',
            'line-width': 2,
            'line-opacity': 0.6,
            'line-dasharray': [1, 2]
          }
        });
      }

      // 🔹 Reposicionar helicóptero sobre el BAM antes del despegue
      const bamMarker = MovimientoModule.getMarker('bam');
      if (bamMarker) {
        const bamPos = bamMarker.getLngLat();
        heliMarker.setLngLat([bamPos.lng, bamPos.lat]);
        console.log(`🚁 Helicóptero posicionado sobre BAM (${bamPos.lng.toFixed(4)}, ${bamPos.lat.toFixed(4)})`);
      }

      console.log('🚁 Helicóptero preparado (oculto).');
    }, 500);
  }


  // === DEPLOY: despegar desde BAM hacia target ===
  function deploy(targetLngLat, options = {}) {
    if (!map) return console.warn('HelicopterModule: map no inicializado.');
    if (!heliMarker) heliMarker = MovimientoModule.getMarker(options.heliId || heliIdDefault);
    if (!heliMarker) return console.warn('HelicopterModule.deploy: marcador no disponible.');

    const bamMarker = MovimientoModule.getMarker('bam');
    if (!bamMarker) return console.warn('HelicopterModule: BAM no encontrado.');

    // 🚁 Posición inicial = posición actual del BAM
    const start = bamMarker.getLngLat();
    heliMarker.setLngLat([start.lng, start.lat]);
    console.log(`🚁 Despegando desde BAM en ${start.lng.toFixed(4)}, ${start.lat.toFixed(4)}`);

    // Mostrar helicóptero
    const el = heliMarker.getElement();
    el.style.display = 'block';
    requestAnimationFrame(() => (el.style.opacity = '1'));

    // Iniciar enlace visual BAM↔Heli
    startLinkLine();

    // --- Normalizar el target ---
    const target = Array.isArray(targetLngLat)
      ? targetLngLat
      : [targetLngLat.lng, targetLngLat.lat];

    console.log(`🎯 Objetivo del helicóptero: ${target[0].toFixed(4)}, ${target[1].toFixed(4)}`);

    // Animar hacia el punto de intercepción
    goToPoint([start.lng, start.lat], target, options.speed || 120, () => {
      console.log('✅ Helicóptero llegó al punto inicial de intercepción');
    }, 'narcolancha'); // 👈 añadimos targetId como último parámetro

  }


  // === goToPoint: vuelo dinámico con radar independiente ===
  function goToPoint(startLngLat, targetLngLat, speed = 120, onArrival, targetId = 'narcolancha') {
    if (animFrame) cancelAnimationFrame(animFrame);

    // Normalizar coordenadas de entrada
    const start = Array.isArray(startLngLat)
      ? startLngLat
      : [startLngLat.lng, startLngLat.lat];

    let currentPos = [...start]; // posición dinámica del helicóptero
    const correctionRate = 0.05; // suavizado direccional
    const approachThresholdKm = 2; // cambio a seguimiento directo

    console.log(`✈️ goToPoint iniciado desde ${start} hacia ${targetLngLat} (velocidad: ${speed} m/s)`);

    function step() {
      if (window.SIMULATION_PAUSED) return requestAnimationFrame(step);

      // Obtener posición actualizada del objetivo (narcolancha)
      const targetPos = MovimientoModule.getPosition(targetId) || targetLngLat;
      const [tx, ty] = window.CoordUtils.lonLatToMerc(targetPos[0], targetPos[1]);
      const [hx, hy] = window.CoordUtils.lonLatToMerc(currentPos[0], currentPos[1]);

      const dx = tx - hx;
      const dy = ty - hy;
      const distMeters = Math.hypot(dx, dy);
      const distKm = distMeters / 1000;

      // Si ya está lo suficientemente cerca → cambiar a seguimiento directo
      if (distKm < approachThresholdKm) {
        console.log(`🎯 Interceptación lograda (distancia ${distKm.toFixed(2)} km). Cambiando a followUnit()`);
        if (onArrival) onArrival();
        HelicopterModule.followUnit(targetId, { heliSpeedMps: speed, leadSeconds: 5 });
        return;
      }

      // Calcular desplazamiento por frame
      const simSpeed = window.SIMULATION_SPEED || 1;
      const heliSpeed = speed * simSpeed;
      const stepMeters = heliSpeed * (1 / 60);
      const fraction = Math.min(1, stepMeters / distMeters);

      // Suavizado direccional
      const nextX = hx + dx * fraction * (1 - correctionRate);
      const nextY = hy + dy * fraction * (1 - correctionRate);
      const [lon, lat] = window.CoordUtils.toLonLat(nextX, nextY);

      // Actualizar posición y trayectorias
      currentPos = [lon, lat];
      heliMarker.setLngLat(currentPos);
      updatePath(currentPos);
      updateLink();

      // 🔹 Notificar radar del helicóptero (sin redibujar directamente)
      if (window.HelicopterRadar?.update) {
        HelicopterRadar.update(currentPos);
      }

      animFrame = requestAnimationFrame(step);
    }

    step();
  }


  // === FOLLOW UNIT: seguir dinámicamente a otra unidad (predictivo, usando velocidad) ===
  function followUnit(targetId, opts = {}) {
    if (followFrame) cancelAnimationFrame(followFrame);

    const heliBaseSpeed = opts.heliSpeedMps || 70;  // velocidad base (m/s)
    const leadSeconds = opts.leadSeconds || 12;     // adelantamiento del objetivo
    const smoothFactor = (opts.smoothFactor !== undefined) ? opts.smoothFactor : 1.0;

    const targetMarker = MovimientoModule.getMarker(targetId);
    if (!targetMarker) return console.warn('HelicopterModule.followUnit: target no encontrado.');

    // Asegurarse de que la línea de enlace está activa
    startLinkLine();

    function step() {
      if (window.SIMULATION_PAUSED) return requestAnimationFrame(step);

      const targetPos = MovimientoModule.getPosition(targetId);
      const targetVel = MovimientoModule.getVelocity(targetId);

      if (!targetPos) {
        followFrame = requestAnimationFrame(step);
        return;
      }

      // Conversión a Mercator
      const [tx, ty] = window.CoordUtils.lonLatToMerc(targetPos[0], targetPos[1]);
      const vx = (targetVel && targetVel[0]) ? targetVel[0] : 0;
      const vy = (targetVel && targetVel[1]) ? targetVel[1] : 0;

      // Calcular punto adelantado
      const leadX = tx + vx * leadSeconds;
      const leadY = ty + vy * leadSeconds;

      // Posición actual del helicóptero
      const heliLngLat = heliMarker.getLngLat();
      const [hx, hy] = window.CoordUtils.lonLatToMerc(heliLngLat.lng, heliLngLat.lat);

      // Vector hacia el punto adelantado
      const dx = leadX - hx;
      const dy = leadY - hy;
      const dist = Math.hypot(dx, dy) || 1e-6;

      // === 🔧 APLICAR SIMULATION SPEED AQUÍ ===
      const simSpeed = window.SIMULATION_SPEED || 1;
      const heliSpeed = heliBaseSpeed * simSpeed; // escala con el panel
      const stepMeters = heliSpeed * (1 / 60) * smoothFactor;
      const fraction = Math.min(1, stepMeters / dist);

      const nextX = hx + dx * fraction;
      const nextY = hy + dy * fraction;

      const [nextLon, nextLat] = window.CoordUtils.toLonLat(nextX, nextY);
      heliMarker.setLngLat([nextLon, nextLat]);

      updatePath([nextLon, nextLat]);
      updateLink();

      followFrame = requestAnimationFrame(step);
    }

    step();
  }




  // === updatePath: traza la línea de vuelo ===
  function updatePath(coord) {
    pathCoords.push(coord);
    if (pathCoords.length > 500) pathCoords.shift();
    const src = map.getSource(pathSourceId);
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: pathCoords }
      });
    }
  }

  // === Enlace táctico BAM ↔ Heli ===
  function startLinkLine() {
    if (map.getSource(linkSourceId)) return; // ya existe

    map.addSource(linkSourceId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
    });

    map.addLayer({
      id: linkSourceId,
      type: 'line',
      source: linkSourceId,
      paint: {
        'line-color': '#00E5FF',
        'line-width': 2,
        'line-dasharray': [2, 4],
        'line-opacity': 0.8
      }
    });
  }


  function updateLink() {
    const bamMarker = MovimientoModule.getMarker('bam');
    if (!bamMarker || !heliMarker) return;

    const bamPos = bamMarker.getLngLat();
    const heliPos = heliMarker.getLngLat();

    const src = map.getSource(linkSourceId);
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [bamPos.lng, bamPos.lat],
            [heliPos.lng, heliPos.lat]
          ]
        }
      });
    }

    // ⚠️ Evitar crash si la capa o sus propiedades aún no existen
    const layer = map.getLayer(linkSourceId);
    if (!layer) return; // aún no se añadió

    try {
      const dash = map.getPaintProperty(linkSourceId, 'line-dasharray');
      if (Array.isArray(dash)) {
        const shift = (performance.now() / 100) % dash.length;
        map.setPaintProperty(linkSourceId, 'line-dashoffset', shift);
      }
    } catch (err) {
      // Evita que el error de propiedades rompa la animación general
      //console.warn('updateLink skip (layer not fully ready)', err);
    }
  }

  // === stop: limpia animaciones ===
  function stop() {
    cancelAnimationFrame(animFrame);
    cancelAnimationFrame(followFrame);
    cancelAnimationFrame(linkFrame);
    const el = heliMarker.getElement();
    el.style.opacity = '0';
    setTimeout(() => (el.style.display = 'none'), 600);
    if (map.getLayer(radarSourceId)) {
      map.removeLayer(radarSourceId);
      map.removeSource(radarSourceId);
    }

  }

  // === startPatrolAround: patrullaje circular lento y amplio ===
  function startPatrolAround(centerLngLat, opts = {}) {
    if (!heliMarker) return;
    stopPatrol(); // detener patrullas anteriores

    const radius = opts.radius || 0.01;   // radio mayor (~1 km)
    const speed = opts.speed || 0.002;     // velocidad angular
    const center = centerLngLat;
    let angle = 0;

    function loop() {
      angle += speed;
      const lng = center[0] + radius * Math.cos(angle);
      const lat = center[1] + radius * Math.sin(angle);
      heliMarker.setLngLat([lng, lat]);
      updatePath([lng, lat]);
      updateLink();
      patrolFrame = requestAnimationFrame(loop);
    }

    patrolFrame = requestAnimationFrame(loop);
    console.log("🔄 Patrullando alrededor de", center);
  }

  function stopPatrol() {
    if (patrolFrame) cancelAnimationFrame(patrolFrame);
    patrolFrame = null;
  }

  // === Exportar módulo completo ===
  return {
    init,
    deploy,
    goToPoint,
    followUnit,
    startPatrolAround,
    stop
  };


  // === drawRadarCircle: crea o actualiza el radar visual del helicóptero ===
  function drawRadarCircle(center, radiusKm = 3) {
    if (!map) return;

    const radiusMeters = radiusKm * 1000;

    // Construir círculo aproximado (64 lados)
    const coords = [];
    const numSides = 64;
    for (let i = 0; i <= numSides; i++) {
      const angle = (i / numSides) * 2 * Math.PI;
      const dx = radiusMeters * Math.cos(angle);
      const dy = radiusMeters * Math.sin(angle);
      const [lon, lat] = window.CoordUtils.toLonLat(
        ...window.CoordUtils.lonLatToMerc(center[0], center[1]).map((v, j) =>
          j === 0 ? v + dx : v + dy
        )
      );
      coords.push([lon, lat]);
    }

    const feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] }
    };

    if (!map.getSource(radarSourceId)) {
      map.addSource(radarSourceId, { type: 'geojson', data: feature });
      map.addLayer({
        id: radarSourceId,
        type: 'fill',
        source: radarSourceId,
        paint: {
          'fill-color': '#00E5FF',
          'fill-opacity': 0.15
        }
      });
    } else {
      const src = map.getSource(radarSourceId);
      if (src) src.setData(feature);
    }
  }

  // === animateRadarPulse: hace que el radar "respire" visualmente ===
  function animateRadarPulse(center) {
    if (!map.getLayer(radarSourceId)) return;

    radarPulse += 0.05;
    const opacity = 0.15 + 0.05 * Math.sin(radarPulse);
    map.setPaintProperty(radarSourceId, 'fill-opacity', opacity);

    drawRadarCircle(center, 3); // mantener actualizado el centro
    requestAnimationFrame(() => animateRadarPulse(center));
  }


})();
