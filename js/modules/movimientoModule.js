// js/modules/movimientoModule.js
window.MovimientoModule = (() => {
    let map;
    const markers = new Map();
    const activeAnimations = new Map();
    const positionHistory = new Map(); // id => [{t: ms, x: mercX, y: mercY, lon, lat}, ...]


    // === 1. Inicialización ===
    async function init(mapInstance, dataPath = '../../data/unidades_maritimas.geojson') {
        map = mapInstance;
        const res = await fetch(dataPath);
        const data = await res.json();

        data.features.forEach(f => {
            const { id, tipo, nombre } = f.properties;
            const coords = f.geometry.coordinates;

            // === Crear elemento IMG ===
            const el = document.createElement('img');
            el.src = getIconPath(tipo);
            el.alt = nombre || tipo;
            el.className = `unit-icon ${tipo.toLowerCase()}`;
            el.onerror = () => console.warn(`⚠️ Icono no encontrado para tipo: ${tipo}`);

            // === Crear marcador con el elemento IMG ===
            const marker = new maplibregl.Marker({ element: el })
                .setLngLat(coords)
                .addTo(map);

            markers.set(id, marker);
        });

        console.log('🟢 Unidades cargadas y marcadores creados');
    }

    // === 2. Movimiento lineal interpolado ===
    function animateUnit(id, route, speedMps = 15) {
        const marker = markers.get(id);
        if (!marker || !route || route.length < 2) return;

        let i = 0;
        let t = 0;
        const [startLon, startLat] = route[0];
        marker.setLngLat([startLon, startLat]);

        function step() {
            const start = route[i];
            const end = route[i + 1];
            if (!end) return;

            // Convertir a metros
            const [sx, sy] = window.CoordUtils.lonLatToMerc(start[0], start[1]);
            const [ex, ey] = window.CoordUtils.lonLatToMerc(end[0], end[1]);
            const segDist = Math.hypot(ex - sx, ey - sy);

        
            if (window.SIMULATION_PAUSED) return requestAnimationFrame(step);
            const stepMeters = speedMps * (1 / 60) * (window.SIMULATION_SPEED || 1);

            t += stepMeters / segDist;

            if (t >= 1) {
                i++;
                t = 0;
                if (i >= route.length - 1) return;
            }

            const lon = start[0] + (end[0] - start[0]) * t;
            const lat = start[1] + (end[1] - start[1]) * t;
            marker.setLngLat([lon, lat]);
            requestAnimationFrame(step);
        }

        step();
    }




    // === 3. Rutas de ejemplo ===
    function startMovimientoBAM() {
        const rutaBAM = [
            [-5.8, 35.9],
            [-5.79, 35.91],
            [-5.78, 35.91],
            [-5.77, 35.92]
        ];
        animateUnit('bam', rutaBAM, 0.0002);
    }

    function startMovimientoNarcolancha() {
        const rutaNarco = [
            [-5.85, 35.85],
            [-5.83, 35.86],
            [-5.81, 35.87],
            [-5.79, 35.88],
            [-5.77, 35.89],
            [-5.75, 35.9]
        ];
        animateUnit('narcolancha', rutaNarco, 0.001);
    }

    // === 4. Utilidades ===
    function getIconPath(tipo) {
        const base = '../../img/icons/';
        const map = {
            BAM: 'icon_bam_friendly.svg',
            NARCOLANCHA: 'icon_narcolancha_hostile.svg',
            NH90: 'icon_helicoptero_friendly.svg',
            DRON: 'icon_dron_friendly.svg'
        };
        return base + (map[tipo.toUpperCase()] || 'icon_contacto_unknown.svg');
    }

    function getMarker(id) {
        return markers.get(id);
    }

    // === 5. NUEVAS FUNCIONES: rutas desde GeoJSON ===
    // === 🔹 Cargar rutas desde GeoJSON (EPSG:3857 → EPSG:4326) ===
    async function loadRoutes(dataPath = '../../data/Rutas.geojson') {
        try {
            const res = await fetch(dataPath);
            if (!res.ok) throw new Error(`Error al cargar ${dataPath}`);
            const data = await res.json();

            const routeIndex = new Map();

            data.features.forEach(f => {
                const props = f.properties || {};
                const id = props.route_id || props.id || props.nombre;
                if (!id) return;

                // Convertir coordenadas si vienen en EPSG:3857
                let coords = [];
                if (f.geometry.type === 'MultiLineString') {
                    coords = f.geometry.coordinates.flat().map(([x, y]) => CoordUtils.toLonLat(x, y));

                } else if (f.geometry.type === 'LineString') {
                    coords = f.geometry.coordinates.map(([x, y]) => toLonLat(x, y));
                }

                routeIndex.set(id, {
                    id,
                    name: props.nombre || id,
                    color: props.stroke || '#00E5FF',
                    width: parseFloat(props['stroke-width'] || props['troke-widt'] || 2),
                    coords
                });
            });

            console.log(`🗺️ Rutas cargadas (${routeIndex.size} features)`);
            return routeIndex;
        } catch (err) {
            console.error('❌ Error en loadRoutes:', err);
            return new Map();
        }
    }

    // === Conversión EPSG:3857 → EPSG:4326 ===
    // Conversión lon/lat <-> WebMercator (m)
    function lonLatToMerc(lon, lat) {
        const x = (lon * 20037508.34) / 180;
        let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
        y = (y * 20037508.34) / 180;
        return [x, y];
    }
    function mercToLonLat(x, y) {
        const lon = (x / 20037508.34) * 180;
        let lat = (y / 20037508.34) * 180;
        lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
        return [lon, lat];
    }

    // Obtener posición actual (lon, lat)
    function getPosition(id) {
        const marker = markers.get(id);
        if (!marker) return null;
        const p = marker.getLngLat();
        return [p.lng, p.lat];
    }

    // Estimar velocidad en m/s como vector [vx, vy] en metros por segundo (x east, y north)
    function getVelocity(id) {
        const hist = positionHistory.get(id);
        if (!hist || hist.length < 2) return [0, 0];
        // usar los dos últimos registros
        const a = hist[hist.length - 2];
        const b = hist[hist.length - 1];
        const dt = (b.t - a.t) / 1000; // segundos
        if (dt <= 0) return [0, 0];
        const vx = (b.x - a.x) / dt;
        const vy = (b.y - a.y) / dt;
        return [vx, vy];
    }



    function routeToCoords(routeFeature) {
        if (!routeFeature || !routeFeature.geometry) return [];
        if (routeFeature.geometry.type === 'LineString') {
            return routeFeature.geometry.coordinates;
        }
        console.warn('⚠️ routeToCoords: tipo no soportado:', routeFeature.geometry.type);
        return [];
    }

    function toLonLat(x, y) {
        const lon = (x / 20037508.34) * 180;
        const latTmp = (y / 20037508.34) * 180;
        const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((latTmp * Math.PI) / 180)) - Math.PI / 2);
        return [lon, lat];
    }
    function lonLatToMerc(lon, lat) {
        const x = (lon * 20037508.34) / 180;
        let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
        y = (y * 20037508.34) / 180;
        return [x, y];
    }

    // === 6. API Pública ===
    return {
        init,
        animateUnit,
        startMovimientoBAM,
        startMovimientoNarcolancha,
        getMarker,
        loadRoutes,
        routeToCoords,
        getPosition,
        getVelocity
    };

})();
