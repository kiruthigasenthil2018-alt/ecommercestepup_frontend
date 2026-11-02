import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../context.jsx";
import { Field, validate, hasErrors, rules } from "../form.jsx";

const GID_ENV = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const validId = (g) => /\.apps\.googleusercontent\.com$/.test(g || "") && !/^x+\./i.test(g || "");
const AID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

export default function Auth({ mode: route }) {
  const { login, addWish } = useApp(); const nav = useNavigate(); const st = useLocation().state || {};
  const [mode, setMode] = useState(route); // login | signup | verify
  const [v, setV] = useState({ email: "", password: "", confirm: "", loginPassword: "" });
  const [agree, setAgree] = useState(false); const [otp, setOtp] = useState(""); const [errs, setErrs] = useState({});
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false); const [wait, setWait] = useState(0);
  const gbtn = useRef(); const [via, setVia] = useState("password"); const [kind, setKind] = useState("signup");
  const [gid, setGid] = useState(GID_ENV); const googleReady = validId(gid); const [devCode, setDevCode] = useState("");
  useEffect(() => { // the Google Client ID is also served by the backend, so no frontend rebuild is needed after deployment
    // The free Render backend may be asleep (30-60 s). Keep retrying so the Google button appears without a manual refresh.
    let stop = false, tries = 0, timer;
    const load = () => api("/config/", { auth: false }).then((c) => { if (!stop && validId(c.google_client_id)) setGid(c.google_client_id); }).catch(() => { if (!stop && ++tries < 15) timer = setTimeout(load, 4000); });
    load();
    return () => { stop = true; clearTimeout(timer); };
  }, []);
  useEffect(() => { setMode(route); setErr(""); setErrs({}); }, [route]);
  useEffect(() => { if (wait <= 0) { return; } const t = setTimeout(() => setWait(wait - 1), 1000); return () => { clearTimeout(t); }; }, [wait]);

  const finish = (d) => { login(d); if (st.wishId) addWish(st.wishId); nav(st.from || "/", { replace: true }); };
  const run = async (fn) => { setBusy(true); setErr(""); try { await fn(); } catch (e) { setErr(e.message); } setBusy(false); };
  const set = (k) => (e) => { const val = e.target.value; setV({ ...v, [k]: val }); if (errs[k]) setErrs({ ...errs, [k]: rules[k](val, { ...v, [k]: val }) }); };
  const blur = (k) => () => setErrs((x) => ({ ...x, [k]: rules[k](v[k], v) }));
  const sent = (r) => { setMode("verify"); setWait(30); setDevCode(r.dev_code || ""); setInfo(r.smtp ? `We emailed a 6-digit code to ${v.email}. It expires in 10 minutes.` : r.dev_code ? "We could not email the code, so it is shown below (demo mode)." : "Enter the 6-digit code we sent you."); };

  useEffect(() => { // Google button (Google Identity Services)
    if (!googleReady || mode === "verify") { return; }
    let t;
    const init = () => {
      if (!window.google?.accounts || !gbtn.current) return false;
      window.google.accounts.id.initialize({ client_id: gid, callback: (r) => run(() => api("/auth/google/", { method: "POST", body: { credential: r.credential }, auth: false }).then(finish)) });
      gbtn.current.innerHTML = ""; window.google.accounts.id.renderButton(gbtn.current, { theme: "outline", size: "large", text: mode === "signup" ? "signup_with" : "signin_with", width: 280 }); return true;
    };
    if (!init()) { t = setInterval(() => { if (init()) clearInterval(t); }, 300); }
    return () => { clearInterval(t); };
  }, [mode, gid]);

  const apple = () => run(async () => {
    if (!AID || /yourcompany/.test(AID)) throw new Error("Apple sign-in is not configured yet (needs an Apple Developer account and HTTPS domain).");
    window.AppleID.auth.init({ clientId: AID, scope: "name email", redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin, usePopup: true });
    const r = await window.AppleID.auth.signIn(); const n = r.user?.name;
    finish(await api("/auth/apple/", { method: "POST", body: { id_token: r.authorization.id_token, name: n ? `${n.firstName} ${n.lastName}` : "" }, auth: false }));
  });

  const submit = (e) => {
    e.preventDefault(); setErr("");
    if (mode === "verify") { const m = rules.otp(otp); setErrs({ otp: m }); if (m) return; return run(() => api(kind === "login" ? "/auth/login-otp/verify/" : "/auth/verify/", { method: "POST", body: { email: v.email, code: otp }, auth: false }).then(finish)); }
    const e2 = validate(v, mode === "signup" ? ["email", "password", "confirm"] : via === "otp" ? ["email"] : ["email", "loginPassword"]);
    if (mode === "signup" && !agree) e2.agree = "Please accept the Terms and Privacy Policy.";
    setErrs(e2); if (hasErrors(e2)) return;
    if (mode === "login" && via === "otp") { setKind("login"); return run(() => api("/auth/login-otp/", { method: "POST", body: { email: v.email }, auth: false }).then(sent)); }
    setKind("signup");
    if (mode === "login") return run(() => api("/auth/login/", { method: "POST", body: { email: v.email, password: v.loginPassword }, auth: false }).then(finish));
    run(() => api("/auth/signup/", { method: "POST", body: { email: v.email, password: v.password }, auth: false }).then(sent));
  };
  const resend = () => run(async () => { sent(await api("/auth/resend/", { method: "POST", body: { email: v.email }, auth: false })); });

  const why = st.wishId || st.from === "/wishlist" ? "Sign up to save shoes to your wishlist." : st.from === "/checkout" ? "Sign up to place your order and get your first-order offer." : "";
  return (<section className="authwrap"><div className="authsplit"><aside className="authside"><img src="/images/hero1.jpg" alt="" /><div className="authtext"><h2>Welcome to StepUp.in</h2><ul><li>🎁 First order: 50% OFF + a free gift</li><li>♡ Save your favourite shoes to a wishlist</li><li>🛒 Your cart follows you on every device</li><li>🚚 Track your parcel live on the map</li></ul></div></aside>
  <form className="authcard" onSubmit={submit} noValidate>
    {mode !== "verify" && <div className="tabs"><Link to="/login" state={st} replace className={mode === "login" ? "on" : ""}>Log in</Link><Link to="/signup" state={st} replace className={mode === "signup" ? "on" : ""}>Register</Link></div>}
    {mode === "signup" && <><h3 className="center">Create your account</h3>{why && <p className="notice small">{why}</p>}<p className="small center dark">🎁 First order: 50% OFF + a free gift</p></>}
    {mode === "verify" ? (<><h3 className="center">{kind === "login" ? "Enter your login code" : "Verify your email"}</h3><p className="small dark">{info}</p>
      {devCode && <div className="devcode" role="status"><span>🔐 Your verification code</span><b>{devCode}</b><button type="button" className="outline sm" onClick={() => { setOtp(devCode); setErrs({}); }}>Use this code</button><small>Demo mode: the code is also shown here on the page.</small></div>}
      <Field label="Verification code" name="otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="6-digit code" value={otp} error={errs.otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
      <button className="solid mid" disabled={busy}>{busy ? "Verifying…" : kind === "login" ? "Verify & log in" : "Verify & create account"}</button>
      <p className="center small"><button type="button" className="linkbtn" disabled={wait > 0 || busy} onClick={resend}>{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button> · <button type="button" className="linkbtn" onClick={() => { setMode(kind === "login" ? "login" : "signup"); setErr(""); }}>Change email</button></p></>) : (<>
      {mode === "login" && <div className="toggle" role="tablist" aria-label="Login method"><button type="button" role="tab" aria-selected={via === "password"} className={via === "password" ? "on" : ""} onClick={() => { setVia("password"); setErr(""); }}>🔑 Password</button><button type="button" role="tab" aria-selected={via === "otp"} className={via === "otp" ? "on" : ""} onClick={() => { setVia("otp"); setErr(""); }}>✉️ Email code (OTP)</button></div>}
      <Field label="Email id" name="email" type="email" autoComplete="email" placeholder="Enter your email" value={v.email} error={errs.email} onChange={set("email")} onBlur={blur("email")} />
      {mode === "login" ? (via === "otp" ? <p className="small dark">We’ll email you a 6-digit code. No password needed.</p> : <Field label="Password" name="loginPassword" type="password" autoComplete="current-password" placeholder="Enter password" value={v.loginPassword} error={errs.loginPassword} onChange={set("loginPassword")} />)
        : <><Field label="Create password" name="password" type="password" autoComplete="new-password" placeholder="Min 8 characters" hint="8+ characters, upper & lower case and a number" value={v.password} error={errs.password} onChange={set("password")} onBlur={blur("password")} />
          <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" placeholder="Re-enter password" value={v.confirm} error={errs.confirm} onChange={set("confirm")} onBlur={blur("confirm")} />
          <label className="agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I have read and agreed to the <Link className="link" to="/policy/terms">Terms</Link> and <Link className="link" to="/policy/privacy">Privacy Policy</Link></label>{errs.agree && <span className="ferr" role="alert">{errs.agree}</span>}</>}
      {mode === "login" && via === "password" && <a className="forget" href="#f" onClick={(e) => { e.preventDefault(); setErr("Password reset is not enabled yet. Use Register to create a new account."); }}>Forget Password?</a>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="solid mid" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? (via === "otp" ? "Send login code" : "Log In") : "Sign up with email"}</button>
      <h3 className="or">Or</h3>
      <div className="social-login">
        {googleReady ? <div ref={gbtn} /> : <button type="button" className="gdisabled" onClick={() => setErr("Google sign-in isn’t set up yet: add your Google Client ID in frontend/.env (VITE_GOOGLE_CLIENT_ID) and backend/.env (GOOGLE_CLIENT_ID). See README.")}>Continue with Google</button>}
        <button type="button" className="applebtn" onClick={apple}> Continue with Apple</button></div>
      <p className="center">{mode === "login" ? <>Don’t have an account? <Link className="red" to="/signup" state={st}>Register</Link></> : <>Already registered? <Link className="red" to="/login" state={st}>Log in</Link></>}</p></>)}
    {mode === "verify" && err && <p className="err" role="alert">{err}</p>}
  </form></div></section>);
}
