"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { Eye, EyeOff, Store } from "lucide-react";

function VendorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/vendor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(
          "Invalid email or password. Your account will be locked for 15 minutes after 5 failed attempts."
        );
        return;
      }

      // Check role from session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user) {
        const role = session.user.role;
        const shopStatus = session.user.shopStatus;

        if (role !== "VENDOR") {
          setError("This portal is for vendors only. Please use the customer login.");
          await signOut({ redirect: false });
          return;
        }

        if (shopStatus === "PENDING") {
          router.push("/vendor/pending");
        } else if (shopStatus === "REJECTED") {
          setError("Your shop application was rejected. Please contact support.");
        } else {
          router.push("/vendor");
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #f0fdf4 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "rgba(34,197,94,0.15)", filter: "blur(80px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "rgba(27,66,101,0.08)", filter: "blur(80px)", zIndex: 0,
      }} />

      <div style={{
        width: "100%", maxWidth: 440,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        borderRadius: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.6)",
        padding: "40px 36px 36px",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Store size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>
            <span style={{ color: "#1B4265" }}>District</span>{" "}
            <span style={{ color: "#16a34a" }}>Kart</span>
          </span>
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.5px" }}>
          Vendor Portal
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
          Manage your shop, products and orders
        </p>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            color: "#DC2626", borderRadius: 10,
            padding: "10px 14px", fontSize: 13, fontWeight: 500,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em",
              color: "#6B7280", marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1.5px solid #E5E7EB", background: "#fff",
                fontSize: 14, color: "#111827", outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em",
              color: "#6B7280", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10,
                  border: "1.5px solid #E5E7EB", background: "#fff",
                  fontSize: 14, color: "#111827", outline: "none",
                  transition: "border-color 0.2s", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "#9CA3AF",
                  padding: 0, display: "flex",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px 20px", borderRadius: 12,
              background: loading ? "#9CA3AF" : "#16a34a",
              color: "#fff", fontSize: 14, fontWeight: 700,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s", marginTop: 4,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" opacity="0.75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              "Access Vendor Dashboard"
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#6B7280" }}>
          New vendor?{" "}
          <Link href="/vendor/register" style={{
            color: "#16a34a", fontWeight: 700,
            textDecoration: "none", borderBottom: "1.5px solid #16a34a",
          }}>
            Register your shop
          </Link>
        </div>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: "#6B7280" }}>
          Customer?{" "}
          <Link href="/auth/login" style={{
            color: "#1B4265", fontWeight: 600, textDecoration: "none",
          }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f0fdf4", fontWeight: 700, color: "#16a34a" }}>
        Loading…
      </div>
    }>
      <VendorLoginForm />
    </Suspense>
  );
}
