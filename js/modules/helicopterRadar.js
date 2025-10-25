// === helicopterRadar.js ===
window.HelicopterRadar = (() => {
  let map;
  const radarId = 'heli-radar';
  let lastUpdate = 0;
  const UPDATE_INTERVAL = 250; // ms
  const RADIUS_KM = 3;

  function init(mapInstance) {
    map = mapInstance;

    if (!map.getSource(radarId)) {
      map.addSource(radarId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: radarId,
        type: 'circle',
        source: radarId,
        paint: {
          'circle-radius': 0,
          'circle-color': '#0095FF',
          'circle-opacity': 0.25
        }
      });
    }

    map.on("move", () => {
      const src = map.getSource(radarId);
      if (src && HelicopterModule?.getPosition) {
        const pos = MovimientoModule.getPosition("helicoptero");
        if (pos) update(pos);
      }
    });

  }

  // 🔄 Actualiza posición y animación (cada ~250ms)
  function update(lngLat) {
    const now = performance.now();
    if (!map || now - lastUpdate < UPDATE_INTERVAL) return;
    lastUpdate = now;

    const radiusMeters = RADIUS_KM * 1000;
    const circle = turf.circle(lngLat, radiusMeters / 1000, { steps: 64, units: 'kilometers' });

    const src = map.getSource(radarId);
    if (src) src.setData(circle);

    // Animación pulsante (solo radio, sin re-render de tiles)
    const layer = map.getLayer(radarId);
    if (layer) {
      const pulse = 0.2 + 0.1 * Math.sin(performance.now() / 500);
      map.setPaintProperty(radarId, 'circle-opacity', 0.25 + pulse);
    }
  }

  return { init, update };
})();
