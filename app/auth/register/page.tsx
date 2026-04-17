"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { validatePassword, strengthMeta } from "@/lib/password";
import type { PasswordChecks } from "@/lib/password";

/* ─── Types ──────────────────────────────────────────────────────────── */
type AccountType = "user" | "vendor";
type VendorStep  = 1 | 2;

/* ─── Password strength bar ──────────────────────────────────────────── */
function StrengthBar({ score }: { score: number }) {
  const meta = strengthMeta(score);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 4,
              background: i <= score ? meta.color : "#E5E7EB",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
        {score > 0 ? meta.label : ""}
      </span>
    </div>
  );
}

/* ─── Password rule checklist ────────────────────────────────────────── */
function RuleRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
      color: ok ? "#16A34A" : "#9CA3AF", transition: "color 0.2s" }}>
      {ok
        ? <CheckCircle2 size={13} color="#16A34A" />
        : <XCircle     size={13} color="#D1D5DB" />}
      {label}
    </div>
  );
}

/* ─── Google button ──────────────────────────────────────────────────── */
function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "12px 20px", borderRadius: 12,
        border: "1.5px solid #E5E7EB", background: "#fff",
        fontSize: 14, fontWeight: 600, color: "#374151",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "all 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
    >
      {/* Google "G" logo */}
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.4 5.5-5 7.2v6h8.1c4.7-4.4 7.2-10.8 7.2-17.4z" fill="#4285F4"/>
        <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8.1-6c-2.1 1.4-4.8 2.2-7.8 2.2-6 0-11-4-12.8-9.5H2.9v6.2C6.8 42.7 14.9 48 24 48z" fill="#34A853"/>
        <path d="M11.2 28.9c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4v-6.2H2.9A23.9 23.9 0 000 24c0 3.9.9 7.5 2.9 10.7l8.3-5.8z" fill="#FBBC04"/>
        <path d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.6-6.6C35.9 2.4 30.5 0 24 0 14.9 0 6.8 5.3 2.9 13.3l8.3 6.2C13 13.5 18 9.5 24 9.5z" fill="#EA4335"/>
      </svg>
      {loading ? "Connecting…" : "Continue with Google"}
    </button>
  );
}

