export function addSatellite(map) {
  const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';
  map.addSource('satellite', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

  const firstLayerId = map.getStyle().layers[0].id;

  map.addLayer(
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      paint: { 'raster-opacity': 0.55 }
    },
    firstLayerId
  );
}
