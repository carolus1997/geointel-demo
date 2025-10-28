// js/modules/tacticoModule.js
window.TacticoModule = (() => {
  const DETECTION_RADIUS_KM = 20;
  let map;
  let detectionTriggered = false;

  // === Inicializar módulo ===
  function setupPlayButton(mapInstance) {
    map = mapInstance;

    const btn = document.querySelector('.doc-card .play-btn');
    if (btn) btn.textContent = '▶️ Iniciar misión'; // cambia el debrief por botón play
  }

  // === Calcular distancia entre dos puntos (km) ===
  function getDistanceKm(a, b) {
    const aLng = a.lng ?? a[0];
    const aLat = a.lat ?? a[1];
    const bLng = b.lng ?? b[0];
    const bLat = b.lat ?? b[1];
    const R = 6371;
    const dLat = ((bLat - aLat) * Math.PI) / 180;
    const dLon = ((bLng - aLng) * Math.PI) / 180;
    const lat1 = (aLat * Math.PI) / 180;
    const lat2 = (bLat * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }



  // === Monitorizar distancia entre BAM y narcolancha ===
  function monitorDetection(bamId = 'bam', narcoId = 'narcolancha') {
    const bam = MovimientoModule.getMarker(bamId);
    const narco = MovimientoModule.getMarker(narcoId);
    if (!bam || !narco) return;

    const check = () => {
      const dist = getDistanceKm(bam.getLngLat(), narco.getLngLat());
      if (dist <= DETECTION_RADIUS_KM && !detectionTriggered) {
        console.log(`Contacto detectado a ${dist.toFixed(2)} km`);
        detectionTriggered = true;
        RadarModule.setAlertMode(true);
        triggerDetection(bam._map || map, narcoId);

      } else if (!detectionTriggered && dist < DETECTION_RADIUS_KM + 5) {
        console.log(`Distancia actual: ${dist.toFixed(2)} km`);
      }
      requestAnimationFrame(check);
    };

    check(); // 🟢 ← esto inicia el bucle de vigilancia
  }


  // === Efecto visual + respuesta táctica ===
  async function triggerDetection(mapInstance, targetId = 'narcolancha') {
    if (!window.MovimientoModule || !window.CoordUtils) {
      console.warn('Esperando a que los módulos estén listos...');
      setTimeout(() => triggerDetection(mapInstance, targetId), 500);
      return;
    }

    const targetMarker = MovimientoModule.getMarker(targetId);
    const bamMarker = MovimientoModule.getMarker('bam');
    if (!targetMarker || !bamMarker) {
      console.warn('TacticoModule.triggerDetection: marcadores no disponibles');
      return;
    }

    const targetPos = targetMarker.getLngLat();

    // Popup 5s
    const popup = new maplibregl.Popup({ offset: 25 })
      .setLngLat([targetPos.lng, targetPos.lat])
      .setHTML(`<strong>Contacto detectado</strong><br>Interceptando...`)
      .addTo(mapInstance);
    setTimeout(() => popup.remove(), 5000);

    console.log('Detección confirmada:', targetId);
    


    setTimeout(async () => {
      const heliSpeed = 70; // m/s
      const targetPosNow = MovimientoModule.getPosition(targetId);
      const bamPosNow = MovimientoModule.getPosition('bam'); // posición actual del BAM 👈

      if (!targetPosNow || !bamPosNow) {
        console.warn('❌ No se pudieron obtener posiciones actuales de BAM o narcolancha');
        return;
      }

      // Calcular intercepto
      const [vbx, vby] = MovimientoModule.getVelocity(targetId);
      const [hx, hy] = CoordUtils.lonLatToMerc(bamPosNow[0], bamPosNow[1]);
      const [bx, by] = CoordUtils.lonLatToMerc(targetPosNow[0], targetPosNow[1]);

      function interceptTimeEstimate() {
        const maxT = 3600;
        const dt = 0.5;
        for (let t = 0; t <= maxT; t += dt) {
          const bx_t = bx + vbx * t;
          const by_t = by + vby * t;
          const dx = bx_t - hx;
          const dy = by_t - hy;
          const dist = Math.hypot(dx, dy);
          if (heliSpeed * t >= dist) return t;
        }
        return null;
      }

      let interceptPointLonLat = targetPosNow;
      const tIntercept = interceptTimeEstimate();
      if (tIntercept !== null) {
        const bx_t = bx + vbx * tIntercept;
        const by_t = by + vby * tIntercept;
        interceptPointLonLat = CoordUtils.toLonLat(bx_t, by_t);
      }

      console.log('⏱ Tiempo interceptación ≈', tIntercept, 's, punto:', interceptPointLonLat);

      // 🚁 Aquí la corrección:
      // Usar deploy() para hacer despegar desde la posición actual del BAM
      HelicopterModule.deploy(interceptPointLonLat, {
        speed: 120,
        onArrival: () => {
          console.log('Helicóptero llegó al punto de intercepción, inicia persecución');
          HelicopterModule.followUnit('narcolancha', {
            heliSpeedMps: 120,
            leadSeconds: 6
          });

          if (window.GuardiaCivilModule?.notifyComandancias) {
            GuardiaCivilModule.notifyComandancias({
              message: 'Interceptación confirmada en el Estrecho',
              source: 'BAM',
              level: 'alerta'
            });
          }
        }
      });
    }, 3000);

  }

  return { setupPlayButton, monitorDetection, triggerDetection };

})();
