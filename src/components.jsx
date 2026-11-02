import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useApp } from "./context.jsx";
import { api, money } from "./api";
import Avatar from "./Avatar.jsx";

export function Stars({ n }) { const r = Math.min(5, Math.max(0, Math.round(Number(n) || 0))); return <span className="stars" aria-label={`${r} of 5`}>{"★".repeat(r)}<i>{"★".repeat(5 - r)}</i></span>; }
export function Heart({ id }) {
  const { wish, toggleWish, user } = useApp(); const nav = useNavigate(); const on = wish.includes(id);
  const click = (e) => { e.preventDefault(); e.stopPropagation(); if (!user) { nav("/signup", { state: { from: "/wishlist", wishId: id } }); return; } toggleWish(id); };
  return <button type="button" className={"heart" + (on ? " on" : "")} aria-pressed={on} aria-label={on ? "Remove from wishlist" : "Add to wishlist"} onClick={click}>{on ? "♥" : "♡"}</button>;
}
export const tel = (s) => `tel:${(s || "").replace(/[^\d+]/g, "")}`;
export const digits = (s) => (s || "").replace(/\D/g, "");
export function Socials({ ct, dark }) {
  const items = [["Facebook", "f", ct.facebook], ["Instagram", "◎", ct.instagram], ["X (Twitter)", "t", ct.twitter], ["Meta", "∞", ct.meta]];
  return <div className={"social" + (dark ? " dark" : "")}>{items.filter(([, , u]) => u).map(([n, g, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" aria-label={n} title={n}>{g}</a>)}</div>;
}
export const COLORS = { black: "#000", brown: "#7b5656", white: "#fff", blue: "#1f4e8c", red: "#e82020", grey: "#c4c4c4", pink: "#e8a6c0", purple: "#8e3ce0", tan: "#c4915c", multi: "#b6a0e0", orange: "#f08a24", green: "#2e8b57", yellow: "#f2c12e" };
export const Swatch = ({ c, on, onClick }) => <button type="button" aria-label={c} className={"swatch" + (on ? " on" : "")} style={{ background: COLORS[c] || c }} onClick={onClick} />;

export function Header() {
  const { user, logout, cart, wish } = useApp(); const nav = useNavigate(); const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const count = cart.reduce((s, x) => s + x.quantity, 0);
  return (<header>
    <div className="topbar">
      <Link to="/"><img className="logo" src="/images/logo.jpg" alt="StepUp logo" /></Link>
      <form className="search" onSubmit={(e) => { e.preventDefault(); nav(`/shop?q=${encodeURIComponent(q)}`); }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search here" aria-label="Search" />
      </form>
      <nav className="toplinks">
        <NavLink to="/" end>Home</NavLink><NavLink to="/about">About Us</NavLink><NavLink to="/contact">Contact Us</NavLink>
        {user ? <div className="has-menu usermenu"><NavLink to="/profile" className="uavatar"><Avatar kind={user.avatar} size={30} /><span>{user.name || "Account"}</span></NavLink>
          <div className="mega right"><Link to="/profile">My profile</Link><Link to="/profile?tab=orders">Order history</Link><Link to="/profile?tab=wishlist">Wishlist</Link><Link to="/profile?tab=cart">Cart</Link><a href="#out" onClick={(e) => { e.preventDefault(); logout(); nav("/"); }}>Log out</a></div></div> : <NavLink to="/login">Log in</NavLink>}
        <NavLink to="/wishlist" className="cartlink">♡ Wishlist{wish.length > 0 && <b>{wish.length}</b>}</NavLink>
        <NavLink to="/cart" className="cartlink">Cart 🛒{count > 0 && <b>{count}</b>}</NavLink>
        {user?.is_admin && <a href={(import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace("/api", "") + "/admin/"} target="_blank" rel="noreferrer">Admin</a>}
      </nav>
    </div>
    <div className="brandrow">
      <button className="back" onClick={() => nav(-1)}>← Back</button>
      <Link to="/" className="brand">StepUp.in</Link>
      <nav className="catnav">
        {[["women", "Womens", ["Sandals", "Heels", "Shoes", "Trainers", "Canvas", "Boots", "Slippers"]], ["men", "Mens", ["Sandals", "Shoes", "Trainers", "Canvas", "Boots", "Slippers"]], ["kids", "Kids", ["Sandals", "Canvas", "Trainers", "Boots", "Slippers"]]].map(([g, label, styles]) => (
          <div key={g} className="has-menu"><NavLink to={`/shop/${g}`}>{label}</NavLink>
            <div className="mega"><Link to={`/shop/${g}`}>View all</Link>{styles.map((s) => <Link key={s} to={`/shop/${g}?style=${s}`}>{s}</Link>)}</div></div>))}
        <NavLink to="/brands">Brands</NavLink><NavLink to="/offers">Offers</NavLink>
      </nav>
    </div>
  </header>);
}

export function ProductCard({ p, full }) {
  const { addToCart } = useApp(); const nav = useNavigate();
  const [color, setColor] = useState(p.colors?.[0]); const [ok, setOk] = useState(false);
  const add = () => { addToCart(p, null, color); setOk(true); setTimeout(() => setOk(false), 1400); };
  const title = p.brand ? <><b>{p.brand}</b><span>{p.name}</span></> : <b>{p.name}</b>;
  return (<article className="card"><Heart id={p.id} />
    <Link to={`/product/${p.id}`} className="imgbox"><img src={p.image_url} alt={p.name} loading="lazy" /></Link>
    {full ? (<div className="cardbody">
      <Link to={`/product/${p.id}`} className="ctitle">{title}</Link><Stars n={p.rating} />
      <p className="mrp">MRP{money(p.price).replace(" ", "")}</p>
      <div className="colors">Color {p.colors.length > 1 ? p.colors.map((c) => <Swatch key={c} c={c} on={c === color} onClick={() => setColor(c)} />) : <span className="mc">{p.colors[0] === "multi" ? "Multi-color" : <Swatch c={p.colors[0]} on />}</span>}</div>
      <div className="btns"><button className="outline" onClick={() => { addToCart(p, null, color); nav("/checkout"); }}>Buy</button><button className="solid sm" onClick={add}>{ok ? "Added ✓" : "Add to Cart"}</button></div>
    </div>) : <><Link to={`/product/${p.id}`} className="ctext">{p.name}<br />MRP : {money(p.price)}</Link><button className="solid sm quick" onClick={add}>{ok ? "Added ✓" : "Add to Cart"}</button></>}
  </article>);
}

export function Footer() {
  const { site } = useApp(); const ct = site.contact;
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState("");
  const sub = async (e) => { e.preventDefault(); try { await api("/subscribe/", { method: "POST", body: { email }, auth: false }); setMsg("Thanks for subscribing!"); setEmail(""); } catch (er) { setMsg(er.message); } };
  return (<footer><div className="fgrid">
    <div><h4>Contact Us</h4><p className="small">We’d love to hear from you!<br />Landline : <a href={tel(ct.landline)}>{ct.landline}</a><br />WhatsApp : <a href={`https://wa.me/${digits(ct.whatsapp)}`} target="_blank" rel="noopener noreferrer">{ct.whatsapp}</a><br />Email : <a href={`mailto:${ct.email}`}>{ct.email}</a><br />Address : <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(ct.address)}`} target="_blank" rel="noopener noreferrer">{ct.address}</a></p></div>
    <div><h4>Shop</h4><ul><li><Link to="/shop?sort=new">New in</Link></li><li><Link to="/shop/women">Women</Link></li><li><Link to="/shop/men">Men</Link></li><li><Link to="/brands">Brands</Link></li><li><Link to="/shop?q=heel">Heels</Link></li><li><Link to="/about">About us</Link></li></ul></div>
    <div><h4>Info</h4><ul><li><Link to="/shop">Search</Link></li><li><Link to="/policy/return-exchange">Return & Exchange Policy</Link></li><li><Link to="/policy/privacy">Privacy Policy</Link></li><li><Link to="/policy/terms">Terms of Service</Link></li><li><Link to="/policy/shipping">Shipping Policy</Link></li><li><Link to="/policy/blogs">Blogs</Link></li><li><a href={(import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace("/api", "") + "/admin/"} target="_blank" rel="noreferrer">Admin Login</a></li></ul></div>
    <div><h4>Social Media</h4><Socials ct={ct} /></div>
    <form onSubmit={sub}><h4>Lets stay in touch !</h4><p className="small">Sign up for exclusive offers, original stories, events and more.</p>
      <label className="small" htmlFor="fe">Email id</label><input id="fe" type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="white">Subscribe</button>{msg && <p className="small">{msg}</p>}</form>
  </div></footer>);
}
