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

  // === LOG TÁCTICO ===
  const logPanel = document.getElementById('log-tactico-panel');
  const btnPlay = document.getElementById('btn-play');

  let missionStarted = false;
  let logIndex = 0;
  let logSequence = [
    { type: 'system', text: 'Misión iniciada. Sistema de radar operativo.' },
    { type: 'intel', text: 'Unidad BAM “Rayo” detecta eco sospechoso al N de Tánger.' },
    { type: 'alert', text: 'Posible narcolancha detectada. Velocidad estimada 45 nudos.' },
    { type: 'action', text: 'Helicóptero de la Guardia Civil desplegado para interceptar.' },
    { type: 'success', text: 'Objetivo neutralizado. Cargamento asegurado.' },
    { type: 'system', text: 'Fin de misión. Generando informe automático.' }
  ];

  // Añadir log con timestamp
  function addLog(type, text) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
    entry.innerHTML = `${text} <span class="log-entry time">${time}</span>`;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight; // autoscroll
  }

  // Reproducir logs con intervalo
  function startMissionLogs() {
    if (missionStarted) return;
    missionStarted = true;
    addLog('system', '🟢 Iniciando recopilación de eventos tácticos...');
    const interval = setInterval(() => {
      if (logIndex >= logSequence.length) {
        clearInterval(interval);
        addLog('system', '📄 Informe de misión listo para descarga.');
        return;
      }
      const { type, text } = logSequence[logIndex];
      addLog(type, text);
      logIndex++;
    }, 2500);
  }

  btnPlay.addEventListener('click', startMissionLogs);


  return { init, generarHeatmap, crearBuffer, perfilTopografico, exportarAnalisis };
})();
