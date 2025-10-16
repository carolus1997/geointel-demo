// js/utils.js

// Clave pública MapTiler
window.MAPTILER_KEY = 'rk78lPIZURCYo6I9QQdi';

// Delay genérico
window.delay = function (ms) {
  return new Promise(res => setTimeout(res, ms));
};

// Obtiene la ruta base según entorno (GitHub Pages o local)
window.getBasePath = function () {
  const pathParts = window.location.pathname.split('/');
  const isGitHub = window.location.hostname.includes('github.io');
  if (isGitHub) {
    const repoName = pathParts[1];
    return `/${repoName}/`;
  }
  return '/';
};

// Construye URL hacia una misión
window.getMisionURL = function (relativePath) {
  const base = window.getBasePath();
  let cleanPath = relativePath.replace(/^(\.\/|\.\.\/)+/, '');
  if (!cleanPath.startsWith('misiones/')) cleanPath = 'misiones/' + cleanPath;
  const fileMatch = cleanPath.match(/(mision\d+)\.html$/i);
  if (fileMatch) {
    const folderName = fileMatch[1];
    if (!cleanPath.includes(`/${folderName}/`))
      cleanPath = cleanPath.replace(`${folderName}.html`, `${folderName}/${folderName}.html`);
  }
  return `${base}${cleanPath}`.replace(/([^:]\/)\/+/g, '$1');
};

// ================================
// CONVERSIONES DE COORDENADAS
// EPSG:3857 <-> EPSG:4326
// ================================
window.CoordUtils = {
  toLonLat(x, y) {
    const lon = (x / 20037508.34) * 180;
    const latTmp = (y / 20037508.34) * 180;
    const lat =
      (180 / Math.PI) *
      (2 * Math.atan(Math.exp((latTmp * Math.PI) / 180)) - Math.PI / 2);
    return [lon, lat];
  },
  lonLatToMerc(lon, lat) {
    const x = (lon * 20037508.34) / 180;
    let y =
      Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    y = (y * 20037508.34) / 180;
    return [x, y];
  },
};
