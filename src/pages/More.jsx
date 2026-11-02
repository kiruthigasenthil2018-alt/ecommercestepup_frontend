import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";

const BRANDS = ["Barbie", "Beckett", "Bluey", "Comfort Plus", "Comfy Steps", "Crocs", "Cushion Walk", "Disney Frozen", "Disney Stitch", "Divaz", "Dunlop", "EarthWorks", "Gabbys Dollhouse", "Heart", "Heavenly Feet", "Hobos", "Hush Puppies", "Jo & Joe", "JuJu", "Kickers", "Krush", "Lambretta", "Lilley", "LOL", "Lotus", "Lunar", "Marco Lozzi", "Marvel", "Maya Grace", "Original Penguin", "Osaga", "Paw Patrol", "Pokemon", "Red Fish", "Red Level", "Regatta", "Rieker", "Rocket Dog", "Skechers", "Soft Line", "Softlites", "Spider-Man", "Stone Creek", "Super Mario", "Totes Isotoner", "Trespass", "Truffle", "Trux", "Umbro", "Walkright", "Wednesday", "Wrangler", "XL"];

export function Brands() {
  const [have, setHave] = useState({});
  useEffect(() => { api("/products/", { auth: false }).then((l) => { const m = {}; l.forEach((p) => { if (p.brand) m[p.brand.toLowerCase()] = (m[p.brand.toLowerCase()] || 0) + 1; }); setHave(m); }).catch(() => {}); }, []);
  const groups = {}; BRANDS.forEach((b) => { (groups[b[0].toUpperCase()] ||= []).push(b); });
  return (<section className="narrow wide2"><h2 className="center">Shop by Brand</h2>
    <div className="brandgrid">{Object.entries(groups).map(([k, list]) => <div key={k}><h3>{k}</h3>{list.map((b) => have[b.toLowerCase()] ? <Link key={b} to={`/shop?brand=${encodeURIComponent(b)}`}>{b} <small>({have[b.toLowerCase()]})</small></Link> : <span key={b} className="soon" title="Coming soon">{b}</span>)}</div>)}</div>
    <p className="small dark center">Greyed brands are coming soon.</p></section>);
}

const OFFERS = [
  { img: "hero1.jpg", t: "Flat 50% Sale", d: "On kids shoes", to: "/shop/kids" },
  { img: "hero2.jpg", t: "Womens High Heels", d: "Flat 30% offer for your first order", to: "/shop/women?style=Heels" },
  { img: "hero3.jpg", t: "Men’s office shoes", d: "Only 40% discount today only", to: "/shop/men?style=Shoes" },
  { img: "hero4.jpg", t: "Red party heels", d: "For your first order get a free gift", to: "/shop/women?style=Heels" },
];
export function Offers() {
  return (<section className="narrow wide2"><h2 className="center">Offers</h2>
    <div className="promo">🎁 Get your first order with free gift &amp; 50 % offer 🎁</div>
    <p className="center small dark">Create an account and your very first order automatically gets 50% off (up to ₹1,500) plus a free gift.</p>
    <div className="offergrid">{OFFERS.map((o) => <Link key={o.t} to={o.to} className="offercard" style={{ backgroundImage: `url(/images/${o.img})` }}><span><b>{o.t}</b><br />{o.d}</span><em>Shop Now</em></Link>)}</div>
    <div className="center"><Link className="solid" to="/signup">Sign up &amp; claim first-order offer</Link></div></section>);
}

const POLICY = {
  "return-exchange": ["Return & Exchange Policy", ["Not happy with your shoes? Return or exchange them within 7 days of delivery, unworn and in the original box.", "Refunds go back to your original payment method within 5-7 working days. For Cash on Delivery orders we refund by bank transfer.", "Contact us on +91 98412 36547 (10 AM - 7 PM) to start a return."]],
  privacy: ["Privacy Policy", ["We collect only what we need to process your order: your name, email, phone and delivery address.", "Card details are never stored on our servers. Your data is never sold to third parties."]],
  terms: ["Terms of Service", ["By creating an account you agree to provide accurate information and to use StepUp.in lawfully.", "Prices are shown in INR (MRP) and may change without notice. Offers such as the first-order discount apply once per customer."]],
  shipping: ["Shipping Policy", ["Orders are dispatched within 24 hours from our Chennai store and usually arrive in 5-7 business days.", "Delivery is free across India. You can follow your parcel live on the map from the Track Order page."]],
  blogs: ["Blogs", ["Style guides, care tips and new arrivals are coming soon. Subscribe to our newsletter in the footer to be the first to know."]],
};
export function Policy() {
  const { slug } = useParams(); const p = POLICY[slug];
  if (!p) return <p className="center pad">Page not found. <Link to="/" className="link">Go home</Link></p>;
  return <section className="narrow"><h2>{p[0]}</h2>{p[1].map((t, i) => <p key={i} className="desc">{t}</p>)}</section>;
}
