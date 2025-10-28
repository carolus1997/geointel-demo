// mision2_tools.js
window.Mission2Tools = (() => {
  let map;

  function init(mapInstance) {
    map = mapInstance;
  }

  function generarHeatmap() {
    if (map.getLayer('heatmap-layer')) {
      map.removeLayer('heatmap-layer');
      map.removeSource('heatmap');
    }
    map.addSource('heatmap', {
      type: 'geojson',
      data: 'data/cambios_opticos.geojson'
    });
    map.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'heatmap',
      paint: {
        'heatmap-intensity': 0.8,
        'heatmap-radius': 30,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.3, '#00E5FF',
          0.6, '#FF6B00',
          1, '#FF0000'
        ]
      }
    });
  }

  function crearBuffer(dist = 1000) {
    alert(`🧭 Creando buffer de ${dist} m alrededor de sensores`);
    // Ejemplo visual — marcador circular alrededor de puntos sensores
    // En una versión avanzada, podría calcular buffers reales con turf.js
  }

  function perfilTopografico() {
    alert('📈 Herramienta de perfil topográfico (en desarrollo)');
    // Futuro: integración con raster o servicio de elevación
  }

  function exportarAnalisis() {
    alert('🗂️ Exportando resultados...');
    // Aquí podría serializar datos o exportar a GeoJSON/PNG
  }

  


  return { init, generarHeatmap, crearBuffer, perfilTopografico, exportarAnalisis };
})();
