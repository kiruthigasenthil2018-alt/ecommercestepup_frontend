export default function Avatar({ kind = "male", size = 40 }) {
  const f = kind === "female";
  return (<svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${f ? "Female" : "Male"} avatar`} style={{ borderRadius: "50%", flex: "none", display: "block" }}>
    <rect width="64" height="64" fill={f ? "#FFD6E0" : "#CFE3F5"} />
    {f && <path d="M13 46c-4-22 3-36 19-36s23 14 19 36c-2 8-8 8-9 0H22c-1 8-7 8-9 0z" fill="#3b2a2a" />}
    <path d="M9 64c2-14 12-18 23-18s21 4 23 18z" fill={f ? "#E86A8E" : "#2F4F4F"} />
    <rect x="28" y="38" width="8" height="10" rx="3" fill="#E8B48C" />
    <circle cx="32" cy="29" r="12" fill="#F2C29B" />
    {f ? <path d="M20 28c2-9 8-12 13-12s9 3 11 12c-5-3-9-6-13-6s-8 2-11 6z" fill="#3b2a2a" /> : <path d="M20 27c0-10 7-14 13-14s11 4 11 13c-4-4-9-6-14-6s-8 3-10 7z" fill="#2b1d16" />}
    <circle cx="27.5" cy="30" r="1.4" fill="#222" /><circle cx="36.5" cy="30" r="1.4" fill="#222" />
    <path d="M28 35c2.5 2.5 5.5 2.5 8 0" stroke="#a5523a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </svg>);
}
