import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "./api";
// Clear data saved by older versions of the site (stale cart/login data caused errors on reload)
const VERSION = "stepup-v4";
try { if (localStorage.getItem("stepup_version") !== VERSION) { ["cart", "wish", "user", "token"].forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); localStorage.setItem("stepup_version", VERSION); } } catch (e) { /* storage blocked */ }
const DEFAULT_SITE = {
  banners: [
    { id: 1, image: "/images/hero1.jpg", text: "Flat 50% Sale\nkids shoes", to: "/shop/kids", pos: "tl" },
    { id: 2, image: "/images/hero2.jpg", text: "Womens High Heels\nFlat 30% offer for your\nfirst order", to: "/shop/women?style=Heels", pos: "tr" },
    { id: 3, image: "/images/hero3.jpg", text: "Men’s wear high heel\noffice shoe only 40%\ndiscount today only", to: "/shop/men?style=Shoes", pos: "mr" },
    { id: 4, image: "/images/hero4.jpg", text: "Womens red color\nhigh heel for party\nfor your first order get a free gift", to: "/shop/women?style=Heels", pos: "bl" },
  ],
  overview: "Explore our curated selection of high-quality shoes for every occasion. From durable athletic shoes designed for peak performance to stylish casual sneakers and elegant dress shoes, we offer a diverse range of footwear to suit your needs. Our user friendly interface makes it easy to browse our collection and find the perfect pair, while detailed product descriptions and high-quality images ensure you make an informed decision. Join our community of style and discover your next favorite shoe!",
  promo: "Get your first order with free gift & 50 % offer",
  contact: { address: "No. 14, Anna Salai, Teynampet, Chennai, Tamil Nadu 600018, India.", orders_phone: "+91 98412 36547", queries_phone: "+91 98410 55782", landline: "044 2834 7619", whatsapp: "+91 98412 36547", email: "customercarestepup.in@gmail.com", hours: "10 AM - 7 PM", facebook: "https://www.facebook.com/", instagram: "https://www.instagram.com/", twitter: "https://x.com/", meta: "https://www.meta.com/" },
};
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
const load = (k, d, store = localStorage) => { try { return JSON.parse(store.getItem(k)) ?? d; } catch (e) { return d; } };
const key = (x) => `${x.id}|${x.size}|${x.color}`;

export function AppProvider({ children }) {
  const [user, setUser] = useState(load("user", null));
  const [cart, setCart] = useState(load("cart", []));
  const [wish, setWish] = useState(load("wish", []));
  const [checkout, setCheckoutState] = useState(load("checkout", null, sessionStorage));
  const [site, setSite] = useState(DEFAULT_SITE);
  const synced = useRef(false);
  useEffect(() => { // Home banners / text and Contact details are edited in the admin panel
    api("/site/", { auth: false }).then((s) => setSite((d) => ({ banners: s.banners?.length ? s.banners : d.banners, overview: s.overview || d.overview, promo: s.promo || d.promo, contact: { ...d.contact, ...(s.contact || {}) } }))).catch(() => {});
  }, []);
  useEffect(() => { localStorage.setItem("cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("wish", JSON.stringify(wish)); }, [wish]);
  const setCheckout = (v) => { setCheckoutState(v); sessionStorage.setItem("checkout", JSON.stringify(v)); };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setCart([]); setWish([]); setCheckout(null); synced.current = false; };
  const login = (d) => { localStorage.setItem("token", d.token); localStorage.setItem("user", JSON.stringify(d.user)); setUser(d.user); };

  // After login: merge this browser's cart/wishlist with the ones saved on the server
  useEffect(() => {
    if (!user) { return; }
    api("/state/").then((s) => {
      setCart((local) => { const m = new Map(); [...(s.cart || []), ...local].forEach((x) => m.set(key(x), x)); return [...m.values()]; });
      setWish((local) => [...new Set([...(s.wishlist || []), ...local])]);
      synced.current = true;
    }).catch((e) => { if (/token|credential|authenticat/i.test(e.message)) logout(); });
  }, [user?.email]);
  // Save changes back to the server (debounced)
  useEffect(() => {
    if (!user || !synced.current) { return; }
    const t = setTimeout(() => { api("/state/", { method: "PUT", body: { cart, wishlist: wish } }).catch(() => {}); }, 600);
    return () => { clearTimeout(t); };
  }, [cart, wish]);

  const updateUser = (patch) => { const n = { ...user, ...patch }; localStorage.setItem("user", JSON.stringify(n)); setUser(n); };
  const addToCart = (p, size, color, quantity = 1) => setCart((c) => {
    size = size ?? p.sizes[0]; color = color ?? p.colors[0];
    const i = c.findIndex((x) => x.id === p.id && x.size === size && x.color === color);
    if (i >= 0) return c.map((x, j) => (j === i ? { ...x, quantity: x.quantity + quantity } : x));
    return [...c, { id: p.id, name: `${p.brand} ${p.name}`.trim(), brand: p.brand, title: p.name, price: p.price, image: p.image_url, size, color, quantity, sizes: p.sizes }];
  });
  const updateCart = (i, patch) => setCart((c) => c.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const removeCart = (i) => setCart((c) => c.filter((_, j) => j !== i));
  const toggleWish = (id) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const addWish = (id) => setWish((w) => (w.includes(id) ? w : [...w, id]));
  const total = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  return <Ctx.Provider value={{ user, login, logout, cart, setCart, addToCart, updateCart, removeCart, total, wish, toggleWish, addWish, checkout, setCheckout, site, updateUser }}>{children}</Ctx.Provider>;
}
