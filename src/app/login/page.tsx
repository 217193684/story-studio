"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.href = "/"; else { setErr("That password is wrong. Try again."); setBusy(false); }
  }
  return (
    <form onSubmit={go} className="panel" style={{ maxWidth: 420, margin: "60px auto", display: "grid", gap: 14 }}>
      <h2>Open your studio</h2>
      <div><label htmlFor="pw">Password</label><input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></div>
      {err && <p style={{ color: "var(--rose)", margin: 0 }}>{err}</p>}
      <button className="btn" disabled={busy || !pw}>{busy ? "Opening…" : "Open studio"}</button>
    </form>
  );
}
