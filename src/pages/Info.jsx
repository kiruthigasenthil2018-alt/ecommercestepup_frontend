import { useState } from "react";
import { api } from "../api";
import { useApp } from "../context.jsx";
import { Socials, tel, digits } from "../components.jsx";
import MapView, { STORE } from "../Map.jsx";

export function About() {
  return (<section className="about"><div className="atext"><h2>About StepUp</h2>
    <p>StepUp is India’s largest sports and athleisure footwear brand. Incorporated in 2006, StepUp Activewear is one of the leading players in organized sports & casual footwear sector in India. Since 2016, the flagship brand "StepUp", has been the largest sports and athleisure footwear brand in India, in both volume and value terms. The company’s products are available via an expansive Pan-India network of over 15,000 geo-tagged multi-brand retail stores, 35+ company-owned exclusive outlets, large format stores such as Walmart, Vishal Retail and Reliance Smart among others and all the leading e-commerce portals.</p>
    <h2>Our Mission</h2><p>At StepUp we craft shoes with care for everyone- men, women and kids, with an equal attention to detail, letting each shoe speak for itself. The world-class quality, trendy designs and affordable prices have captured the imagination of millions of people, across the country- making StepUp, an aspirational brand especially for - young adults, everyday performers and fashionistas.</p></div>
    <div className="blob" style={{ backgroundImage: "url(/images/about1.jpg)" }} />
    <div className="circle" style={{ backgroundImage: "url(/images/about2.jpg)" }} />
    <div className="three">{[["Simplicity In Design", "No flashy logos,No senseless details, Just the world’s most comfortable shoes,made naturally and designed practically,It’s that simple."], ["Confidance in Comfort", "Trying is believing.Give our shoes a shot for 30 days.and if you’re not walking on cloud nine,we’ll take them back-no questions asked."], ["Made from Nature", "The footwear industry often overlooks mother Nature’s materials in favor of cheaper,synthetic alternatives.We think it’s time to change that."]].map(([h, t]) => <div key={h}><h3>{h}</h3><p>{t}</p></div>)}</div></section>);
}

export function Contact() {
  const { site } = useApp(); const ct = site.contact;
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" }); const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const send = async (e) => { e.preventDefault(); try { await api("/enquiry/", { method: "POST", body: f, auth: false }); setMsg("Thanks, we’ll reply within one working day."); setF({ name: "", email: "", phone: "", message: "" }); } catch (er) { setMsg(er.message); } };
  return (<section className="contact"><div className="chead"><div><h2>Contact Us</h2><h3>For Online Orders</h3><p>Inquiry/Complaint<br /><a href={tel(ct.orders_phone)}>{ct.orders_phone}</a></p><p>Any other queries<br /><a href={tel(ct.queries_phone)}>{ct.queries_phone}</a><br /><a href={tel(ct.landline)}>{ct.landline}</a><br />{ct.hours}</p><p>Email: <a href={`mailto:${ct.email}`}>{ct.email}</a> · <a href={`https://wa.me/${digits(ct.whatsapp)}`} target="_blank" rel="noopener noreferrer">WhatsApp us</a></p><Socials ct={ct} dark /></div>
    <img src="/images/about2.jpg" alt="Shoes" /></div>
    <div className="storemap"><h3>Visit our Chennai store</h3><p className="small dark">{ct.address}</p><MapView points={[{ ...STORE, icon: "🏬", label: STORE.name }]} /></div>
    <form onSubmit={send}><h3>Enquiry Form</h3><label>Name<input required value={f.name} onChange={set("name")} /></label>
      <div className="two"><label>Email<input type="email" required value={f.email} onChange={set("email")} /></label><label>Phone<input value={f.phone} onChange={set("phone")} /></label></div>
      <label>Message<textarea required rows="5" value={f.message} onChange={set("message")} /></label>
      <button className="solid">Send</button>{msg && <p className="small dark">{msg}</p>}</form></section>);
}
