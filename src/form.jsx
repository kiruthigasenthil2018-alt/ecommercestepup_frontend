import { useState } from "react";

export const luhn = (s) => { const d = s.replace(/\D/g, ""); if (d.length < 13 || d.length > 19) return false; let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) { let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0; };
const req = (label, min = 2) => (v) => ((v || "").trim().length >= min ? "" : `${label} is required.`);
const nm = (label) => (v) => (/^[A-Za-z][A-Za-z .'-]{1,59}$/.test((v || "").trim()) ? "" : `Enter a valid ${label} (letters only).`);

export const rules = {
  first_name: nm("first name"),
  last_name: (v) => (!v || /^[A-Za-z][A-Za-z .'-]{0,59}$/.test(v.trim()) ? "" : "Letters only."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || "").trim()) ? "" : "Enter a valid email address."),
  phone: (v) => (/^(\+91|91|0)?[6-9]\d{9}$/.test((v || "").replace(/[\s-]/g, "")) ? "" : "Enter a valid 10-digit mobile number."),
  address: req("Address", 5), city: req("City"), state: req("State"),
  pincode: (v) => (/^[1-9]\d{5}$/.test(v || "") ? "" : "Pincode must be 6 digits."),
  password: (v) => (v && v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) ? "" : "Use 8+ characters with upper-case, lower-case and a number."),
  confirm: (v, all) => (v && v === all.password ? "" : "Passwords do not match."),
  loginPassword: (v) => (v ? "" : "Enter your password."),
  otp: (v) => (/^\d{6}$/.test(v || "") ? "" : "Enter the 6-digit code."),
  card_name: nm("name on card"),
  card_number: (v) => (luhn(v || "") ? "" : "Enter a valid card number."),
  expiry: (v) => { const m = /^(\d{2})\/(\d{2})$/.exec(v || ""); if (!m) return "Use MM/YY."; const mo = +m[1];
    if (mo < 1 || mo > 12) return "Invalid month."; return new Date(2000 + +m[2], mo, 0, 23, 59) < new Date() ? "This card has expired." : ""; },
  cvv: (v) => (/^\d{3,4}$/.test(v || "") ? "" : "CVV is 3 or 4 digits."),
  bank: (v) => (v ? "" : "Select your bank."),
  upi: (v) => (/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test((v || "").trim()) ? "" : "Enter a valid UPI ID, e.g. name@okhdfc."),
};
export const validate = (values, keys) => { const e = {}; keys.forEach((k) => { e[k] = rules[k] ? rules[k](values[k], values) : ""; }); return e; };
export const hasErrors = (e) => Object.values(e).some(Boolean);
export const formatCard = (v) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
export const formatExpiry = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

export function Field({ label, name, error, hint, type = "text", ...rest }) {
  const [show, setShow] = useState(false); const pw = type === "password";
  return (<div className="fld"><label htmlFor={name}>{label}</label>
    <div className={pw ? "pw" : ""}><input id={name} name={name} type={pw && show ? "text" : type} aria-invalid={!!error} aria-describedby={error ? `${name}-e` : undefined} {...rest} />
      {pw && <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide" : "Show"}>{show ? "🙈" : "👁"}</button>}</div>
    {hint && !error && <small className="hint">{hint}</small>}{error && <span id={`${name}-e`} className="ferr" role="alert">{error}</span>}</div>);
}
