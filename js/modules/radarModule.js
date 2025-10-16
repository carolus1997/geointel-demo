// js/modules/radarModule.js
window.RadarModule = (() => {
  let map, bamMarker;
  const RADIUS_KM = 20;
  const radarId = 'radar-range';
  const sweepId = 'radar-sweep';
  let angle = 0;
  let alertMode = false; // cambia color si hay detección activa

  // === CÍRCULO GEOGRÁFICO ===
  function createCircle(lon, lat, radiusKm, points = 128) {
    const coords = [];
    const R = 6371;
    const d = radiusKm / R;
    for (let i = 0; i <= points; i++) {
      const brng = (i / points) * 2 * Math.PI;
      const φ1 = (lat * Math.PI) / 180;
      const λ1 = (lon * Math.PI) / 180;
      const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(d) +
        Math.cos(φ1) * Math.sin(d) * Math.cos(brng)
      );
      const λ2 = λ1 + Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(φ1),
        Math.cos(d) - Math.sin(φ1) * Math.sin(φ2)
      );
      coords.push([(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI]);
    }
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] }
    };
  }

  // === SECTOR GEOGRÁFICO (BARRIDO) ===
  function createSector(lon, lat, radiusKm, startDeg, endDeg, points = 64) {
    const coords = [[lon, lat]];
    const R = 6371;
    const d = radiusKm / R;
    for (let i = 0; i <= points; i++) {
      const brng = ((startDeg + ((endDeg - startDeg) * i) / points) * Math.PI) / 180;
      const φ1 = (lat * Math.PI) / 180;
      const λ1 = (lon * Math.PI) / 180;
      const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(d) +
        Math.cos(φ1) * Math.sin(d) * Math.cos(brng)
      );
      const λ2 = λ1 + Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(φ1),
        Math.cos(d) - Math.sin(φ1) * Math.sin(φ2)
      );
      coords.push([(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI]);
    }
    coords.push([lon, lat]);
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] }
    };
  }

  // === INICIALIZAR RADAR ===
  function init(mapInstance, bamId = 'bam') {
    map = mapInstance;
    bamMarker = MovimientoModule.getMarker(bamId);
    if (!bamMarker) return console.warn('⚠️ RadarModule.init: BAM no encontrado.');

    // 🧹 LIMPIEZA SEGURA
    if (map.getLayer(radarId)) map.removeLayer(radarId);
    if (map.getSource(radarId)) map.removeSource(radarId);
    if (map.getLayer(sweepId)) map.removeLayer(sweepId);
    if (map.getSource(sweepId)) map.removeSource(sweepId);

    const center = bamMarker.getLngLat();
    const circle = createCircle(center.lng, center.lat, RADIUS_KM);
    const sector = createSector(center.lng, center.lat, RADIUS_KM, 0, 45);

    // === CAPA PRINCIPAL DEL RADAR ===
    map.addSource(radarId, { type: 'geojson', data: circle });
    map.addLayer({
      id: radarId,
      type: 'fill',
      source: radarId,
      paint: {
        'fill-color': 'rgba(0, 229, 255, 0.08)',
        'fill-outline-color': 'rgba(0, 229, 255, 0.35)'
      }
    });

    // === CAPA DEL BARRIDO ===
    map.addSource(sweepId, { type: 'geojson', data: sector });
    map.addLayer({
      id: sweepId,
      type: 'fill',
      source: sweepId,
      paint: {
        'fill-color': 'rgba(0, 229, 255, 0.25)',
        'fill-outline-color': 'rgba(0, 229, 255, 0)'
      }
    });

    animate();
    console.log('📡 Radar operativo');
  }

  // === ANIMACIÓN CONTINUA ===
  function animate() {
    if (!map || !bamMarker) return;

    const pos = bamMarker.getLngLat();

    // Actualizar el círculo (mantener centrado)
    const circle = createCircle(pos.lng, pos.lat, RADIUS_KM);
    const srcCircle = map.getSource(radarId);
    if (srcCircle) srcCircle.setData(circle);

    // Actualizar el barrido (rotación)
    angle = (angle + 1) % 360;
    const sweep = createSector(pos.lng, pos.lat, RADIUS_KM, angle, angle + 45);
    const srcSweep = map.getSource(sweepId);
    if (srcSweep) srcSweep.setData(sweep);

    requestAnimationFrame(animate);
  }

  // === CAMBIAR COLOR EN ALERTA ===
  function setAlertMode(active = true) {
    alertMode = active;
    if (!map || !map.getLayer(radarId)) return;

    const colorMain = active
      ? 'rgba(255, 60, 60, 0.1)'   // rojo suave
      : 'rgba(0, 229, 255, 0.08)'; // azul por defecto
    const outlineMain = active
      ? 'rgba(255, 80, 80, 0.4)'
      : 'rgba(0, 229, 255, 0.35)';
    const sweepColor = active
      ? 'rgba(255, 60, 60, 0.3)'
      : 'rgba(0, 229, 255, 0.25)';

    map.setPaintProperty(radarId, 'fill-color', colorMain);
    map.setPaintProperty(radarId, 'fill-outline-color', outlineMain);
    map.setPaintProperty(sweepId, 'fill-color', sweepColor);
  }

  return { init, setAlertMode };
})();
