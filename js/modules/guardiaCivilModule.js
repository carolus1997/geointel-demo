// ======================================================
//  🟩 GuardiaCivilModule — conexión BAM ↔ Comandancias
// ======================================================
window.GuardiaCivilModule = (() => {
    let map;
    let connectionsLayerId = "gc_connections_line";
    let connectionSourceId = "gc_connections";
    let connectionColor = "#00E5FF";

    // ================================
    async function init(_map, geojsonPath = './guadiaCivil4326.geojson') {
        map = _map;
        console.log("🟢 GuardiaCivilModule iniciado");

        const res = await fetch(geojsonPath);
        const data = await res.json();

        // Añadir cuarteles (ya como en tu versión actual)
        addGuardiaCivilLayer(map, data);


        // Filtrar las comandancias
        const comandancias = data.features.filter(f =>
            f.properties.nombre.toLowerCase().includes("comandancia")
        );


        if (comandancias.length === 0) {
            console.warn("⚠️ No se encontraron comandancias en el GeoJSON");
            return;
        }

        // Crear capa de conexión vacía
        if (!map.getSource(connectionSourceId)) {
            map.addSource(connectionSourceId, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        }
        if (!map.getLayer(connectionsLayerId)) {
            map.addLayer({
                id: connectionsLayerId,
                type: "line",
                source: connectionSourceId,
                paint: {
                    "line-color": connectionColor,
                    "line-width": 2,
                    "line-opacity": 0.7,
                    "line-dasharray": [2, 2]
                }
            });
        }

        // Dibujar las conexiones iniciales
        updateConnections(comandancias);

        // Actualizar dinámicamente si el BAM se mueve
        if (window.MovimientoModule?.onUnitMove) {
            MovimientoModule.onUnitMove("bam", (lngLat) => {
                updateConnections(comandancias, lngLat);
            });
        } else {
            console.warn("⚠️ MovimientoModule.onUnitMove no disponible — conexiones estáticas");
        }
    }

    // ================================
    function addGuardiaCivilLayer(map, data) {
        // === Registrar el icono base (por compatibilidad con símbolo)
        if (!map.hasImage('icon_guardia_civil')) {
            const image = new Image();
            image.src = '../../img/icons/icon_guardia_civil.png';
            image.onload = () => map.addImage('icon_guardia_civil', image);
        }

        // === Crear marcadores individuales para comandancias (con brillo)
        data.features.forEach(f => {
            const nombre = f.properties.nombre.toLowerCase();
            const coords = f.geometry.coordinates[0];
            if (nombre.includes("comandancia")) {
                const el = document.createElement("img");
                el.src = "../../img/icons/icon_guardia_civil.png";
                el.className = "gc-glow"; // 💚 halo verde Guardia Civil
                el.style.width = "28px";
                el.style.height = "28px";
                el.alt = f.properties.nombre;

                new maplibregl.Marker({ element: el, anchor: "center" })
                    .setLngLat(coords)
                    .addTo(map);
            }
        });

        // === Fuente general de cuarteles (símbolo plano sin brillo)
        if (!map.getSource('guardia_civil'))
            map.addSource('guardia_civil', { type: 'geojson', data });

        if (!map.getLayer('guardia_civil_layer')) {
            map.addLayer({
                id: 'guardia_civil_layer',
                type: 'symbol',
                source: 'guardia_civil',
                layout: {
                    'icon-image': 'icon_guardia_civil',
                    'icon-size': 0.25,
                    'icon-allow-overlap': true
                }
            });
        }
    }


    // ================================
    function updateConnections(comandancias = null, bamPosition = null) {
        if (!map) {
            console.warn("⚠️ GuardiaCivilModule.updateConnections llamado antes de init()");
            return;
        }

        // Guardar referencia global para usar las comandancias del init
        if (comandancias && comandancias.length > 0) {
            map._gcComandancias = comandancias;
        } else if (map._gcComandancias) {
            comandancias = map._gcComandancias;
        } else {
            console.warn("⚠️ No hay comandancias disponibles para dibujar conexiones");
            return;
        }

        // Obtener posición actual del BAM desde MovimientoModule
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
        if (!source) {
            console.warn("⚠️ Fuente de conexión no creada todavía");
            return;
        }

        source.setData({
            type: "FeatureCollection",
            features
        });
    }

    // ================================
    return { init, updateConnections };
})();
