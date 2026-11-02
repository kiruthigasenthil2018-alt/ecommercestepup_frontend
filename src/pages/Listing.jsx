import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { ProductCard, COLORS, Swatch } from "../components.jsx";

const OPTS = {
  style: ["Sandals", "Trainers", "Boots", "Slippers", "Canvas", "Shoes", "Heels"],
  size: ["3", "4", "5", "6", "7", "41", "42", "43", "44", "45"],
  brand: ["Comfy Steps", "Lunar", "Lilley", "Softlites", "Walkright", "Urban Territory", "Osaga", "Truffle", "Beckett", "XL"],
};
export default function Listing() {
  const { gender } = useParams(); const [sp] = useSearchParams();
  const [items, setItems] = useState([]); const [err, setErr] = useState(""); const [open, setOpen] = useState(false); const [dd, setDd] = useState(null);
  const csv = (s) => (s ? s.split(",") : []); const [f, setF] = useState({ style: csv(sp.get("style")), size: [], brand: csv(sp.get("brand")), color: [] }); const [sort, setSort] = useState(sp.get("sort") || ""); const [sortOpen, setSortOpen] = useState(false);
  const q = sp.get("q") || "";
  useEffect(() => { setF({ style: csv(sp.get("style")), size: [], brand: csv(sp.get("brand")), color: [] }); setSort(sp.get("sort") || ""); }, [sp.toString()]);
  useEffect(() => {
    const p = new URLSearchParams(); if (gender) p.set("gender", gender); if (q) p.set("q", q);
    Object.entries(f).forEach(([k, v]) => v.length && p.set(k, v.join(","))); if (sort) p.set("sort", sort);
    api(`/products/?${p}`, { auth: false }).then((l) => { setItems(l); setErr(""); }).catch((e) => { setItems([]); setErr(e.message); });
  }, [gender, q, f, sort]);
  const toggle = (k, v) => setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const SORTS = [["", "Featured"], ["new", "New Arrivals"], ["low", "Price:Low-High"], ["high", "Price:High-Low"], ["rating", "Overall Rating"]];
  return (<section className="listing">
    <div className="toolbar">
      <div className={"filters" + (open ? " open" : "")}>
        <button className="ftitle" onClick={() => setOpen(!open)}>Filters {open ? "←" : "→"}</button>
        {open && ["style", "size", "brand", "color"].map((k) => (<div key={k} className="dd">
          <button onClick={() => setDd(dd === k ? null : k)}>{k[0].toUpperCase() + k.slice(1)} <i>▾</i></button>
          {dd === k && <div className="menu">{k === "color" ? <div className="swgrid">{Object.keys(COLORS).filter((c) => c !== "multi").map((c) => <Swatch key={c} c={c} on={f.color.includes(c)} onClick={() => toggle("color", c)} />)}</div>
            : OPTS[k].map((o) => <label key={o}><input type="checkbox" checked={f[k].includes(o)} onChange={() => toggle(k, o)} /> {k === "size" ? `UK(${o})` : o}</label>)}</div>}
        </div>))}
      </div>
      <div className="dd sortdd"><button className="solid gray" onClick={() => setSortOpen(!sortOpen)}>Sort by</button>
        {sortOpen && <div className="menu right">{SORTS.map(([v, l]) => <button key={v} onClick={() => { setSort(v); setSortOpen(false); }}>{l}</button>)}</div>}</div>
    </div>
    {q && <p className="small dark">Results for “{q}”</p>}
    <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} full />)}</div>
    {err ? <p className="err center">Could not load products: {err}</p> : !items.length && <p className="center">No shoes match these filters. Clear a filter to see more.</p>}
  </section>);
}
