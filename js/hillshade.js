export function addHillshade(map) {
  const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';
  map.addSource('hillshade', {
    type: 'raster',
    tiles: [
      `https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
    ],
    tileSize: 256,
    attribution: '&copy; MapTiler'
  });

  const firstLayerId = map.getStyle().layers[0].id;

  map.addLayer(
    {
      id: 'hillshade-layer',
      type: 'raster',
      source: 'hillshade',
      paint: {
        'raster-opacity': 0.35,
        'raster-brightness-min': 0.8,
        'raster-brightness-max': 1.1
      }
    },
    firstLayerId
  );
}

