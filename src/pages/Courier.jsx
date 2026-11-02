import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import MapView from "../Map.jsx";

/* Open on the DELIVERY PERSON's phone: shares real GPS so the customer sees the parcel move live. */
export default function Courier() {
  const { number } = useParams(); const [sp] = useSearchParams(); const key = sp.get("key") || "";
  const [o, setO] = useState(null); const [err, setErr] = useState(""); const [on, setOn] = useState(false); const [me, setMe] = useState(null); const [msg, setMsg] = useState("");
  const watch = useRef(null); const last = useRef(0);
  useEffect(() => { api(`/courier/${number}/?key=${encodeURIComponent(key)}`, { auth: false }).then(setO).catch((e) => setErr(e.message)); }, [number, key]);
  useEffect(() => { return () => { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); }; }, []);
  const stop = () => { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); watch.current = null; setOn(false); };
  const start = () => {
    if (!navigator.geolocation) { setMsg("This phone/browser has no GPS support."); return; }
    setOn(true); setMsg("Waiting for GPS…");
    watch.current = navigator.geolocation.watchPosition((p) => {
      const pos = { lat: p.coords.latitude, lng: p.coords.longitude }; setMe(pos);
      if (Date.now() - last.current < 8000) { return; }
      last.current = Date.now();
      api(`/courier/${number}/`, { method: "POST", auth: false, body: { key, ...pos } }).then((r) => setMsg(`Sharing live location ✓ (${r.status_label})`)).catch((e) => setMsg(e.message));
    }, (e) => { setMsg(e.code === 1 ? "Location permission denied. Allow location for this site, then tap Start again." : "Could not get a GPS position."); stop(); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  };
  const delivered = () => api(`/courier/${number}/`, { method: "POST", auth: false, body: { key, action: "delivered" } }).then(() => { stop(); setMsg("Marked as delivered ✓ Thank you!"); }).catch((e) => setMsg(e.message));
  if (err) return <p className="center pad err">{err}</p>;
  if (!o) return <p className="center pad">Loading…</p>;
  const pts = [{ lat: o.store.lat, lng: o.store.lng, icon: "🏬", label: o.store.name }, { lat: o.dest_lat, lng: o.dest_lng, icon: "🏠", label: o.address }, ...(me ? [{ ...me, icon: "🚚", label: "You are here" }] : [])];
  return (<section className="narrow courier"><h2>Delivery #{o.number}</h2>
    <p><b>{o.name}</b> · <a className="link" href={`tel:${o.phone}`}>{o.phone}</a><br />{o.address}</p><p className="small dark">Status: <b>{o.status_label}</b></p>
    <MapView points={pts} height="min(55vh, 420px)" />
    {msg && <p role="status"><b>{msg}</b></p>}
    <div className="btnrow">{on ? <button className="outline" onClick={stop}>⏹ Stop sharing</button> : <button className="solid" onClick={start}>▶ Start sharing my live location</button>}<button className="solid" onClick={delivered}>✅ Mark delivered</button></div>
    <p className="small dark">Keep this page open and the screen on while delivering. Location is shared only while sharing is on.</p></section>);
}
