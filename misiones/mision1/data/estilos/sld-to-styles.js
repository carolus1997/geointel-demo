// === sld-to-styles_final.js ===
// Compatible con tus SLD de QGIS (se:, SvgParameter)
// Ejecuta: node sld-to-styles_final.js

import fs from "fs";
import { parseStringPromise } from "xml2js";

const inputDir = "./";
const outputFile = "./data/styles.json";

function getParam(block, name) {
  if (!block) return null;
  const params = block["SvgParameter"] || block["se:SvgParameter"] || [];
  const found = params.find(p => p.$.name === name);
  return found ? found._ : null;
}

function get(block, keys) {
  for (const k of keys) {
    if (block?.[k]) return block[k];
  }
  return null;
}

async function parseSLD(filePath) {
  const xml = fs.readFileSync(filePath, "utf-8");
  const parsed = await parseStringPromise(xml);
  const layerName = filePath.replace(/^.*[\\/]/, "").replace(".sld", "");

  const sld = parsed.StyledLayerDescriptor || parsed["se:StyledLayerDescriptor"];
  const named = get(sld, ["NamedLayer", "se:NamedLayer"])?.[0];
  const userStyle = get(named, ["UserStyle", "se:UserStyle"])?.[0];
  const fts = get(userStyle, ["FeatureTypeStyle", "se:FeatureTypeStyle"])?.[0];
  const rule = get(fts, ["Rule", "se:Rule"])?.[0];

  let paint = {};

  // === PolygonSymbolizer ===
  const poly = get(rule, ["PolygonSymbolizer", "se:PolygonSymbolizer"])?.[0];
  if (poly) {
    const fill = get(poly, ["Fill", "se:Fill"])?.[0];
    const stroke = get(poly, ["Stroke", "se:Stroke"])?.[0];
    const fillColor = getParam(fill, "fill") || "#888888";
    const fillOpacity = parseFloat(getParam(fill, "fill-opacity") || 0.4);
    const strokeColor = getParam(stroke, "stroke") || "#000000";
    const strokeWidth = parseFloat(getParam(stroke, "stroke-width") || 0.5);
    paint = {
      "fill-color": fillColor,
      "fill-opacity": fillOpacity,
      "fill-outline-color": strokeColor,
      "fill-outline-width": strokeWidth
    };
  }

  // === PointSymbolizer ===
  const point = get(rule, ["PointSymbolizer", "se:PointSymbolizer"])?.[0];
  if (point) {
    const graphic = get(point, ["Graphic", "se:Graphic"])?.[0];
    const mark = get(graphic, ["Mark", "se:Mark"])?.[0];
    const fill = get(mark, ["Fill", "se:Fill"])?.[0];
    const fillColor = getParam(fill, "fill") || "#00C896";
    const opacity = parseFloat(getParam(fill, "fill-opacity") || 1);
    const size = parseFloat(get(graphic, ["Size", "se:Size"])?.[0]) || 6;
    paint = {
      "circle-color": fillColor,
      "circle-opacity": opacity,
      "circle-radius": size / 3
    };
  }

  // === LineSymbolizer ===
  const line = get(rule, ["LineSymbolizer", "se:LineSymbolizer"])?.[0];
  if (line) {
    const stroke = get(line, ["Stroke", "se:Stroke"])?.[0];
    const color = getParam(stroke, "stroke") || "#000000";
    const width = parseFloat(getParam(stroke, "stroke-width") || 1);
    paint = { "line-color": color, "line-width": width };
  }

  return { [layerName]: paint };
}

async function main() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".sld"));
  const all = {};
  for (const f of files) {
    console.log(`🎨 Procesando ${f}...`);
    const style = await parseSLD(`${inputDir}/${f}`);
    Object.assign(all, style);
  }
  fs.mkdirSync("./data", { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(all, null, 2));
  console.log(`✅ Archivo de estilos creado: ${outputFile}`);
}

main().catch(console.error);
