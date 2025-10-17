// ui_tools_panel.js
window.ToolsPanel = (() => {
    let panel, draw, map;
    const notas = []; // almacenamos notas {el, coords}

    function init(mapInstance, drawInstance, containerId = 'side-panel-tools') {
        map = mapInstance;
        draw = drawInstance;
        panel = document.getElementById(containerId);
        if (!panel) return console.error('❌ Panel no encontrado');

        panel.innerHTML = `
      <h2>Herramientas de Dibujo</h2>

      <div class="tool-group">
        <button class="tool-btn" data-mode="point"><i class="fa-solid fa-location-dot"></i> Punto</button>
        <button class="tool-btn" data-mode="line_string"><i class="fa-solid fa-slash"></i> Línea</button>
        <button class="tool-btn" data-mode="polygon"><i class="fa-solid fa-draw-polygon"></i> Polígono</button>
        <button id="btn-anotar" class="tool-btn"><i class="fa-solid fa-comment-dots"></i> Anotación</button>
      </div>

      <div class="tool-group spaced">
        <button id="btn-cancelar" class="tool-btn danger"><i class="fa-solid fa-xmark"></i> Cancelar</button>
        <button id="btn-limpiar" class="tool-btn danger"><i class="fa-solid fa-eraser"></i> Limpiar todo</button>
      </div>

      <div class="tool-group spaced">
        <button id="btn-exportar" class="tool-btn"><i class="fa-solid fa-download"></i> Exportar notas</button>
        <button id="btn-importar" class="tool-btn"><i class="fa-solid fa-upload"></i> Importar notas</button>
        <button id="btn-capturar" class="tool-btn"><i class="fa-solid fa-camera"></i> Capturar mapa</button>
      </div>

      <div id="tool-output"></div>
    `;

        // === eventos ===
        panel.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', e => {
                const mode = e.target.closest('button').dataset.mode;
                draw.changeMode(`draw_${mode}`);
                actualizarEstado(`✏️ Modo: ${mode}`);
            });
        });

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            draw.changeMode('simple_select');
            actualizarEstado('✋ Dibujo cancelado.');
        });

        document.getElementById('btn-limpiar').addEventListener('click', () => {
            draw.deleteAll();
            notas.forEach(n => n.el.remove());
            notas.length = 0;
            actualizarEstado('🧹 Todo limpiado.');
        });

        document.getElementById('btn-capturar').addEventListener('click', capturarMapa);
        document.getElementById('btn-anotar').addEventListener('click', activarModoAnotacion);
        document.getElementById('btn-exportar').addEventListener('click', exportarNotas);
        document.getElementById('btn-importar').addEventListener('click', importarNotas);


        // actualizar posiciones
        map.on('move', actualizarPosicionesNotas);
        map.on('zoom', actualizarPosicionesNotas);
    }

    // === Modo anotación ===
    function activarModoAnotacion() {
        actualizarEstado('🗒️ Modo anotación: haz clic en el mapa para colocar una nota.');
        map.getCanvas().style.cursor = 'crosshair';

        const clickHandler = e => {
            const coords = e.lngLat;

            // Crear contenedor de nota
            const note = document.createElement('div');
            note.className = 'map-note';
            note.dataset.lng = coords.lng;
            note.dataset.lat = coords.lat;

            // Crear textarea editable
            const textarea = document.createElement('textarea');
            // === Botón de color / categoría ===
            const colorBtn = document.createElement('div');
            colorBtn.className = 'note-color-btn';
            note.appendChild(colorBtn);

            // Categorías disponibles
            const categories = [
                { name: 'info', color: '#00E5FF' },     // azul
                { name: 'warning', color: '#FFD400' },  // amarillo
                { name: 'alert', color: '#FF6B00' },    // naranja/rojo
                { name: 'success', color: '#00C896' }   // verde
            ];
            let currentCat = 0;

            colorBtn.addEventListener('click', () => {
                currentCat = (currentCat + 1) % categories.length;
                const cat = categories[currentCat];
                note.dataset.category = cat.name;
                actualizarColorNota(note, cat.color);
            });

            // Función que aplica el color
            function actualizarColorNota(el, color) {
                el.style.borderColor = color;
                el.style.background = color + '33'; // añade transparencia
                el.style.setProperty('--note-color', color);
            }

            textarea.className = 'note-input';
            textarea.placeholder = 'Escribe aquí...';
            note.appendChild(textarea);

            // === Arrastrar la nota ===
            let isDragging = false;
            let startX, startY;

            note.addEventListener('mousedown', ev => {
                if (ev.target.tagName === 'TEXTAREA') return; // no interferir con texto
                isDragging = true;
                startX = ev.clientX;
                startY = ev.clientY;
                note.classList.add('dragging');
                ev.preventDefault();
            });

            window.addEventListener('mouseup', () => (isDragging = false));
            window.addEventListener('mousemove', ev => {
                if (!isDragging) return;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                const pixel = map.project([parseFloat(note.dataset.lng), parseFloat(note.dataset.lat)]);
                const nuevo = { x: pixel.x + dx, y: pixel.y + dy };
                const nuevoLngLat = map.unproject(nuevo);
                note.dataset.lng = nuevoLngLat.lng;
                note.dataset.lat = nuevoLngLat.lat;
                actualizarPosicionNota(note);
                startX = ev.clientX;
                startY = ev.clientY;
            });

            // === Borrar nota vacía con Supr ===
            textarea.addEventListener('keydown', ev => {
                if (ev.key === 'Delete' && !textarea.value.trim()) {
                    note.remove();
                    const idx = notas.findIndex(n => n.el === note);
                    if (idx >= 0) notas.splice(idx, 1);
                }
            });

            // === Añadir al mapa ===
            map.getContainer().appendChild(note);
            notas.push({ el: note, coords });
            actualizarPosicionNota(note);
            // Inicializar con categoría azul por defecto
            note.dataset.category = 'info';
            actualizarColorNota(note, categories[0].color);

            textarea.focus(); // enfocar automáticamente

            map.off('click', clickHandler);
            map.getCanvas().style.cursor = '';
            actualizarEstado('🗒️ Nota colocada.');
        };

        map.once('click', clickHandler);
    }

    // === Actualizar posición de una nota ===
    function actualizarPosicionNota(note) {
        const lng = parseFloat(note.dataset.lng);
        const lat = parseFloat(note.dataset.lat);
        const pixel = map.project([lng, lat]);
        note.style.left = `${pixel.x}px`;
        note.style.top = `${pixel.y}px`;
    }

    // === Actualizar todas las posiciones ===
    function actualizarPosicionesNotas() {
        notas.forEach(n => actualizarPosicionNota(n.el));
    }

    // === 📤 Exportar todas las notas visibles ===
    function exportarNotas() {
        const mapContainer = map.getContainer();
        const notes = Array.from(mapContainer.querySelectorAll('.map-note')).map(n => {
            const textarea = n.querySelector('.note-input');
            const text = textarea ? textarea.value.trim() : '';
            const lng = parseFloat(n.dataset.lng);
            const lat = parseFloat(n.dataset.lat);
            const category = n.dataset.category || 'info';
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                properties: {
                    text,
                    category
                }
            };
        });

        if (!notes.length) {
            actualizarEstado('⚠️ No hay notas que exportar.');
            return;
        }

        const featureCollection = {
            type: 'FeatureCollection',
            features: notes
        };

        const blob = new Blob(
            [JSON.stringify(featureCollection, null, 2)],
            { type: 'application/json' }
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anotaciones_mision2_${Date.now()}.geojson`;
        a.click();

        actualizarEstado('✅ Notas exportadas como GeoJSON.');
    }


    // === 📸 Captura táctica avanzada ===
    async function capturarMapa() {
        const mapContainer = map.getContainer();
        const canvas = map.getCanvas();

        // 🧊 1. Congelar transformaciones para evitar distorsiones elípticas
        const prevTransform = canvas.style.transform;
        canvas.style.transform = 'none';
        const svgs = mapContainer.querySelectorAll('svg');
        svgs.forEach(svg => (svg.style.transform = 'none'));

        // Pausar momentáneamente animaciones de radar si existen
        document.querySelectorAll('.radar-sweep, .pulse-line').forEach(el => {
            el.style.animationPlayState = 'paused';
        });

        // Forzar un frame estable antes de la captura
        map.triggerRepaint();
        await new Promise(r => setTimeout(r, 150));

        // 🖼️ 2. Captura del contenedor completo con html2canvas
        html2canvas(mapContainer, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scale: 2,
            logging: false,
            ignoreElements: el =>
                el.classList.contains('mapboxgl-control-container') // evita duplicar controles zoom
        })
            .then(canvasOut => {
                // Restaurar transformaciones
                canvas.style.transform = prevTransform;
                svgs.forEach(svg => (svg.style.transform = ''));
                document.querySelectorAll('.radar-sweep, .pulse-line').forEach(el => {
                    el.style.animationPlayState = '';
                });

                // === 3. Dibujar plantilla táctica sobre el canvas resultante ===
                const ctx = canvasOut.getContext('2d');
                const w = canvasOut.width;
                const h = canvasOut.height;

                // --- Franja inferior oscura ---
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, h - 110, w, 110);

                // --- Título de misión ---
                ctx.font = 'bold 36px "Segoe UI", Roboto, sans-serif';
                ctx.fillStyle = '#00E5FF';
                ctx.textAlign = 'left';
                ctx.fillText('Misión 2 — Interceptación en el Estrecho de Gibraltar', 50, h - 50);

                // --- Fecha/hora local ---
                ctx.font = '20px "Segoe UI", Roboto, sans-serif';
                ctx.fillStyle = '#ccc';
                ctx.textAlign = 'right';
                const now = new Date().toLocaleString('es-ES', {
                    hour12: false,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                ctx.fillText(now, w - 50, h - 40);

                // --- Logo táctico (opcional) ---
                const logo = new Image();
                logo.crossOrigin = 'anonymous';
                logo.src = 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Emblem_of_Spain.svg'; // puedes reemplazar por tu PNG local
                logo.onload = () => {
                    const size = 90;
                    ctx.globalAlpha = 0.25;
                    ctx.drawImage(logo, w - size - 40, h - size - 40, size, size);
                    ctx.globalAlpha = 1.0;

                    // --- Exportar ---
                    guardarCanvasComoPNG(canvasOut);
                };
                logo.onerror = () => guardarCanvasComoPNG(canvasOut);
            })
            .catch(err => {
                console.error('❌ Error al capturar:', err);
                actualizarEstado('⚠️ Error al generar la captura.');
            });
    }

    // === 💾 Guardar imagen final ===
    function guardarCanvasComoPNG(canvasOut) {
        const dataURL = canvasOut.toDataURL('image/png');
        const enlace = document.createElement('a');
        enlace.download = `captura_mision2_${Date.now()}.png`;
        enlace.href = dataURL;
        enlace.click();
        actualizarEstado('📸 Captura táctica guardada.');
    }




    function actualizarEstado(msg) {
        const out = document.getElementById('tool-output');
        if (out) out.innerHTML = `<p>${msg}</p>`;
    }

    // === 📥 Importar notas desde un archivo GeoJSON ===
    function importarNotas() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.geojson';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    const features = data.features || data; // permite GeoJSON o JSON plano
                    features.forEach(f => {
                        if (!f.geometry || !f.properties) return;
                        const [lng, lat] = f.geometry.coordinates;
                        const text = f.properties.text || '';
                        const category = f.properties.category || 'info';
                        crearNotaEnMapa(lng, lat, text, category);
                    });
                    actualizarEstado(`✅ ${features.length} notas importadas.`);
                } catch (err) {
                    actualizarEstado('❌ Error al leer el archivo.');
                    console.error(err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // === Función auxiliar para recrear una nota en el mapa ===
    function crearNotaEnMapa(lng, lat, texto, categoria = 'info') {
        const coords = { lng, lat };
        const p = map.project([lng, lat]);
        const note = document.createElement('div');
        note.className = 'map-note';
        note.style.left = p.x + 'px';
        note.style.top = p.y + 'px';
        note.dataset.lng = lng;
        note.dataset.lat = lat;
        note.dataset.category = categoria;

        // === Cuadro de texto ===
        const textarea = document.createElement('textarea');
        textarea.className = 'note-input';
        textarea.value = texto || '';
        note.appendChild(textarea);

        // === Botón de color ===
        const colorBtn = document.createElement('div');
        colorBtn.className = 'note-color-btn';
        note.appendChild(colorBtn);

        const categories = [
            { name: 'info', color: '#00E5FF' },
            { name: 'warning', color: '#FFD400' },
            { name: 'alert', color: '#FF6B00' },
            { name: 'success', color: '#00C896' }
        ];
        const cat = categories.find(c => c.name === categoria) || categories[0];
        note.style.borderColor = cat.color;
        note.style.background = cat.color + '33';
        note.style.setProperty('--note-color', cat.color);

        // === Mantener anclada ===
        function actualizarPosicion() {
            const p = map.project([lng, lat]);
            note.style.left = `${p.x}px`;
            note.style.top = `${p.y}px`;
        }
        map.on('move', actualizarPosicion);
        map.on('zoom', actualizarPosicion);

        // === Añadir al mapa ===
        map.getContainer().appendChild(note);
        textarea.addEventListener('input', () => (note.dataset.text = textarea.value.trim()));
    }

    return { init };
})();
