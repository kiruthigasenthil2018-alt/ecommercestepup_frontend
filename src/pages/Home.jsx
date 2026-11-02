import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ProductCard } from "../components.jsx";
import { useApp } from "../context.jsx";

export default function Home() {
  const { site } = useApp(); const slides = site.banners; const [i, setI] = useState(0); const [items, setItems] = useState([]); const [err, setErr] = useState(""); const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    api("/products/?trending=1", { auth: false }).then((l) => (l.length ? l : api("/products/", { auth: false }).then((a) => a.slice(0, 8))))
      .then((l) => { setItems(l); setLoaded(true); }).catch((e) => { setErr(e.message); setLoaded(true); });
  }, []);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % Math.max(slides.length, 1)), 4500); return () => { clearInterval(t); }; }, [slides.length]);
  return (<>
    <section className="carousel">
      {slides.map((s, n) => (<div key={s.id ?? n} className={"slide" + (n === i ? " on" : "")} style={{ backgroundImage: `url(${s.image})` }}>
        <p className={"badge " + s.pos}>{s.text}</p><Link className={"shopnow " + s.pos} to={s.to}>Shop Now</Link></div>))}
      <div className="dots">{slides.map((_, n) => <button key={n} aria-label={`Slide ${n + 1}`} className={n === i ? "on" : ""} onClick={() => setI(n)} />)}</div>
    </section>
    <section className="center"><h2>Overview</h2>
      <p className="overview">{site.overview}</p></section>
    <section className="center"><h2>What are you looking for?</h2>
      <div className="cats">{[["men", "Mens"], ["women", "Womens"], ["kids", "Kids"]].map(([g, l]) => <Link key={g} to={`/shop/${g}`}><img src={`/images/${g}.png`} alt={l} /><h3>{l}</h3></Link>)}</div></section>
    <section className="center"><h2>New & Trending</h2>
      {err && <p className="err center">Could not load products: {err}</p>}
      {loaded && !err && !items.length && <p className="center">No shoes yet. Add products in the admin panel (Shop → Products).</p>}
      <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      <div className="right"><Link className="solid" to="/shop">View all</Link></div></section>
    <div className="promo"><span>🎁</span> {site.promo} <span>🎁</span></div>
  </>);
}
