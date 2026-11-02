import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const STORE = { lat: 13.0418, lng: 80.25, name: "StepUp.in Store", address: "No. 14, Anna Salai, Teynampet, Chennai, Tamil Nadu 600018" };
/* Tiles: try OpenStreetMap directly first; if the browser/OSM blocks it (403 / "Access blocked"), switch to our own
   backend tile proxy (/tiles/...), then to Carto as a last resort. Works locally and after deployment. */
const ATTR = "&copy; OpenStreetMap contributors";
const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
const SOURCES = [
  () => L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin", attribution: ATTR }),
  () => L.tileLayer(`${API_ROOT}/tiles/{z}/{x}/{y}.png`, { maxZoom: 19, attribution: ATTR }),
  () => L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", { maxZoom: 19, subdomains: "abcd", attribution: ATTR + " &copy; CARTO" }),
];
function addTiles(m) {
  let i = 0, bad = 0, layer;
  const use = () => { if (layer) m.removeLayer(layer); bad = 0; layer = SOURCES[i](); layer.on("tileerror", () => { if (++bad >= 3 && i < SOURCES.length - 1) { i++; use(); } }); layer.addTo(m); };
  use();
}
const icon = (e) => L.divIcon({ html: `<div style="font-size:26px;line-height:26px">${e}</div>`, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });

/* points: [{lat,lng,icon,label}]  lines: [{pts:[[lat,lng],...], dash}]  — real OpenStreetMap tiles, no API key */
/* Click the map, drag the pin, or let the page move it. value / onChange use {lat, lng}. */
export function LocationPicker({ value, onChange, height = 300 }) {
  const el = useRef(); const map = useRef(); const marker = useRef(); const cb = useRef(onChange); cb.current = onChange;
  useEffect(() => {
    const start = value ? [value.lat, value.lng] : [STORE.lat, STORE.lng];
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(start, value ? 14 : 6);
    addTiles(m);
    const mk = L.marker(start, { draggable: true, icon: icon("📍") }).addTo(m);
    mk.on("dragend", () => { const p = mk.getLatLng(); cb.current({ lat: p.lat, lng: p.lng }); });
    m.on("click", (e) => { mk.setLatLng(e.latlng); cb.current({ lat: e.latlng.lat, lng: e.latlng.lng }); });
    map.current = m; marker.current = mk;
    return () => { m.remove(); };
  }, []);
  useEffect(() => {
    if (!value || !marker.current) { return; }
    const ll = [value.lat, value.lng]; marker.current.setLatLng(ll);
    if (!map.current.getBounds().contains(ll)) { map.current.setView(ll, 14); }
  }, [value?.lat, value?.lng]);
  return <div ref={el} className="map" style={{ height }} role="application" aria-label="Pick your delivery location on the map" />;
}

export default function MapView({ points, lines = [], height = 340 }) {
  const el = useRef();
  useEffect(() => {
    const m = L.map(el.current, { scrollWheelZoom: false });
    addTiles(m);
    const ll = [];
    points.filter((p) => p.lat != null).forEach((p) => { L.marker([p.lat, p.lng], { icon: icon(p.icon) }).addTo(m).bindPopup(p.label); ll.push([p.lat, p.lng]); });
    lines.forEach((l) => L.polyline(l.pts, { color: "#2F4F4F", weight: 4, dashArray: l.dash ? "8 10" : null }).addTo(m));
    m.fitBounds(ll, { padding: [40, 40], maxZoom: 15 });
    return () => m.remove();
  }, [JSON.stringify([points, lines])]);
  return <div ref={el} className="map" style={{ height }} role="img" aria-label="Map" />;
}
