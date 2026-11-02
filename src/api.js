export const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export async function api(path, { method = "GET", body, auth = true } = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(auth && token ? { Authorization: `Token ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined }).catch(() => { throw new Error(`Cannot reach the server at ${BASE}. Is the backend running?`); });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || Object.values(data)[0]?.toString() || "Something went wrong.");
  return data;
}
export const money = (n) => "₹ " + Number(n).toLocaleString("en-IN");

export async function downloadInvoice(number) {
  const res = await fetch(`${BASE}/orders/${number}/invoice/`, { headers: { Authorization: `Token ${localStorage.getItem("token")}` } });
  if (!res.ok) throw new Error("Could not download the bill. Please try again.");
  const url = URL.createObjectURL(await res.blob()); const a = document.createElement("a");
  a.href = url; a.download = `StepUp-invoice-${number}.pdf`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
