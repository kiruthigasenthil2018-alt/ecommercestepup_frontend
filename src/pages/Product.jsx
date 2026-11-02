import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, money } from "../api";
import { useApp } from "../context.jsx";
import { Stars, Swatch, Heart } from "../components.jsx";
import Reviews from "../Reviews.jsx";

export default function Product() {
  const { id } = useParams(); const nav = useNavigate(); const { addToCart, wish, toggleWish, user } = useApp();
  const [p, setP] = useState(null); const [size, setSize] = useState(null); const [color, setColor] = useState(null); const [qty, setQty] = useState(1); const [added, setAdded] = useState(false); const [err, setErr] = useState("");
  const load = (first) => api(`/products/${id}/`, { auth: false }).then((d) => { setP(d); if (first) { setSize(d.sizes[0]); setColor(d.colors[0]); } }).catch((e) => setErr(e.message));
  useEffect(() => { load(true); }, [id]);
  if (err) return <p className="center pad">Could not load this product ({err}). Make sure the backend is running at http://localhost:8000.</p>;
  if (!p) return <p className="center pad">Loading…</p>;
  const imgs = p.gallery?.length ? p.gallery : [p.image_url];
  const url = encodeURIComponent(window.location.href); const text = encodeURIComponent(`${p.brand} ${p.name} on StepUp.in`);
  const wishClick = () => (user ? toggleWish(p.id) : nav("/signup", { state: { from: "/wishlist", wishId: p.id } }));
  const add = () => { addToCart(p, size, color, qty); setAdded(true); setTimeout(() => setAdded(false), 1500); };
  return (<section className="pdp">
    <div className="gallery">{imgs.map((s, i) => <div key={i} className="imgbox"><img src={s} alt={`${p.name} view ${i + 1}`} /></div>)}</div>
    <div className="info">
      <h2>{p.brand || p.name} <Heart id={p.id} /></h2>{p.brand && <p>{p.name}</p>}<p>MRP{money(p.price).replace(" ", "")}</p>
      <p><Stars n={p.rating} /> {p.rating}/5 (<a className="link" href="#reviews">{p.reviews.length} reviews</a>)</p>
      <div className="row"><p>Color : {color}</p><div className="colors">{p.colors.map((c) => <Swatch key={c} c={c} on={c === color} onClick={() => setColor(c)} />)}</div></div>
      <div className="row"><p>Shoe Size</p><div className="sizes">{p.sizes.map((s) => <button key={s} className={s === size ? "on" : ""} onClick={() => setSize(s)}>{s}</button>)}</div></div>
      <div className="row"><p>Quantity</p><div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div></div>
      <button className="solid wide" onClick={add}>{added ? "Added ✓" : "Add to Cart"}</button>
      <button className="solid wide buynow" onClick={() => { addToCart(p, size, color, qty); nav("/checkout"); }}>Buy Now <span className="pay"><b>पे</b><b>G</b><b>P</b></span></button>
      <button className={"outline wide wishbtn" + (wish.includes(p.id) ? " on" : "")} onClick={wishClick}>{wish.includes(p.id) ? "♥ In your wishlist" : "♡ Add to Wishlist"}</button>
      <p className="share">Share: {[["WhatsApp", `https://wa.me/?text=${text}%20${url}`], ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${url}`], ["X", `https://twitter.com/intent/tweet?text=${text}&url=${url}`], ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${url}`]].map(([n, h]) => <a key={n} href={h} target="_blank" rel="noopener noreferrer">{n}</a>)}</p>
      <div className="secure"><p><b>Secure Checkout With</b></p><div className="logos">{["rupay", "mastercard", "visa"].map((l) => <img key={l} src={`/images/${l}.png`} alt={l} />)}</div></div>
      <a className="wa" href="https://wa.me/919841236547" target="_blank" rel="noreferrer">Unsure about your size? Let’s connect 💬</a>
      <div className="perks"><p><b>COD</b> Available</p><p><b>24</b> Hour Dispatch</p><p>7 Days <b>easy return & exchange</b></p></div>
      <h3>Product Details</h3><p className="desc">{p.description}</p>
    </div>
    <div className="reviewwrap"><Reviews product={p} onPosted={() => load(false)} /></div>
  </section>);
}