/* ─── Input field ────────────────────────────────────────────────────── */
function Field({
  label, name, type = "text", value, onChange, placeholder, required, hint,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; hint?: string;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && showPwd ? "text" : type}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={isPassword ? "new-password" : undefined}
          style={{
            width: "100%", padding: isPassword ? "12px 44px 12px 14px" : "12px 14px",
            borderRadius: 10, border: "1.5px solid #E5E7EB",
            background: "#fff", fontSize: 14, color: "#111827",
            outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#88C140")}
          onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
              padding: 0, display: "flex",
            }}
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

/* ─── Logo ───────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8,
      textDecoration: "none", marginBottom: 8 }}>
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
        <path d="M20 30 H40 C45 30 50 25 50 15 C50 5 45 0 40 0 C30 0 25 10 25 20" stroke="#1B4265" strokeWidth="6" fill="transparent"/>
        <path d="M40 30 C50 50 50 60 40 70 C30 60 30 50 40 30" fill="#88C140"/>
        <path d="M30 50 L20 50 L25 80 L65 80 L75 40 L45 40" stroke="#1B4265" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="35" cy="90" r="5" fill="#88C140"/>
        <circle cx="60" cy="90" r="5" fill="#88C140"/>
      </svg>
      <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>
        <span style={{ color: "#1B4265" }}>DISTRICT</span>{" "}
        <span style={{ color: "#88C140" }}>KART</span>
      </span>
    </Link>
  );
}

/* ─── Divider ────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>or</span>
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Personal Account Registration
═══════════════════════════════════════════════════════════════════════ */
function UserRegisterForm() {
  const router = useRouter();
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]             = useState("");
  const [form, setForm]               = useState({ name: "", email: "", phone: "", password: "" });

  const pwdVal   = validatePassword(form.password);
  const checks: PasswordChecks = pwdVal.checks;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!pwdVal.valid) {
      setError("Please fix the password issues before submitting.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <GoogleButton onClick={handleGoogle} loading={googleLoading} />
      <Divider />

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626",
          borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange}
            placeholder="Arpit Sachan" required />
          <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
            placeholder="+91 98765 43210" hint="Optional" />
        </div>
        <Field label="Email Address" name="email" type="email" value={form.email}
          onChange={handleChange} placeholder="arpit@example.com" required />

        <div>
          <Field label="Password" name="password" type="password" value={form.password}
            onChange={handleChange} placeholder="Min 8 chars with A-Z, 0-9, !@#" required />
          {form.password.length > 0 && (
            <>
              <StrengthBar score={pwdVal.score} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginTop: 8 }}>
                <RuleRow ok={checks.length}    label="8+ characters"      />
                <RuleRow ok={checks.uppercase} label="Uppercase (A-Z)"    />
                <RuleRow ok={checks.lowercase} label="Lowercase (a-z)"    />
                <RuleRow ok={checks.number}    label="Number (0-9)"       />
                <RuleRow ok={checks.special}   label="Special (!@#$…)"    />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !pwdVal.valid}
          style={{
            width: "100%", padding: "13px 20px", borderRadius: 12,
            background: pwdVal.valid ? "#1B4265" : "#9CA3AF",
            color: "#fff", fontSize: 14, fontWeight: 700,
            border: "none", cursor: pwdVal.valid && !loading ? "pointer" : "not-allowed",
            transition: "all 0.2s", marginTop: 4,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating account…</> : "Create Account"}
        </button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Vendor Registration (2-step)
═══════════════════════════════════════════════════════════════════════ */
function VendorRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [step, setStep]       = useState<VendorStep>(1);
  const [form, setForm]       = useState({
    name: "", email: "", phone: "", password: "",
    shopName: "", shopDescription: "", location: "Samastipur",
  });

  const pwdVal   = validatePassword(form.password);
  const checks: PasswordChecks = pwdVal.checks;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const goToStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!pwdVal.valid) {
      setError("Please fix the password issues before continuing.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[1, 2].map((s) => (
          <div key={s} style={{
            flex: 1, height: 5, borderRadius: 4,
            background: s <= step ? "#88C140" : "#E5E7EB",
            transition: "background 0.4s",
          }} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, fontWeight: 500 }}>
        Step {step} of 2 — {step === 1 ? "Personal Details" : "Shop Details"}
      </p>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626",
          borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Full Name" name="name" value={form.name} onChange={handleChange}
                  placeholder="Arpit Sachan" required />
                <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                  placeholder="+91 98765 43210" hint="Optional" />
              </div>
              <Field label="Email Address" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="vendor@example.com" required />
              <div>
                <Field label="Password" name="password" type="password" value={form.password}
                  onChange={handleChange} placeholder="Min 8 chars with A-Z, 0-9, !@#" required />
                {form.password.length > 0 && (
                  <>
                    <StrengthBar score={pwdVal.score} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginTop: 8 }}>
                      <RuleRow ok={checks.length}    label="8+ characters"   />
                      <RuleRow ok={checks.uppercase} label="Uppercase (A-Z)" />
                      <RuleRow ok={checks.lowercase} label="Lowercase (a-z)" />
                      <RuleRow ok={checks.number}    label="Number (0-9)"    />
                      <RuleRow ok={checks.special}   label="Special (!@#$…)" />
                    </div>
                  </>
                )}
              </div>
              <button type="button" onClick={goToStep2}
                style={{
                  width: "100%", padding: "13px 20px", borderRadius: 12,
                  background: "#1B4265", color: "#fff", fontSize: 14, fontWeight: 700,
                  border: "none", cursor: "pointer", transition: "background 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                Next: Shop Details
                <span>→</span>
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
                  Shop Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input name="shopName" required value={form.shopName} onChange={handleChange}
                  placeholder="e.g. Samastipur Electronics"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 14,
                    outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#88C140")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
                  Shop Description
                </label>
                <textarea name="shopDescription" value={form.shopDescription} onChange={handleChange}
                  rows={3} placeholder="What do you sell? Tell customers about your shop…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 14,
                    outline: "none", resize: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#88C140")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
                  Shop Location <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select name="location" required value={form.location} onChange={handleChange}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 14,
                    outline: "none", boxSizing: "border-box", cursor: "pointer" }}>
                  {["Samastipur","Nawabganj","Kalyanpur","Tajpur","Rosera","Pusa","Musrigharari"].map(
                    (loc) => <option key={loc} value={loc}>{loc}</option>
                  )}
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: "13px 20px", borderRadius: 12,
                    background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600,
                    border: "1.5px solid #E5E7EB", cursor: "pointer",
                  }}>
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  style={{
                    flex: 2, padding: "13px 20px", borderRadius: 12,
                    background: loading ? "#9CA3AF" : "#88C140", color: "#fff",
                    fontSize: 14, fontWeight: 700, border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Registering…</>
                    : "Complete Registration"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Register Page
═══════════════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>("user");

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Inter', system-ui, sans-serif",
      background: "linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 50%, #fafafa 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500,
        borderRadius: "50%", background: "rgba(136,193,64,0.12)", filter: "blur(80px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400,
        borderRadius: "50%", background: "rgba(27,66,101,0.08)", filter: "blur(80px)", zIndex: 0,
      }} />

      <div style={{
        width: "100%", maxWidth: 520, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", borderRadius: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)", border: "1px solid rgba(255,255,255,0.6)",
        padding: "36px 36px 32px", position: "relative", zIndex: 1,
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Logo />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827",
            letterSpacing: "-0.5px", marginTop: 12, marginBottom: 4 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Join Samastipur&apos;s local marketplace
          </p>
        </div>

        {/* Account type switcher */}
        <div style={{
          display: "flex", background: "#F3F4F6", borderRadius: 12,
          padding: 4, marginBottom: 28,
        }}>
          {(["user", "vendor"] as AccountType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAccountType(t)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 9,
                border: "none", cursor: "pointer", fontWeight: 700,
                fontSize: 13, transition: "all 0.2s",
                background: accountType === t
                  ? (t === "user" ? "#1B4265" : "#88C140")
                  : "transparent",
                color: accountType === t ? "#fff" : "#6B7280",
                boxShadow: accountType === t ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {t === "user" ? "Personal Account" : "Open a Shop"}
            </button>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20,
          padding: "10px 14px", background: "#F9FAFB", borderRadius: 8,
          borderLeft: `3px solid ${accountType === "user" ? "#1B4265" : "#88C140"}`,
        }}>
          {accountType === "user"
            ? "Shop from local businesses, track orders, and save your favourites."
            : "List your products, manage orders, and grow your local business online."}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={accountType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {accountType === "user" ? <UserRegisterForm /> : <VendorRegisterForm />}
          </motion.div>
        </AnimatePresence>

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 24 }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "#1B4265", fontWeight: 700,
            textDecoration: "none", borderBottom: "1.5px solid #1B4265" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
