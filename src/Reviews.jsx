import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "./api";
import { useApp } from "./context.jsx";
import { Stars } from "./components.jsx";

const check = { title: (v) => (v.trim().length >= 3 ? "" : "Title must be at least 3 characters."), body: (v) => (v.trim().length >= 10 ? "" : "Please write at least 10 characters.") };

export default function Reviews({ product, onPosted }) {
  const { user } = useApp(); const loc = useLocation(); const list = product.reviews || [];
  const [f, setF] = useState({ title: "", rating: 5, body: "" }); const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const avg = list.length ? (list.reduce((s, r) => s + (r.rating || 5), 0) / list.length).toFixed(1) : null;
  const set = (k) => (e) => { const val = e.target.value; setF({ ...f, [k]: val }); if (errs[k]) setErrs({ ...errs, [k]: check[k](val) }); setMsg(""); };
  const submit = async (e) => {
    e.preventDefault(); const e2 = { title: check.title(f.title), body: check.body(f.body) }; setErrs(e2); if (e2.title || e2.body) return;
    setBusy(true); setErr(""); setMsg("");
    try { await api(`/products/${product.id}/reviews/`, { method: "POST", body: { ...f, rating: Number(f.rating) } }); setMsg("Thank you! Your review has been posted."); setF({ title: "", rating: 5, body: "" }); onPosted(); } catch (er) { setErr(er.message); }
    setBusy(false);
  };
  return (<section className="reviews" id="reviews"><h2>Comments &amp; Reviews</h2>
    {avg && <p className="ravg"><Stars n={avg} /> <b>{avg}</b> out of 5 · {list.length} review{list.length > 1 ? "s" : ""}</p>}
    {!list.length && <p>No reviews yet. Be the first to review this product.</p>}
    {list.map((r) => (<article className="rcard" key={r.id}>
      <div className="rhead"><b>{r.author}</b>{r.location && <span> · {r.location}</span>}<span className="small dark"> · {new Date(r.created).toLocaleDateString("en-IN")}</span></div>
      <p><Stars n={r.rating} /> <b>{r.title}</b></p><p>{r.body}</p>
      <p className="rdetail">{[["Fit", r.fit], ["Comfort", r.comfort], ["Value for money", r.value], ["Quality", r.quality]].map(([l, n]) => <span key={l}>{l}: <Stars n={n} /></span>)}</p></article>))}
    {user ? (<form className="rform" onSubmit={submit} noValidate><h3>Write a review</h3>
      <div className="fld"><label htmlFor="rt">Title</label><input id="rt" value={f.title} onChange={set("title")} aria-invalid={!!errs.title} maxLength={100} />{errs.title && <span className="ferr" role="alert">{errs.title}</span>}</div>
      <div className="fld"><label htmlFor="rr">Rating</label><select id="rr" value={f.rating} onChange={set("rating")}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}</select></div>
      <div className="fld"><label htmlFor="rb">Your review</label><textarea id="rb" rows="4" value={f.body} onChange={set("body")} aria-invalid={!!errs.body} maxLength={1000} />{errs.body && <span className="ferr" role="alert">{errs.body}</span>}</div>
      {err && <p className="err" role="alert">{err}</p>}{msg && <p className="okmsg" role="status">{msg}</p>}
      <button className="solid" disabled={busy}>{busy ? "Posting…" : "Post review"}</button></form>)
      : <p className="rlogin">Want to share your experience? <Link className="link" to="/login" state={{ from: loc.pathname }}>Log in</Link> or <Link className="link" to="/signup" state={{ from: loc.pathname }}>sign up</Link> to write a review.</p>}
  </section>);
}
