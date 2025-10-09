export function createBaseMap(containerId, center, zoom) {
  const MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

  const map = new maplibregl.Map({
    container: containerId,
    style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
    center: center,
    zoom: zoom,
    pitch: 0,
    bearing: 0,
    attributionControl: false
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

  return map;
}