import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { api, money, downloadInvoice } from "../api";
import { useApp } from "../context.jsx";
import { Field, validate, hasErrors, rules, formatCard, formatExpiry } from "../form.jsx";
import { LocationPicker } from "../Map.jsx";

const STEPS = ["Cart", "Details", "Payment", "Done"];
const Steps = ({ at }) => <ol className="stepbar">{STEPS.map((s, i) => <li key={s} className={i <= at ? "on" : ""}><b>{i + 1}</b> {s}</li>)}</ol>;

function Summary({ cart, total, discount = 0, gift }) {
  return (<aside><h3>Order Summary</h3>
    {cart.map((x, i) => <div key={i} className="oi"><img src={x.image} alt="" /><div><b>{x.brand || x.title}</b><p>{x.brand ? x.title : ""}</p><p>Size {x.size}</p><p>Quantity {x.quantity}</p><p>MRP {money(x.price)}</p></div></div>)}
    <hr /><p><span>Amount</span><span>{money(total)}</span></p>
    {discount > 0 && <p><span>First order 50% off</span><span>− {money(discount)}</span></p>}
    {gift && <p><span>🎁 Free gift</span><span>{gift}</span></p>}
    <p><span>Delivery fees</span><span>Free</span></p><hr /><p><b>Total</b><b>{money(total - discount)}</b></p></aside>);
}

export function Checkout() {
  const { cart, total, user, checkout, setCheckout } = useApp(); const nav = useNavigate();
  const [v, setV] = useState({ first_name: "", last_name: "", email: user?.email || "", phone: "", address: "", city: "Chennai", state: "Tamil Nadu", pincode: "", landmark: "", ...(checkout || {}) });
  const [errs, setErrs] = useState({});
  const [pin, setPin] = useState(checkout?.dest_lat ? { lat: checkout.dest_lat, lng: checkout.dest_lng } : null);
  const [pinned, setPinned] = useState(!!checkout?.dest_lat); const [pinMsg, setPinMsg] = useState("");
  useEffect(() => { // centre the map on the pincode / city until the customer places their own pin
    if (pinned) { return; }
    if (!/^[1-9]\d{5}$/.test(v.pincode) && v.city.trim().length < 3) { return; }
    const t = setTimeout(() => {
      api(`/geocode/?pincode=${v.pincode}&city=${encodeURIComponent(v.city)}&state=${encodeURIComponent(v.state)}`, { auth: false })
        .then((r) => { setPin({ lat: r.lat, lng: r.lng }); setPinMsg(r.source === "unknown" || r.source === "state" ? "We could not find this exact area. Please click the map to place your pin." : "Map centred on your area. Drag the pin to your exact door."); }).catch(() => {});
    }, 700);
    return () => { clearTimeout(t); };
  }, [v.pincode, v.city, v.state, pinned]);
  const onPick = (p) => { setPin(p); setPinned(true); setPinMsg("Pin placed ✓ Your parcel will be tracked to this spot."); };
  const locateMe = () => {
    if (!navigator.geolocation) { setPinMsg("This browser has no location support. Click the map instead."); return; }
    setPinMsg("Finding your location…");
    navigator.geolocation.getCurrentPosition((p) => onPick({ lat: p.coords.latitude, lng: p.coords.longitude }), () => setPinMsg("Location permission denied. Click the map to place your pin."), { enableHighAccuracy: true, timeout: 10000 });
  };
  const keys = ["first_name", "last_name", "email", "phone", "address", "city", "state", "pincode"];
  const set = (k) => (e) => { const val = e.target.value; setV({ ...v, [k]: val }); if (errs[k]) setErrs({ ...errs, [k]: rules[k] ? rules[k](val, v) : "" }); };
  const blur = (k) => () => setErrs((x) => ({ ...x, [k]: rules[k] ? rules[k](v[k], v) : "" }));
  const P = (k, label, ph, extra = {}) => <Field label={label} name={k} placeholder={ph} value={v[k]} error={errs[k]} onChange={set(k)} onBlur={blur(k)} {...extra} />;
  if (!cart.length) return <p className="center pad">Your cart is empty. <Link to="/shop" className="link">Continue Shopping</Link></p>;
  const submit = (e) => { e.preventDefault(); const e2 = validate(v, keys); setErrs(e2); if (hasErrors(e2)) return; setCheckout({ ...v, dest_lat: pin?.lat ?? null, dest_lng: pin?.lng ?? null }); nav("/payment"); };
  return (<section className="checkout"><Steps at={1} /><h2 className="center">Checkout</h2>
    <div className="cwrap"><Summary cart={cart} total={total} />
      <form onSubmit={submit} noValidate><h3>Complete Your Order</h3><h4>Personal Details</h4>
        <div className="two">{P("first_name", "First Name", "Enter your first name", { autoComplete: "given-name" })}{P("last_name", "Last Name", "Enter your last name", { autoComplete: "family-name" })}
          {P("email", "Email id", "Enter your email", { type: "email", autoComplete: "email" })}{P("phone", "Phone Number", "10-digit mobile number", { type: "tel", inputMode: "numeric", autoComplete: "tel" })}</div>
        <h4>Shipping Address</h4>{P("address", "Address Line 1", "Door no., street, area", { autoComplete: "street-address" })}
        <div className="two">{P("city", "City", "Your city")}{P("state", "State", "Your state")}{P("landmark", "Landmark (optional)", "Any landmark (famous place/mall)")}{P("pincode", "Pincode", "6-digit code", { inputMode: "numeric", maxLength: 6 })}</div>
        <h4>Delivery location on the map</h4>
        <p className="small dark">Place the pin on your exact delivery spot so your live tracking map ends at the right place. Click the map, drag the pin, or use your current location.</p>
        <button type="button" className="outline sm" onClick={locateMe}>📍 Use my current location</button>
        <LocationPicker value={pin} onChange={onPick} height={280} />{pinMsg && <p className="small dark" role="status">{pinMsg}</p>}
        <div className="two btnrow"><Link to="/cart" className="gray cancel">Back to cart</Link><button className="solid">Continue to Payment</button></div></form></div></section>);
}

