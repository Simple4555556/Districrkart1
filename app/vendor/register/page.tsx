"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, Store,
  Phone, Instagram, Facebook, Youtube, ChevronDown, ChevronUp, Navigation,
} from "lucide-react";
import { validatePassword, strengthMeta } from "@/lib/password";
import type { PasswordChecks } from "@/lib/password";

/* ─── Password strength bar ──────────────────────────────────────────── */
function StrengthBar({ score }: { score: number }) {
  const meta = strengthMeta(score);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i <= score ? meta.color : "#E5E7EB",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
        {score > 0 ? meta.label : ""}
      </span>
    </div>
  );
}

function RuleRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
      color: ok ? "#16A34A" : "#9CA3AF", transition: "color 0.2s" }}>
      {ok ? <CheckCircle2 size={13} color="#16A34A" /> : <XCircle size={13} color="#D1D5DB" />}
      {label}
    </div>
  );
}

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
          name={name} required={required} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={isPassword ? "new-password" : undefined}
          style={{
            width: "100%", padding: isPassword ? "12px 44px 12px 14px" : "12px 14px",
            borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff",
            fontSize: 14, color: "#111827", outline: "none",
            transition: "border-color 0.2s", boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPwd((v) => !v)}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#9CA3AF", padding: 0, display: "flex",
            }}
            aria-label={showPwd ? "Hide password" : "Show password"}>
            {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid #E5E7EB", background: "#fff",
  fontSize: 13, color: "#111827", outline: "none",
  transition: "border-color 0.2s", boxSizing: "border-box",
};

