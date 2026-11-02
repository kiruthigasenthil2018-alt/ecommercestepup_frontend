import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../context.jsx";
import Avatar from "../Avatar.jsx";
import { Field, rules } from "../form.jsx";
import { Orders, Cart } from "./Orders.jsx";
import Wishlist from "./Wishlist.jsx";

const TABS = [["profile", "👤 My profile"], ["orders", "📦 Order history"], ["wishlist", "♡ Wishlist"], ["cart", "🛒 Cart"]];
const opt = (rule) => (v) => (v ? rule(v) : "");
const check = { name: rules.first_name, phone: opt(rules.phone), pincode: opt(rules.pincode) };

export default function Profile() {
  const { user, updateUser, wish, cart, logout } = useApp(); const [sp, setSp] = useSearchParams(); const nav = useNavigate();
  const tab = TABS.some(([k]) => k === sp.get("tab")) ? sp.get("tab") : "profile";
  const [f, setF] = useState({ name: user?.name || "", phone: "", address: "", city: "", state: "", pincode: "", avatar: user?.avatar || "male" });
  const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [orders, setOrders] = useState(0);
  useEffect(() => {
    api("/profile/").then((r) => setF((x) => ({ ...x, name: r.name || "", ...r.profile }))).catch(() => {});
    api("/orders/").then((o) => setOrders(o.length)).catch(() => {});
  }, []);
  const set = (k) => (e) => { const val = e.target.value; setF({ ...f, [k]: val }); if (errs[k]) setErrs({ ...errs, [k]: check[k] ? check[k](val) : "" }); setMsg(""); };
  const blur = (k) => () => { if (check[k]) setErrs((x) => ({ ...x, [k]: check[k](f[k]) })); };
  const save = async (e) => {
    e.preventDefault(); const e2 = {}; Object.keys(check).forEach((k) => { e2[k] = check[k](f[k]); }); setErrs(e2);
    if (Object.values(e2).some(Boolean)) return;
    setBusy(true); setErr(""); setMsg("");
    try { const r = await api("/profile/", { method: "PUT", body: f }); updateUser(r.user); setMsg("Profile saved ✓"); } catch (er) { setErr(er.message); }
    setBusy(false);
  };
  const items = cart.reduce((s, x) => s + x.quantity, 0);
  return (<section className="profile">
    <aside className="pside"><div className="pcard"><Avatar kind={f.avatar} size={96} /><h3>{f.name || user.name}</h3><p className="small dark">{user.email}</p>
      <p className="pstats"><b>{orders}</b> orders · <b>{wish.length}</b> wishlist · <b>{items}</b> in cart</p></div>
      <nav className="ptabs" aria-label="Account">{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setSp(k === "profile" ? {} : { tab: k })}>{l}</button>)}
        <button onClick={() => { logout(); nav("/"); }}>⏻ Log out</button></nav></aside>
    <div className="pmain">
      {tab === "profile" && <form onSubmit={save} noValidate className="pform"><h2>My profile</h2>
        <p className="small dark">Choose your avatar</p>
        <div className="avatars" role="radiogroup" aria-label="Avatar">{[["male", "Male"], ["female", "Female"]].map(([k, l]) => <button type="button" key={k} role="radio" aria-checked={f.avatar === k} className={f.avatar === k ? "on" : ""} onClick={() => { setF({ ...f, avatar: k }); setMsg(""); }}><Avatar kind={k} size={72} /><span>{l}</span></button>)}</div>
        <div className="two"><Field label="Full name" name="name" value={f.name} error={errs.name} onChange={set("name")} onBlur={blur("name")} autoComplete="name" />
          <Field label="Email id" name="email" value={user.email} readOnly disabled />
          <Field label="Phone number" name="phone" value={f.phone} error={errs.phone} onChange={set("phone")} onBlur={blur("phone")} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel" />
          <Field label="Pincode" name="pincode" value={f.pincode} error={errs.pincode} onChange={set("pincode")} onBlur={blur("pincode")} placeholder="6-digit code" inputMode="numeric" maxLength={6} /></div>
        <Field label="Address" name="address" value={f.address} onChange={set("address")} placeholder="Door no., street, area" autoComplete="street-address" />
        <div className="two"><Field label="City" name="city" value={f.city} onChange={set("city")} /><Field label="State" name="state" value={f.state} onChange={set("state")} /></div>
        {err && <p className="err" role="alert">{err}</p>}{msg && <p className="okmsg" role="status">{msg}</p>}
        <button className="solid" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></form>}
      {tab === "orders" && <Orders />}{tab === "wishlist" && <Wishlist />}{tab === "cart" && <Cart />}
    </div></section>);
}
