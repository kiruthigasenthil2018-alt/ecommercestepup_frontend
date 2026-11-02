import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, money, downloadInvoice } from "../api";
import { useApp } from "../context.jsx";
import MapView from "../Map.jsx";


export function Cart() {
  const { cart, updateCart, removeCart, total, user } = useApp(); const nav = useNavigate();
  return (<section className="narrow"><h2 className="center">Your Cart</h2>
    <p className="notice"><b>Free & Fast arriving by Monday</b> Order within 23 hours,53 minutes,50 seconds</p>
    {!cart.length && <p className="center">Your cart is empty. <Link to="/shop" className="link">Continue Shopping</Link></p>}
    {cart.map((x, i) => (<div key={i} className="citem"><img src={x.image} alt={x.name} />
      <div><h4>{x.brand || x.title}</h4>{x.brand && <p>{x.title}</p>}<p>MRP{money(x.price).replace(" ", "")}</p></div>
      <div className="sel"><select value={x.size} onChange={(e) => updateCart(i, { size: +e.target.value })} aria-label="Size">{x.sizes.map((s) => <option key={s} value={s}>Size ({s})</option>)}</select>
        <select value={x.quantity} onChange={(e) => updateCart(i, { quantity: +e.target.value })} aria-label="Quantity">{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Quantity ({n})</option>)}</select></div>
      <button className="linkbtn" onClick={() => removeCart(i)}>Remove 🗑</button></div>))}
    {cart.length > 0 && <><div className="summary"><p>Summary</p><p><span>Total</span><span>{money(total)}</span></p><p><span>Delivery</span><span>Free</span></p></div>
      <button className="solid wide" onClick={() => nav("/checkout")}>🔒 Checkout Securely</button>
      <p><b>Express Checkout</b></p>{[["G Pay", "gpay"], ["PayPal", "paypal"], ["clearpay", "clearpay"], ["Klarna", "klarna"]].map(([l, im]) => <button key={l} className="expr" onClick={() => nav("/checkout")}>{im === "gpay" ? <b>G Pay</b> : <img src={`/images/${im}.png`} alt={l} />}</button>)}
      <p className="center"><Link to="/shop" className="link">Continue Shopping</Link></p></>}
  </section>);
}

export function Orders() {
  const [list, setList] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("/orders/").then(setList).catch((e) => { setList([]); setErr(e.message); }); }, []);
  const dl = (n) => downloadInvoice(n).catch((e) => setErr(e.message));
  return (<section className="narrow"><h2 className="center">Your Orders</h2>{err && <p className="err center">{err}</p>}
    {list && !list.length && <p className="center">No orders yet. <Link className="link" to="/shop">Start shopping</Link></p>}
    {(list || []).map((o) => <div key={o.id} className="oitem"><div><b>#{o.number}</b><br /><span className="small">{o.items.map((i) => i.name).join(", ")}</span></div>
      <div><b>{money(o.total)}</b><br /><span className="small">{o.status_label} · {o.payment_status_label}</span></div>
      <div className="oact"><Link className="outline sm" to={`/orders/${o.number}`}>Track</Link><button className="solid sm" onClick={() => dl(o.number)}>Bill PDF</button></div></div>)}</section>);
}

export function TrackOrder() {
  const { number } = useParams(); const [o, setO] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { const go = () => api(`/orders/${number}/`).then(setO).catch((e) => setErr(e.message)); go(); const t = setInterval(go, 15000); return () => { clearInterval(t); }; }, [number]);
  if (err && !o) return <p className="center pad">Could not load this order ({err}). <Link className="link" to="/orders">Back to orders</Link></p>;
  if (!o) return <p className="center pad">Loading…</p>;
  const stages = ["confirmed", "shipped", "out_for_delivery", "delivered"], at = stages.indexOf(o.status), s = o.store, c = o.courier;
  const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "");
  const info = [["🛒", "Order Confirmed", fmt(o.created)], ["📦", "Shipped", fmt(o.dispatched_at)], ["🚚", "Out for Delivery", fmt(o.out_for_delivery_at) || `Chennai → ${o.city}`], ["🏠", "Delivered", fmt(o.delivered_at)]];
  const pts = [{ lat: s.lat, lng: s.lng, icon: "🏬", label: `${s.name}<br>${s.address}` }, { lat: o.dest_lat, lng: o.dest_lng, icon: "🏠", label: `Delivery: ${o.address}, ${o.city}` }, ...(c ? [{ lat: c.lat, lng: c.lng, icon: "🚚", label: `Your parcel (${o.status_label})` }] : [])];
  const lines = [{ pts: [[s.lat, s.lng], [o.dest_lat, o.dest_lng]], dash: true }, ...(c ? [{ pts: [[s.lat, s.lng], [c.lat, c.lng]] }] : [])];
  const dl = () => downloadInvoice(o.number).catch((e) => setErr(e.message));
  return (<section className="track"><div className="thead"><div><h2><Link to="/orders">‹</Link> Track your order</h2>
      <p className="small dark">Order #{o.number} · {o.payment_label} · <b>{money(o.total)}</b>{o.discount > 0 && <> (saved {money(o.discount)})</>}</p></div>
      <div className="tact"><span className={"pill " + o.status}>{o.status_label}</span><button className="solid sm" onClick={dl}>⬇ Download Bill (PDF)</button></div></div>
    {err && <p className="err">{err}</p>}
    {o.status === "cancelled" ? <p className="err">This order was cancelled.</p> : (<div className="tgrid">
      <div className="tleft"><div className="steps">{info.map(([ic, t, d], k) => <div key={k} className={"step" + (k <= at ? " done" : "")}><span className="ic">{ic}</span><div><h4>{t}</h4><p>{k <= at ? d || "Done" : "Pending"}</p></div></div>)}</div>
        <div className="tbox"><h4>Items</h4>{o.items.map((i, k) => <p key={k}><b>{i.name}</b> · Size {i.size} × {i.quantity}</p>)}{o.gift && <p className="small">🎁 Free gift included</p>}
          <p className="small dark">Delivering to {o.first_name} {o.last_name}, {o.address}, {o.city} {o.pincode}</p>
          {o.expected_delivery && <p className="small"><b>Expected delivery:</b> {new Date(o.expected_delivery).toDateString()}</p>}</div></div>
      <div className="tmap"><p className="small dark">● Live tracking · updates every 15 seconds</p><MapView points={pts} lines={lines} height="min(64vh, 540px)" /></div></div>)}</section>);
}
