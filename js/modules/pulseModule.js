// ======================================================
// ⚡ PulseModule — animación fluida y sincronizada
// ======================================================
window.PulseModule = (() => {
    let map;
    const activeLinks = new Map();

    function init(_map) {
        map = _map;
        console.log("⚡ PulseModule (dinámico) inicializado");
    }

    // -------------------------------------------------------
    // 🔁 Crea un enlace animado entre dos posiciones dinámicas
    // -------------------------------------------------------
    function link(id, getFrom, getTo, options = {}) {
        if (!map) return console.warn("PulseModule: mapa no inicializado");
        removeLink(id);

        const color = options.color || "#FFD000";
        const width = options.width || 2;
        const frequency = options.frequency || 2; // pulsos/segundo
        const speed = options.speed || 0.6; // velocidad de desplazamiento del pulso (0–1)

        const srcId = `pulse-${id}`;
        map.addSource(srcId, {
            type: "geojson",
            lineMetrics: true,
            data: {
                type: "Feature",
                geometry: { type: "LineString", coordinates: [[0, 0], [0, 0]] }
            }
        });

        map.addLayer({
            id: srcId,
            type: "line",
            source: srcId,
            layout: {
                "line-cap": "round",
                "line-join": "round"
            },
            paint: {
                "line-width": width,
                "line-opacity": 0.9,
                "line-gradient": [
                    "interpolate", ["linear"], ["line-progress"],
                    0.0, "rgba(255,255,255,0)",
                    0.5, color,
                    1.0, "rgba(255,255,255,0)"
                ]
            }
        });

        const offsetPhase = Math.random(); // entre 0 y 1
        const linkState = { getFrom, getTo, srcId, color, frequency, speed, offsetPhase };

        activeLinks.set(id, linkState);
        animateLink(linkState);
    }

    // -------------------------------------------------------
    // 🔄 Animación continua, adaptando posición y frecuencia
    // -------------------------------------------------------
    function animateLink(link) {
        const { getFrom, getTo, srcId, color, frequency, speed, offsetPhase = 0 } = link;
        const src = map.getSource(srcId);
        if (!src) return;

        const from = getFrom?.();
        const to = getTo?.();
        if (!from || !to) return requestAnimationFrame(() => animateLink(link));

        // 🔹 Actualizar trayectoria en tiempo real
        src.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: [from, to] }
        });

        // 🔹 Calcular desplazamiento del pulso
        const t = (performance.now() / 1000) * frequency + offsetPhase;
        const phase = Math.abs((t % 2) - 1); // va 0→1→0→1
        const w = 0.06; // ancho del pulso

        // ✅ Garantizar valores dentro de 0–1 y en orden ascendente
        let start = phase - w;
        let mid = phase;
        let end = phase + w;

        if (start < 0) start = 0;
        if (end > 1) end = 1;

        // 🔹 Aplicar gradiente seguro
        try {
            map.setPaintProperty(srcId, "line-gradient", [
                "interpolate", ["linear"], ["line-progress"],
                start, "rgba(255,255,255,0)",
                mid, color,
                end, "rgba(255,255,255,0)"
            ]);
        } catch (err) {
            /* capa aún no lista o validación temporal */
        }

        requestAnimationFrame(() => animateLink(link));

    }

    // -------------------------------------------------------
    function removeLink(id) {
        const link = activeLinks.get(id);
        if (!link || !map) return;
        const { srcId } = link;
        if (map.getLayer(srcId)) map.removeLayer(srcId);
        if (map.getSource(srcId)) map.removeSource(srcId);
        activeLinks.delete(id);
    }

    // -------------------------------------------------------
    return { init, link, removeLink };
})();
