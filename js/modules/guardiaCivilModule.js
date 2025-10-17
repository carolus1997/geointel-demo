// ==========================
// GuardiaCivilModule.js
// ==========================

window.GuardiaCivilModule = (() => {

  // === Cargar y mostrar cuarteles ===
  async function init(map, geojsonPath = '../../data/guadiaCivil.geojson', svgPath = '../../img/icons/icon_guardia_civil.svg') {
    try {
      console.log('🟩 Iniciando módulo Guardia Civil...');

      const res = await fetch(geojsonPath);
      const data = await res.json();

      if (!data.features || !Array.isArray(data.features)) {
        console.warn('⚠️ GeoJSON inválido o sin features');
        return;
      }

      // 1️⃣ Convertir SVG a imagen válida (MapLibre no soporta SVG directamente)
      const img = await convertSvgToPng(svgPath, 64, 64);
      if (!map.hasImage('icon_guardia_civil')) {
        map.addImage('icon_guardia_civil', img);
      }

      // 2️⃣ Crear fuente y capa
      if (!map.getSource('cuarteles_gc')) {
        map.addSource('cuarteles_gc', { type: 'geojson', data });
      }

      if (!map.getLayer('cuarteles_gc_layer')) {
        map.addLayer({
          id: 'cuarteles_gc_layer',
          type: 'symbol',
          source: 'cuarteles_gc',
          layout: {
            'icon-image': 'icon_guardia_civil',
            'icon-size': 0.45,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });
      }

      console.log(`✅ ${data.features.length} cuarteles de la Guardia Civil desplegados`);
    } catch (err) {
      console.error('❌ Error en GuardiaCivilModule.init:', err);
    }
  }

  // === Conversión SVG → PNG en memoria ===
  async function convertSvgToPng(svgPath, width = 64, height = 64) {
    const svgText = await fetch(svgPath).then(r => r.text());
    return new Promise((resolve) => {
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        const pngImg = new Image();
        pngImg.onload = () => resolve(pngImg);
        pngImg.src = canvas.toDataURL('image/png');
      };
      image.src = url;
    });
  }

  return { init };

})();
