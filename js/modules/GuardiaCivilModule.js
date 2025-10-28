// ======================================================
//  🟩 GuardiaCivilModule — conexiones y propagación GC
// ======================================================
window.GuardiaCivilModule = (() => {
    let map;
    let connectionsLayerId = "gc_connections_line";
    let connectionSourceId = "gc_connections";
    let connectionColor = "#007a50"; // verde discreto
    let gcComandancias = [];
    let gcData = null; // 👈 guardamos el GeoJSON completo para reutilizar

    // ================================
    async function init(_map, geojsonPath = './guadiaCivil4326.geojson') {
        map = _map;
        console.log("🟢 GuardiaCivilModule iniciado");

        const res = await fetch(geojsonPath);
        const data = await res.json();
        gcData = data;
        map._gcData = data;

        addGuardiaCivilLayer(map, data);

        const comandancias = data.features.filter(f =>
            (f.properties?.nombre || "").toLowerCase().includes("comandancia")
        );
        gcComandancias = comandancias;
        map._gcComandancias = comandancias;

        if (!comandancias.length) {
            console.warn("⚠️ No se encontraron comandancias en el GeoJSON");
            return;
        }

        if (!map.getSource(connectionSourceId)) {
            map.addSource(connectionSourceId, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] }
            });
        }
        if (!map.getLayer(connectionsLayerId)) {
            map.addLayer({
                id: connectionsLayerId,
                type: "line",
                source: connectionSourceId,
                paint: {
                    "line-color": connectionColor,
                    "line-width": 1.8,
                    "line-opacity": 0.55,
                    "line-dasharray": [3, 3],
                    "line-blur": 0.5
                }
            });
        }

        updateConnections(comandancias);

        if (window.MovimientoModule?.onUnitMove) {
            MovimientoModule.onUnitMove("bam", (lngLat) => {
                updateConnections(comandancias, lngLat);
            });
        } else {
            console.warn("⚠️ MovimientoModule.onUnitMove no disponible — conexiones estáticas");
        }

        // ✅ Disparar evento solo ahora
        console.log("🟢 Evento GC_READY disparado — comandancias disponibles:", gcComandancias.length);
        window.GuardiaCivilModule._gcComandancias = gcComandancias;
        window.dispatchEvent(new Event("GC_READY"));
    }

    // ================================
    function addGuardiaCivilLayer(map, data) {
        // Icono base para símbolo
        if (!map.hasImage('icon_guardia_civil')) {
            const image = new Image();
            image.src = '../../img/icons/icon_guardia_civil.png';
            image.onload = () => map.addImage('icon_guardia_civil', image);
        }

        // Marcadores individuales para COMANDANCIAS (con halo)
        data.features.forEach(f => {
            const nombre = (f.properties?.nombre || "").toLowerCase();
            const coords = f.geometry?.coordinates?.[0];
            if (!coords) return;

            if (nombre.includes("comandancia")) {
                const el = document.createElement("img");
                el.src = "../../img/icons/icon_guardia_civil.png";
                el.className = "gc-glow"; // 💚 halo discreto
                el.style.width = "26px";
                el.style.height = "21px";
                el.alt = f.properties?.nombre || 'Comandancia';

                new maplibregl.Marker({ element: el, anchor: "center" })
                    .setLngLat(coords)
                    .addTo(map);
            }
        });

        // Fuente/capa general de cuarteles (símbolo plano)
        if (!map.getSource('guardia_civil'))
            map.addSource('guardia_civil', { type: 'geojson', data });
        console.log(`✅ GuardiaCivilModule listo con ${data.features.length} unidades`);



        if (!map.getLayer('guardia_civil_layer')) {
            map.addLayer({
                id: 'guardia_civil_layer',
                type: 'symbol',
                source: 'guardia_civil',
                layout: {
                    'icon-image': 'icon_guardia_civil',
                    'icon-size': 80,
                    'icon-allow-overlap': true
                }
            });
        }
    }

    // ================================
    function updateConnections(coms = null, bamPosition = null) {
        if (!map) return;

        const comandancias = (Array.isArray(coms) && coms.length) ? coms : gcComandancias;
        if (!comandancias || !comandancias.length) return;

        // Obtener posición actual del BAM
        if (!bamPosition && window.MovimientoModule?.getPosition) {
            const pos = MovimientoModule.getPosition("bam");
            if (pos) bamPosition = { lng: pos[0], lat: pos[1] };
        }
        if (!bamPosition) {
            console.warn("⚠️ No se puede obtener posición del BAM, se omite actualización");
            return;
        }

        const features = comandancias.map(cmd => ({
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [
                    [bamPosition.lng, bamPosition.lat],
                    cmd.geometry.coordinates[0]
                ]
            },
            properties: { name: cmd.properties.nombre }
        }));

        const source = map.getSource(connectionSourceId);
        if (!source) return;

        source.setData({ type: "FeatureCollection", features });
    }


    // ================================
    // 🔔 Notificar a las comandancias
    function notifyComandancias({ message = "Interceptación confirmada", source = "Helicóptero", level = "alerta" } = {}) {
        if (!map || !gcComandancias.length) return;

        gcComandancias.forEach(cmd => {
            const coords = cmd.geometry?.coordinates?.[0];
            if (!coords) return;

            const html = `
        <div class="popup-alert ${level}">
          <strong>${cmd.properties?.nombre || 'Comandancia'}</strong><br>
          ${message}
        </div>`;

            new maplibregl.Popup({
                offset: 12,
                closeButton: false,
                className: 'popup-tactico'
            })
                .setLngLat(coords)
                .setHTML(html)
                .addTo(map);

            // auto-remove a los 4 s
            setTimeout(() => {
                const popups = document.querySelectorAll('.maplibregl-popup');
                if (popups.length) popups[0].remove();
            }, 4000);
        });

        console.log(`📡 ${gcComandancias.length} comandancias notificadas:`, message);
        LogModule.add(' Guardia Civil informada — alerta activada en comandancias.', 'success');

    }

    // ======================================================
    // 🔎 Asignar cada cuartel a su COMANDANCIA más cercana
    // ======================================================
    function assignCuartelesToNearestComandancia(maxDistanceKm = 80) {
        if (!map || !map.getSource('guardia_civil') || !map._gcComandancias) {
            console.warn("⚠️ No hay datos suficientes para asignar cuarteles a comandancias.");
            return { asignaciones: new Map(), lines: [] };
        }

        const src = map.getSource('guardia_civil');
        const allFeatures = src._data?.features || [];

        const cuarteles = allFeatures.filter(f => {
            const nombre = (f.properties?.nombre || "").toLowerCase();
            return !nombre.includes('comandancia');
        });

        const asignaciones = new Map();
        const lines = [];

        cuarteles.forEach(cuartel => {
            const cuartelPt = turf.point(cuartel.geometry.coordinates[0]);
            let nearest = null;
            let nearestDist = Infinity;

            map._gcComandancias.forEach(cmd => {
                const dist = turf.distance(
                    turf.point(cmd.geometry.coordinates[0]),
                    cuartelPt,
                    { units: 'kilometers' }
                );
                if (dist < nearestDist) {
                    nearest = cmd;
                    nearestDist = dist;
                }
            });

            if (nearest && nearestDist <= maxDistanceKm) {
                if (!asignaciones.has(nearest.properties.nombre)) {
                    asignaciones.set(nearest.properties.nombre, []);
                }
                asignaciones.get(nearest.properties.nombre).push(cuartel);

                // 🔹 Crear la línea visual
                lines.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            nearest.geometry.coordinates[0],
                            cuartel.geometry.coordinates[0]
                        ]
                    },
                    properties: {
                        from: nearest.properties.nombre,
                        to: cuartel.properties.nombre,
                        distance_km: nearestDist
                    }
                });
            }
        });

        console.log(`📡 Asignaciones creadas: ${lines.length} líneas / ${asignaciones.size} comandancias`);
        return { asignaciones, lines };
    }


    // ======================================================
    // ⚡ Propagación de alerta a TODOS los cuarteles (cercanía)
    // ======================================================
    function propagateAlertNearest() {
        const { asignaciones, lines } = assignCuartelesToNearestComandancia();

        if (!map.getSource('gc_alert_lines')) {
            map.addSource('gc_alert_lines', {
                type: 'geojson',
                data: { type: "FeatureCollection", features: lines }
            });
            map.addLayer({
                id: 'gc_alert_lines_layer',
                type: 'line',
                source: 'gc_alert_lines',
                paint: {
                    'line-color': '#00ff90',
                    'line-width': 1.2,
                    'line-opacity': 0.6,
                    'line-dasharray': [1, 1]
                }
            });
        } else {
            map.getSource('gc_alert_lines').setData({ type: "FeatureCollection", features: lines });
        }

        // Destello en cuarteles alertados
        lines.forEach(l => highlightCuartel(l.properties.to));

        logTactico(`Aviso propagado a ${lines.length} cuarteles (asignación por cercanía).`);
    }



    // ================================
    // 🗒️ Log táctico — salida visual
    function logTactico(msg) {
        const panel = document.getElementById('log-tactico');
        if (!panel) return;
        const now = new Date();
        const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="hora">${hora}</span> ${msg}`;
        panel.prepend(entry);
    }

    // ======================================================
    // 💚 Efecto de brillo temporal para un cuartel avisado
    // ======================================================
    function normalize(str) {
        return (str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // quita tildes
            .replace(/[^a-z0-9]/g, "");      // quita espacios y signos
    }

    function highlightCuartel(nombre) {
        const target = normalize(nombre);
        const imgs = [...document.querySelectorAll('img[alt]')];
        const match = imgs.find(img => normalize(img.alt).includes(target));

        if (match) {
            match.classList.add('gc-ping');
            setTimeout(() => match.classList.remove('gc-ping'), 1800);
        } else {
            // 🔇 Cambia el warning por un log discreto
            console.debug(`(no match visual para cuartel: ${nombre})`);
        }
    }




    // ================================
    return {
        init,
        updateConnections,
        notifyComandancias,
        assignCuartelesToNearestComandancia,
        propagateAlertNearest,
        highlightCuartel

    };
})();
