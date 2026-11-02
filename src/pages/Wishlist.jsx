import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../context.jsx";
import { ProductCard } from "../components.jsx";

export default function Wishlist() {
  const { wish } = useApp(); const [items, setItems] = useState([]);
  useEffect(() => { if (!wish.length) { setItems([]); return; } api(`/products/?ids=${wish.join(",")}`, { auth: false }).then(setItems).catch(() => setItems([])); }, [wish.join(",")]);
  return (<section className="listing"><h2 className="center">Your Wishlist</h2>
    {!wish.length && <p className="center">Nothing saved yet. Tap ♡ on any shoe to save it. <Link to="/shop" className="link">Browse shoes</Link></p>}
    <div className="grid">{items.filter((p) => wish.includes(p.id)).map((p) => <ProductCard key={p.id} p={p} full />)}</div></section>);
}
