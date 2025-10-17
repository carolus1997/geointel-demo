window.ToolDraw = (() => {
  function dibujar(map, draw, tipo = "polygon") {
    draw.changeMode(`draw_${tipo}`);

    map.once("draw.create", e => {
      const feature = e.features[0];
      const color = window.ACTIVE_DRAW_COLOR || "#00E5FF";

      if (feature && feature.id) {
        feature.properties.color = color;

        // 🔹 Añadir una capa temporal personalizada
        const layerId = `draw-${feature.id}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(layerId)) map.removeSource(layerId);

        map.addSource(layerId, { type: "geojson", data: feature });
        const type = feature.geometry.type;

        if (type === "Polygon") {
          map.addLayer({
            id: layerId,
            type: "fill",
            source: layerId,
            paint: { "fill-color": color, "fill-opacity": 0.4 }
          });
        } else if (type === "LineString") {
          map.addLayer({
            id: layerId,
            type: "line",
            source: layerId,
            paint: { "line-color": color, "line-width": 2 }
          });
        } else if (type === "Point") {
          map.addLayer({
            id: layerId,
            type: "circle",
            source: layerId,
            paint: {
              "circle-radius": 6,
              "circle-color": color,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1.5
            }
          });
        }
      }
    });
  }

  return { dibujar };
})();