export default function VendorRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [showOptional, setShowOptional] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    shopName: "", shopDescription: "", location: "Samastipur",
    // optional business fields
    gstNumber: "",
    whatsapp: "", instagram: "", facebook: "", youtube: "",
    latitude: "", longitude: "",
  });

  const pwdVal = validatePassword(form.password);
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude:  form.latitude  ? parseFloat(form.latitude)  : undefined,
          longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      router.push("/vendor/login?registered=true");
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Inter', system-ui, sans-serif",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #f0fdf4 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500,
        borderRadius: "50%", background: "rgba(34,197,94,0.15)", filter: "blur(80px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400,
        borderRadius: "50%", background: "rgba(27,66,101,0.08)", filter: "blur(80px)", zIndex: 0,
      }} />

      <div style={{
        width: "100%", maxWidth: 540, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", borderRadius: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)", border: "1px solid rgba(255,255,255,0.6)",
        padding: "36px 36px 32px", position: "relative", zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10,
            textDecoration: "none", marginBottom: 20 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Store size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>
              <span style={{ color: "#1B4265" }}>District</span>{" "}
              <span style={{ color: "#16a34a" }}>Kart</span>
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827",
            letterSpacing: "-0.5px", marginBottom: 4 }}>
            Open Your Shop
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            List your products and reach local customers — free forever.
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              flex: 1, height: 5, borderRadius: 4,
              background: s <= step ? "#16a34a" : "#E5E7EB",
              transition: "background 0.4s",
            }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 20, fontWeight: 500 }}>
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
            {/* ── Step 1: Personal Details ── */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Full Name" name="name" value={form.name} onChange={handleChange}
                    placeholder="Your Name" required />
                  <Field label="Phone" name="phone" type="tel" value={form.phone}
                    onChange={handleChange} placeholder="+91 98765 43210" hint="Optional" />
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
                        <RuleRow ok={checks.length} label="8+ characters" />
                        <RuleRow ok={checks.uppercase} label="Uppercase (A-Z)" />
                        <RuleRow ok={checks.lowercase} label="Lowercase (a-z)" />
                        <RuleRow ok={checks.number} label="Number (0-9)" />
                        <RuleRow ok={checks.special} label="Special (!@#$…)" />
                      </div>
                    </>
                  )}
                </div>
                <button type="button" onClick={goToStep2}
                  style={{
                    width: "100%", padding: "13px 20px", borderRadius: 12,
                    background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 700,
                    border: "none", cursor: "pointer", transition: "background 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4,
                  }}>
                  Next: Shop Details
                  <span>→</span>
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Shop Details ── */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Shop Name */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
                    Shop Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input name="shopName" required value={form.shopName} onChange={handleChange}
                    placeholder="e.g. Samastipur Electronics"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                </div>

                {/* Shop Description */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
                    Shop Description
                  </label>
                  <textarea name="shopDescription" value={form.shopDescription}
                    onChange={handleChange} rows={3}
                    placeholder="What do you sell? Tell customers about your shop…"
                    style={{ ...inputStyle, resize: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
                    Shop Location <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select name="location" required value={form.location} onChange={handleChange}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    {["Samastipur", "Nawabganj", "Kalyanpur", "Tajpur", "Rosera", "Pusa", "Musrigharari"].map(
                      (loc) => <option key={loc} value={loc}>{loc}</option>
                    )}
                  </select>
                </div>

                {/* ── Optional: Business Info toggle ── */}
                <div>
                  <button type="button" onClick={() => setShowOptional((v) => !v)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 14px", borderRadius: 10,
                      border: "1.5px dashed #D1D5DB", background: showOptional ? "#F9FAFB" : "transparent",
                      color: "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.2s",
                    }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>⚙️</span>
                      Optional Business Details
                      <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>(GST, social links, GPS)</span>
                    </span>
                    {showOptional ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  <AnimatePresence>
                    {showOptional && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden" }}>
                        <div style={{
                          marginTop: 12, padding: 16, borderRadius: 12,
                          background: "#F9FAFB", border: "1px solid #E5E7EB",
                          display: "flex", flexDirection: "column", gap: 12,
                        }}>
                          {/* GST */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 5 }}>
                              GST Number
                            </label>
                            <input name="gstNumber" value={form.gstNumber} onChange={handleChange}
                              placeholder="22AAAAA0000A1Z5" maxLength={15}
                              style={{ ...inputStyle, background: "#fff", fontFamily: "monospace" }}
                              onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                          </div>

                          {/* Social links */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                              { name: "whatsapp", label: "WhatsApp", icon: <Phone size={12} />, color: "#25D366", ph: "+91 98765 43210" },
                              { name: "instagram", label: "Instagram", icon: <Instagram size={12} />, color: "#E1306C", ph: "@yourshop" },
                              { name: "facebook", label: "Facebook", icon: <Facebook size={12} />, color: "#1877F2", ph: "fb.com/yourshop" },
                              { name: "youtube", label: "YouTube", icon: <Youtube size={12} />, color: "#FF0000", ph: "youtube.com/@shop" },
                            ].map(({ name, label, icon, color, ph }) => (
                              <div key={name}>
                                <label style={{ display: "flex", alignItems: "center", gap: 5,
                                  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                  letterSpacing: "0.06em", marginBottom: 5 }}>
                                  <span style={{ color }}>{icon}</span>
                                  <span style={{ color: "#6B7280" }}>{label}</span>
                                </label>
                                <input name={name} value={(form as any)[name]} onChange={handleChange}
                                  placeholder={ph}
                                  style={{ ...inputStyle, background: "#fff", fontSize: 12 }}
                                  onFocus={(e) => (e.target.style.borderColor = color)}
                                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                              </div>
                            ))}
                          </div>

                          {/* GPS coordinates */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 5 }}>
                              GPS Coordinates
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                              <input name="latitude" value={form.latitude} onChange={handleChange}
                                placeholder="Latitude (25.86…)" type="number" step="any"
                                style={{ ...inputStyle, background: "#fff", fontSize: 12 }}
                                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                              <input name="longitude" value={form.longitude} onChange={handleChange}
                                placeholder="Longitude (85.78…)" type="number" step="any"
                                style={{ ...inputStyle, background: "#fff", fontSize: 12 }}
                                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                            </div>
                            <button type="button" onClick={getCurrentLocation} disabled={locating}
                              style={{
                                width: "100%", padding: "9px 14px", borderRadius: 9,
                                background: "#F0FDF4", color: "#16a34a",
                                border: "1.5px solid #BBF7D0",
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                              }}>
                              <Navigation size={13} style={{ animation: locating ? "spin 1s linear infinite" : undefined }} />
                              {locating ? "Getting location…" : "Use My Current Location"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
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
                      background: loading ? "#9CA3AF" : "#16a34a",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                      border: "none", cursor: loading ? "not-allowed" : "pointer",
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

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 24 }}>
          Already have a shop?{" "}
          <Link href="/vendor/login" style={{ color: "#16a34a", fontWeight: 700,
            textDecoration: "none", borderBottom: "1.5px solid #16a34a" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
