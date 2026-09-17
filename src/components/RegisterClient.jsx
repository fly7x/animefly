"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterClient() {
  const router = useRouter();
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState({ username: "", email: "", password: "", cpassword: "" });
  const [code,    setCode]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submitForm(e) {
    e.preventDefault(); setError("");
    if (form.password !== form.cpassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const res  = await fetch("/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setStep(2);
  }

  async function submitCode(e) {
    e.preventDefault(); setError("");
    setLoading(true);
    const res  = await fetch("/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true, email: form.email, code, username: form.username, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    router.push("/login?registered=1");
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
            <text x="0" y="22" fontFamily="Inter,Arial Black,sans-serif" fontWeight="900" fontSize="22" fill="var(--accent)">Fly</text>
            <text x="42" y="22" fontFamily="Inter,Arial Black,sans-serif" fontWeight="900" fontSize="22" fill="#ffffff">Anime</text>
          </svg>
        </div>

        {step === 1 ? (
          <>
            <h1 style={s.title}>Create account</h1>
            <p style={s.sub}>Join Fly Anime — it's free</p>
            {error && <p style={s.error}>{error}</p>}
            <form onSubmit={submitForm} style={s.form}>
              <label style={s.label}>Username</label>
              <input style={s.input} type="text" placeholder="username" required
                value={form.username} onChange={e => update("username", e.target.value)} />
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" placeholder="name@email.com" required
                value={form.email} onChange={e => update("email", e.target.value)} />
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" placeholder="Minimum 6 characters" required
                value={form.password} onChange={e => update("password", e.target.value)} />
              <label style={s.label}>Confirm Password</label>
              <input style={s.input} type="password" placeholder="Repeat password" required
                value={form.cpassword} onChange={e => update("cpassword", e.target.value)} />
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? "Sending code..." : "Continue"}
              </button>
            </form>
            <p style={s.foot}>Already have an account? <Link href="/login" style={s.link}>Login</Link></p>
          </>
        ) : (
          <>
            <div style={{ fontSize: "40px", textAlign: "center", marginBottom: "12px" }}>✉️</div>
            <h1 style={s.title}>Check your email</h1>
            <p style={s.sub}>We sent a 6-digit code to <strong style={{ color: "#fff" }}>{form.email}</strong></p>
            {error && <p style={s.error}>{error}</p>}
            <form onSubmit={submitCode} style={s.form}>
              <label style={s.label}>Verification Code</label>
              <input
                style={{ ...s.input, letterSpacing: "10px", textAlign: "center", fontSize: "24px", fontWeight: 700 }}
                type="text" maxLength={6} placeholder="000000" required
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Create Account"}
              </button>
            </form>
            <p style={s.foot}>
              Wrong email?{" "}
              <button style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "13px", padding: 0 }}
                onClick={() => { setStep(1); setCode(""); setError(""); }}>
                Go back
              </button>
            </p>
          </>
        )}
        <p style={s.foot}><Link href="/" style={s.link}>← Back to Fly Anime</Link></p>
      </div>
    </div>
  );
}

const s = {
  wrap: { minHeight: "100vh", backgroundColor: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Inter,sans-serif" },
  card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-md)", borderRadius: "16px", padding: "40px 36px", width: "100%", maxWidth: "420px" },
  logoWrap: { marginBottom: "24px" },
  title: { color: "#fff", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" },
  sub: { color: "#a0a0b0", fontSize: "14px", margin: "0 0 28px" },
  error: { backgroundColor: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.3)", color: "var(--accent)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  label: { color: "#a0a0b0", fontSize: "13px", fontWeight: 500 },
  input: { backgroundColor: "var(--bg)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 14px", color: "#fff", fontSize: "14px", outline: "none", fontFamily: "Inter,sans-serif" },
  btn: { backgroundColor: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "6px", fontFamily: "Inter,sans-serif" },
  foot: { color: "#606070", fontSize: "13px", textAlign: "center", marginTop: "16px" },
  link: { color: "var(--accent)", textDecoration: "none" },
};
