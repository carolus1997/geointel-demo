// ======================================================
// 🧹 tools_delete.js — v5.1 (estable)
// ======================================================
// Multipass delete: Draw + buffers + notas + capas auxiliares
// Incluye detección por prefijos, registro global y protección HUD
// ======================================================

window.ToolsDelete = (() => {
  let map, draw;
  let deleteMode = false;
  let tip;
  const PREFIXES = ['draw-', 'buffer-', 'zone-', 'note-']; // objetivos de borrado
  const SAFE_LAYERS = ['hud-', 'routes-', 'radar-', 'mapbox-', 'basemap-', 'terrain-']; // protegidos
  const onMapClick = (e) => handleDeleteClick(e);

  if (!window.TOOLBOX_REG) {
    window.TOOLBOX_REG = { layers: new Set(), sources: new Set() };
  }

  function log(...a){ if (window.TOOLS_DELETE_DEBUG) console.log('[🧹TD]', ...a); }

  // ======================================================
  // INIT
  // ======================================================
  function init(_map, _draw) {
    map = _map;
    draw = _draw;
    log('ToolsDelete v5.1 inicializado');
    window.TD_listUnderCursor = (pt) => listUnderPoint(pt || lastPoint || {x:0,y:0});
  }

  // ======================================================
  // TOGGLE
  // ======================================================
  function toggle() {
    deleteMode = !deleteMode;
    const btn = document.getElementById('btn-delete');
    if (btn) btn.classList.toggle('active', deleteMode);
    map.getCanvas().style.cursor = deleteMode ? 'crosshair' : '';

    if (deleteMode) {
      showTip('🧽 Modo borrado — clic en geometría o nota (SHIFT=inspeccionar)');
      map.on('click', onMapClick);
    } else {
      hideTip();
      map.off('click', onMapClick);
      map.getCanvas().style.cursor = ''; // restaurar cursor
    }
  }

  let lastPoint = null;

  // ======================================================
  // CLICK PRINCIPAL
  // ======================================================
  async function handleDeleteClick(e) {
    if (!deleteMode) return;
    lastPoint = e.point;

    if (e.originalEvent.shiftKey) {
      listUnderPoint(e.point, true);
      return;
    }

    // 0️⃣ ¿Nota?
    const el = document.elementFromPoint(e.originalEvent.clientX, e.originalEvent.clientY);
    const note = el?.closest?.('.map-note');
    if (note) {
      note.remove();
      window.ToolsNotes?.removeByElement?.(note);
      
      return;
    }

    // 1️⃣ MAPBOX DRAW
    try {
      const ids = (draw.getFeatureIdsAt && draw.getFeatureIdsAt(e.point)) || [];
      if (ids.length) {
        log('draw.hit ->', ids[0]);
        draw.delete(ids[0]);
        
        await microTick();
        return;
      }
    } catch (err) { log('draw.getFeatureIdsAt error', err); }

    // 2️⃣ CAPAS RENDERIZADAS
    const hit = topMostLayerHit(e.point);
    if (hit) {
      const { layerId, sourceId } = hit;
      if (SAFE_LAYERS.some(p => layerId.startsWith(p))) return; // protección
      log('rendered.hit ->', hit);
      const ok = await removeLayerAndSource(layerId, sourceId);
      if (ok) {
        
        await microTick();
        return;
      }
    }

    // 3️⃣ FALLBACK
    const killed = await hideThenRemoveUnderPoint(e.point);
    if (killed) {
      
      return;
    }

    
  }

  // ======================================================
  // CONSULTAS Y ELIMINACIONES
  // ======================================================
  function listUnderPoint(point, printOnly=false) {
    const bbox = [
      [point.x - 4, point.y - 4],
      [point.x + 4, point.y + 4]
    ];
    const feats = map.queryRenderedFeatures(bbox);
    const info = feats.map(f => ({
      layerId: f.layer?.id,
      sourceId: f.layer?.source,
      type: f.layer?.type,
      props: f.properties
    }));
    log('Under cursor:', info);
    if (!printOnly) return info;
  }

  function topMostLayerHit(point) {
    const info = listUnderPoint(point) || [];
    const candidate = info.find(i => i.layerId && PREFIXES.some(p => i.layerId.startsWith(p)));
    if (candidate) return { layerId: candidate.layerId, sourceId: candidate.sourceId };
    const drawLike = info.find(i => i.sourceId && (i.sourceId.startsWith('draw-') || i.layerId?.startsWith('draw-')));
    if (drawLike) return { layerId: drawLike.layerId, sourceId: drawLike.sourceId };
    return null;
  }

  async function removeLayerAndSource(layerId, sourceId) {
    let touched = false;
    if (SAFE_LAYERS.some(p => layerId.startsWith(p))) return false;
    try {
      if (layerId && map.getLayer(layerId)) {
        map.removeLayer(layerId);
        log('removed layer:', layerId);
        touched = true;
      }
    } catch(e){ log('removeLayer err', e); }

    try {
      if (!sourceId && layerId && map.getSource(layerId)) {
        sourceId = layerId;
      }
      if (sourceId && map.getSource(sourceId)) {
        map.removeSource(sourceId);
        log('removed source:', sourceId);
        touched = true;
      }
    } catch(e){ log('removeSource err', e); }

    sweepGhosts(layerId, sourceId);
    await microTick();
    return touched;
  }

  function sweepGhosts(idA, idB) {
    const ids = [idA, idB].filter(Boolean);
    const style = map.getStyle?.();
    if (!style?.layers) return;
    style.layers.forEach(l => {
      if (!l?.id) return;
      if (ids.some(id => l.id.includes(id)) || PREFIXES.some(p => l.id.startsWith(p))) {
        if (SAFE_LAYERS.some(p => l.id.startsWith(p))) return;
        try { if (map.getLayer(l.id)) map.removeLayer(l.id), log('sweep layer:', l.id); } catch{}
        try { if (map.getSource(l.id)) map.removeSource(l.id), log('sweep source:', l.id); } catch{}
      }
    });
  }

  async function hideThenRemoveUnderPoint(point) {
    const info = listUnderPoint(point) || [];
    let acted = false;
    for (const i of info) {
      if (!i.layerId) continue;
      const isTarget = PREFIXES.some(p => i.layerId.startsWith(p)) ||
                       i.sourceId?.startsWith('draw-') || i.layerId.startsWith('draw-');
      if (!isTarget || SAFE_LAYERS.some(p => i.layerId.startsWith(p))) continue;

      try { map.setLayoutProperty(i.layerId, 'visibility', 'none'); } catch {}
      muteLayer(i.layerId);
      await microTick();
      const ok = await removeLayerAndSource(i.layerId, i.sourceId);
      acted = ok || acted;
    }
    return acted;
  }

  function muteLayer(id) {
    const l = map.getLayer(id);
    if (!l) return;
    const type = l.type;
    try {
      if (type === 'fill') {
        map.setPaintProperty(id, 'fill-opacity', 0);
      } else if (type === 'line') {
        map.setPaintProperty(id, 'line-opacity', 0);
      } else if (type === 'circle') {
        map.setPaintProperty(id, 'circle-opacity', 0);
      } else if (type === 'symbol') {
        map.setLayoutProperty(id, 'visibility', 'none');
      }
    } catch {}
  }

  function microTick() {
    return new Promise(res => requestAnimationFrame(() => {
      map.triggerRepaint?.();
      res();
    }));
  }

  // ======================================================
  // CLEAR ALL
  // ======================================================
  async function clearAll() {
    try { window.ToolsNotes?.clearAll?.(); } catch {}

    const style = map.getStyle?.();
    if (!style?.layers) return;

    for (const l of [...style.layers]) {
      if (!l?.id) continue;
      if (SAFE_LAYERS.some(p => l.id.startsWith(p))) continue;
      if (PREFIXES.some(p => l.id.startsWith(p)) || l.id.startsWith('draw-')) {
        await removeLayerAndSource(l.id, l.source);
      }
    }

    for (const lid of Array.from(window.TOOLBOX_REG.layers)) {
      await removeLayerAndSource(lid, null);
      window.TOOLBOX_REG.layers.delete(lid);
    }
    for (const sid of Array.from(window.TOOLBOX_REG.sources)) {
      if (map.getSource(sid)) { try { map.removeSource(sid); log('removed reg source:', sid); } catch{} }
      window.TOOLBOX_REG.sources.delete(sid);
    }

    await microTick();
    flash('🧹 Todo eliminado', 'green');
    map.getCanvas().style.cursor = ''; // restaurar cursor
    deleteMode = false;
  }

  // ======================================================
  // UI FEEDBACK
  // ======================================================
  function showTip(t) {
    hideTip();
    tip = document.createElement('div');
    tip.className = 'delete-tooltip';
    tip.textContent = t;
    document.body.appendChild(tip);
    setTimeout(() => tip?.classList?.add('show'), 0);
  }
  function hideTip(){ if (tip) tip.remove(); tip = null; }

  function flash(msg, color='green'){
    const el = document.createElement('div');
    el.className = 'note-tip';
    el.textContent = msg;
    el.style.background = color === 'red' ? '#ff0040' :
                          color === 'yellow' ? '#ffc400' :
                          '#00ffb0';
    el.style.color = '#000';
    el.style.position = 'fixed';
    el.style.bottom = '30px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '6px 14px';
    el.style.borderRadius = '6px';
    el.style.fontSize = '13px';
    el.style.fontFamily = 'monospace';
    el.style.zIndex = '9999';
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = '1');
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 1400);
  }

  // ======================================================
  // EXPORT
  // ======================================================
  return { init, toggle, clearAll };
})();
