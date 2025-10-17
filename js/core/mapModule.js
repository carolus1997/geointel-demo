// js/core/mapModule.js
// Compatible con entorno global (window)

(function () {
  const MAPTILER_KEY = window.MAPTILER_KEY;
  const Logger = window.Logger || console;

  window.initMap = async function () {
    return new Promise((resolve) => {
      const map = new maplibregl.Map({
        container: 'map',
        style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
        center: [-3.7038, 40.4168],
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        addRasterLayers(map);
        setupBasemapToggles(map);
      });

      map.once('idle', () => {
        document.getElementById('map').classList.add('ready');
        Logger.map?.("Mapa operativo y renderizado.");
        resolve(map);
      });
    });
  };

  function addRasterLayers(map) {
    map.addSource('hillshade', {
      type: 'raster',
      tiles: [`https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`],
      tileSize: 256,
    });

    map.addLayer({
      id: 'hillshade-layer',
      type: 'raster',
      source: 'hillshade',
      paint: { 'raster-opacity': 0.35 },
      layout: { visibility: 'none' },
    });

    map.addSource('satellite', {
      type: 'raster',
      tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`],
      tileSize: 256,
    });

    map.addLayer({
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      layout: { visibility: 'none' },
    });
  }

  function setupBasemapToggles(map) {
    const reliefBtn = document.getElementById('toggle-hillshade');
    const satBtn = document.getElementById('toggle-sat');
    reliefBtn.addEventListener('click', () => toggleLayer(map, 'hillshade-layer', reliefBtn, satBtn));
    satBtn.addEventListener('click', () => toggleLayer(map, 'satellite-layer', satBtn, reliefBtn));
  }

  function toggleLayer(map, layerId, btnOn, btnOff) {
    const isVisible = map.getLayoutProperty(layerId, 'visibility') === 'visible';
    map.setLayoutProperty(layerId, 'visibility', isVisible ? 'none' : 'visible');
    btnOn.classList.toggle('active', !isVisible);
    btnOff.classList.remove('active');
  }
})();