export function Payment() {
  const { cart, total, checkout, setCart, setCheckout } = useApp(); const nav = useNavigate();
  const [offer, setOffer] = useState(null); const [method, setMethod] = useState("card");
  const [c, setC] = useState({ card_name: "", card_number: "", expiry: "", cvv: "", upi: "", bank: "" });
  const [errs, setErrs] = useState({}); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { api("/offer/").then(setOffer).catch(() => setOffer({ first_order: false })); }, []);
  if (!cart.length) return <Navigate to="/cart" replace />;
  if (!checkout) return <Navigate to="/checkout" replace />;
  const first = !!offer?.first_order; const discount = first ? Math.min(Math.floor((total * offer.percent) / 100), offer.cap) : 0; const payable = total - discount;
  const set = (k, fmt) => (e) => { const val = fmt ? fmt(e.target.value) : e.target.value; setC({ ...c, [k]: val }); if (errs[k]) setErrs({ ...errs, [k]: rules[k](val, c) }); };
  const blur = (k) => () => setErrs((x) => ({ ...x, [k]: rules[k](c[k], c) }));
  const pick = (m) => { setMethod(m); setErrs({}); setErr(""); };
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (method === "cod" && payable > 50000) return setErr("Cash on Delivery is available only for orders up to ₹50,000.");
    const keys = method === "card" ? ["card_name", "card_number", "expiry", "cvv"] : method === "upi" ? ["upi"] : method === "netbanking" ? ["bank"] : [];
    const e2 = validate(c, keys); setErrs(e2); if (hasErrors(e2)) return;
    setBusy(true);
    try {
      const o = await api("/orders/", { method: "POST", body: { ...checkout, payment: method, card_last4: method === "card" ? c.card_number.replace(/\D/g, "").slice(-4) : "", items: cart.map((x) => ({ product: x.id, size: x.size, color: x.color, quantity: x.quantity })) } });
      setCart([]); setCheckout(null); nav(`/success/${o.number}`, { replace: true });
    } catch (er) { setErr(er.message); setBusy(false); }
  };
  return (<section className="checkout"><Steps at={2} /><h2 className="center">Payment Method</h2>
    <div className="cwrap"><Summary cart={cart} total={total} discount={discount} gift={first ? offer.gift : ""} />
      <form onSubmit={submit} noValidate>
        {first && <div className="offerbox">🎁 <b>First order offer applied!</b> {offer.percent}% OFF (up to {money(offer.cap)}) + a free {offer.gift}. You save <b>{money(discount)}</b>.</div>}
        <h3>Choose how you’d like to pay</h3>
        <div className="toggle" role="tablist" aria-label="Payment method">{[["card", "💳 Card"], ["upi", "📱 UPI"], ["netbanking", "🏦 Net Banking"], ["cod", "💵 Cash on Delivery"]].map(([m, l]) => <button key={m} type="button" role="tab" aria-selected={method === m} className={method === m ? "on" : ""} onClick={() => pick(m)}>{l}</button>)}</div>
        {method === "card" && <div className="paybox"><div className="logos">{["visa", "mastercard", "rupay"].map((l) => <img key={l} src={`/images/${l}.png`} alt={l} />)}</div>
          <Field label="Card Holder Name" name="card_name" autoComplete="cc-name" placeholder="Name on card" value={c.card_name} error={errs.card_name} onChange={set("card_name")} onBlur={blur("card_name")} />
          <Field label="Card Number" name="card_number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={c.card_number} error={errs.card_number} onChange={set("card_number", formatCard)} onBlur={blur("card_number")} />
          <div className="two"><Field label="Expiration Date" name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} value={c.expiry} error={errs.expiry} onChange={set("expiry", formatExpiry)} onBlur={blur("expiry")} />
            <Field label="CVV" name="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="Example: 4339" maxLength={4} value={c.cvv} error={errs.cvv} onChange={set("cvv", (x) => x.replace(/\D/g, ""))} onBlur={blur("cvv")} /></div>
          <p className="small dark">🔒 Demo checkout: card details are validated here but never stored. Connect a gateway such as Razorpay for real payments.</p></div>}
        {method === "upi" && <div className="paybox"><div className="logos">{["PhonePe", "GPay", "Paytm"].map((l) => <b key={l} className="chip">{l}</b>)}</div>
          <Field label="UPI ID" name="upi" placeholder="yourname@okhdfc" value={c.upi} error={errs.upi} onChange={set("upi")} onBlur={blur("upi")} /></div>}
        {method === "netbanking" && <div className="paybox"><div className="fld"><label htmlFor="bank">Select your bank</label>
          <select id="bank" value={c.bank} aria-invalid={!!errs.bank} onChange={set("bank")} onBlur={blur("bank")}><option value="">Choose a bank…</option>{["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Indian Bank", "Canara Bank", "Kotak Mahindra Bank"].map((b) => <option key={b}>{b}</option>)}</select>
          {errs.bank && <span className="ferr" role="alert">{errs.bank}</span>}</div><p className="small dark">You will be redirected to your bank in a real checkout. This demo marks the payment as simulated.</p></div>}
        {method === "cod" && <div className="paybox"><p>Pay <b>{money(payable)}</b> in cash when your order arrives. COD is available for orders up to ₹50,000.</p></div>}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="two btnrow"><Link to="/checkout" className="gray cancel">Back</Link><button className="solid" disabled={busy}>{busy ? "Placing order…" : `Order Now · ${money(payable)}`}</button></div></form></div></section>);
}

export function Success() {
  const { number } = useParams(); const [o, setO] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api(`/orders/${number}/`).then(setO).catch(() => {}); }, [number]);
  const dl = () => downloadInvoice(number).catch((e) => setErr(e.message));
  return (<><Steps at={3} /><section className="thanks"><div className="tick">✓</div><h2>Thankyou for your ordering</h2>
    <p>We’ve received your order, it will ship in 5-7 business days.<br />Your order number is <b>#{number}</b></p>
    {o && <p className="small dark">Total: {money(o.total)} · {o.payment_label}{o.discount > 0 && <> · you saved {money(o.discount)} with the first-order offer</>}{o.gift && <><br />🎁 Your free gift will arrive in the same parcel!</>}</p>}
    {err && <p className="err">{err}</p>}
    <div className="btnrow"><button className="outline" onClick={dl}>⬇ Download Bill (PDF)</button><Link className="solid" to={`/orders/${number}`}>Track Order</Link></div>
    <p><Link to="/orders" className="link">View all orders</Link> · <Link to="/shop" className="link">Continue shopping</Link></p></section></>);
}
