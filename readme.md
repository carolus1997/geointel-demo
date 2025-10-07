# 🛰️ Plataforma de Geointeligencia Táctica

## Estructura del proyecto

geointel-demo/
│
├── index.html ← Landing principal ("Centro de Operaciones")
│ con mapa global y listado interactivo de misiones.
│
├── misiones/
│ ├── mision1/
│ │ ├── mision1.html ← Página de la Misión 1 (Vigilancia Costera)
│ │ ├── js/mision1.js
│ │ ├── data/
│ │ │ ├── sensores.geojson
│ │ │ ├── rutas.geojson
│ │ │ └── zonas_riesgo.geojson
│ │ └── pdf/
│ │ ├── briefing.pdf
│ │ ├── intel.pdf
│ │ └── debrief.pdf
│ │
│ ├── mision2/
│ │ ├── mision2.html ← Trípoli, Libia (Detección constructiva)
│ │ ├── js/mision2.js
│ │ ├── data/
│ │ │ ├── sensores.geojson
│ │ │ ├── cambios_opticos.geojson
│ │ │ ├── rutas.geojson
│ │ │ └── poblados.geojson
│ │ └── pdf/
│ │ ├── briefing.pdf
│ │ ├── intel.pdf
│ │ └── debrief.pdf
│ │
│ ├── mision3/
│ │ ├── mision3.html ← Caso híbrido Argelia–Marruecos (OP-H2O)
│ │ ├── js/mision3.js
│ │ ├── data/
│ │ │ ├── AOI.geojson
│ │ │ ├── conducciones_osm.geojson
│ │ │ ├── instalaciones.geojson
│ │ │ ├── poblados.geojson
│ │ │ ├── pozos.geojson
│ │ │ └── cambios_derivados.geojson
│ │ └── pdf/
│ │ ├── briefing.pdf
│ │ ├── intel.pdf
│ │ └── debrief.pdf
│ │
│ └── (nuevas misiones futuras…)
│
│
├── css/
│ ├── style.css ← Estilo global (tema táctico oscuro)
│ ├── animations.css ← Animaciones HUD, radar, glow, typewriter
│ └── map.css ← Estilos específicos del mapa (opcional)
│
├── js/
│ ├── main.js ← Script principal de la landing (mapa + tarjetas)
│ ├── transition.js ← Fundidos y barridos entre páginas
│ ├── typewriter.js ← Efecto escritura táctica en textos
│ ├── intro.js ← Pantalla de inicio "Initializing Tactical Interface..."
│ ├── reloj.js ← Reloj LED global (zona horaria Madrid)
│ ├── loadFooter.js ← Carga dinámica del footer en todas las páginas
│ ├── mapUtils.js ← Funciones comunes para mapas (añadir capas, toggles, etc.)
│ └── ui.js ← Controles y eventos de interfaz general
│
├── data/
│ ├── misiones.geojson ← Coordenadas, nombres y enlaces de las misiones (landing)
│ └── tiles/ ← (opcional) tiles vectoriales o raster MBTiles para modo offline
│
├── img/
│ ├── logos/
│ │ ├── logo_indra.png
│ │ ├── logo_upct.png
│ │ └── escudo_militar.png
│ │
│ ├── icons/ ← Iconos temáticos para marcadores o UI
│ │ ├── sensor_sigint.svg
│ │ ├── sensor_elint.svg
│ │ ├── radar.png
│ │ ├── alert.svg
│ │ └── target.svg
│ │
│ └── ui/ ← HUDs, retículas y elementos decorativos
│ ├── crosshair.png
│ └── radar-ring.png
│
├── resources/
│ ├── docs/ ← Documentación técnica y briefs de inteligencia
│ │ ├── briefing_mision1.pdf
│ │ ├── guia_operaciones_geoint.pdf
│ │ └── protocolo_respuesta_hibrida.pdf
│ │
│ ├── media/ ← Imágenes, vídeos o renders de misiones
│ │ ├── mision1_overview.mp4
│ │ ├── mision2_tripoli.png
│ │ └── mapa_general.jpg
│ │
│ └── refs/ ← Fuentes bibliográficas y enlaces externos
│ ├── fuentes_intel.md
│ └── bibliografia_geoint.md
│
├── partials/
│ └── footer.html ← Footer común con reloj LED (cargado por loadFooter.js)
│
├── server/ ← (opcional) integración con GeoServer o entorno Docker
│ ├── docker-compose.yml
│ └── config/
│ ├── geoserver_settings.xml
│ └── ssl/
│ ├── cert.pem
│ └── key.pem
│
└── README.md ← Este documento



## ⚙️ Tecnologías principales

| Componente | Descripción |
|-------------|--------------|
| **MapLibre GL JS** | Motor de mapas 2D, estilo DarkMatter con API Key propia. |
| **QGIS + GeoServer (Docker)** | Generación y publicación de datasets, tiles y capas vectoriales. |
| **HTML / CSS / JS nativo** | Sin frameworks externos. Animaciones, HUD y UI diseñados ad hoc. |
| **Fonts Orbitron / Roboto Mono / Inter** | Tipografía táctica digital. |
| **SessionStorage** | Control de intro y persistencia de estado de usuario. |

---

## 🎯 Misiones actuales

| Código | Título | Tema |
|--------|--------|------|
| **OP-SEA-001** | Vigilancia Costera | Análisis SIGINT/IMINT marítimo. |
| **OP-TRI-001** | Trípoli, Libia | Detección constructiva periurbana. |
| **OP-H2O-ALG-MAR-003** | Argelia–Marruecos | Guerra híbrida y manipulación del agua. |

---

## 💡 Estética y UX táctica

- **Tema oscuro:** #0D1117 base · #00C896 verde sensor · #00E5FF cian HUD · #FF2B2B reloj LED.  
- **Animaciones:** intro de arranque, typewriter, fundidos de transición y pulsos radar.  
- **HUDs flotantes:** reloj digital, coordenadas, metadatos.  
- **Marcadores:** circulares, animados, sin “pin-drop”.  
- **Popups:** panel táctico con bordes luminosos y botones de acción.
