"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

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
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path d="M47.532 24.552c0-1.636-.132-3.228-.388-4.776H24.48v9.044h12.984c-.56 3.016-2.256 5.572-4.808 7.288v6.056h7.78c4.552-4.196 7.096-10.372 7.096-17.612z" fill="#4285F4"/>
        <path d="M24.48 48c6.516 0 11.984-2.156 15.98-5.836l-7.78-6.056c-2.156 1.444-4.912 2.296-8.2 2.296-6.304 0-11.64-4.256-13.544-9.976H2.888v6.252C6.868 42.628 15.1 48 24.48 48z" fill="#34A853"/>
        <path d="M10.936 28.428A14.47 14.47 0 0 1 10.18 24c0-1.54.264-3.04.756-4.428v-6.252H2.888A23.968 23.968 0 0 0 .48 24c0 3.868.924 7.524 2.408 10.68l8.048-6.252z" fill="#FBBC05"/>
        <path d="M24.48 9.596c3.552 0 6.74 1.22 9.248 3.624l6.932-6.932C36.46 2.392 30.996 0 24.48 0 15.1 0 6.868 5.372 2.888 13.32l8.048 6.252c1.904-5.72 7.24-9.976 13.544-9.976z" fill="#EA4335"/>
      </svg>
      {loading ? "Signing in…" : "Continue with Google"}
    </button>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const wasRegistered = searchParams.get("registered") === "true";

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

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

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user) {
        const role = session.user.role;
        if (role === "ADMIN") {
          router.push("/secure-admin-portal-9x7k2");
        } else if (role === "VENDOR") {
          const shopStatus = session.user.shopStatus;
          if (shopStatus === "PENDING") router.push("/vendor/pending");
          else if (shopStatus === "APPROVED") router.push("/vendor");
          else router.push(callbackUrl);
        } else {
          router.push(callbackUrl);
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
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Inter', system-ui, sans-serif",
      background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 40%, #f5f3ff 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500,
        borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(80px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400,
        borderRadius: "50%", background: "rgba(139,92,246,0.1)", filter: "blur(80px)", zIndex: 0,
      }} />

      <div style={{
        width: "100%", maxWidth: 440,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", borderRadius: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.6)",
        padding: "40px 36px 36px",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10,
          textDecoration: "none", marginBottom: 28 }}>
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
            <path d="M20 30 H40 C45 30 50 25 50 15 C50 5 45 0 40 0 C30 0 25 10 25 20"
              stroke="#1B4265" strokeWidth="6" fill="transparent"/>
            <path d="M40 30 C50 50 50 60 40 70 C30 60 30 50 40 30" fill="#88C140"/>
            <path d="M30 50 L20 50 L25 80 L65 80 L75 40 L45 40"
              stroke="#1B4265" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="35" cy="90" r="5" fill="#88C140"/>
            <circle cx="60" cy="90" r="5" fill="#88C140"/>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>
            <span style={{ color: "#1B4265" }}>DISTRICT</span>{" "}
            <span style={{ color: "#88C140" }}>KART</span>
          </span>
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.5px" }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
          Sign in to your marketplace account
        </p>

        {wasRegistered && !error && (
          <div style={{
            background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A",
            borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600,
            marginBottom: 20, textAlign: "center",
          }}>
            Registration successful! Please sign in below.
          </div>
        )}

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626",
            borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1.5px solid #E5E7EB", background: "#fff",
                fontSize: 14, color: "#111827", outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10,
                  border: "1.5px solid #E5E7EB", background: "#fff",
                  fontSize: 14, color: "#111827", outline: "none",
                  transition: "border-color 0.2s", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9CA3AF", padding: 0, display: "flex",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "13px 20px", borderRadius: 12,
              background: loading ? "#9CA3AF" : "#4F46E5",
              color: "#fff", fontSize: 14, fontWeight: 700,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s", marginTop: 4,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                  style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" opacity="0.75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#6B7280" }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" style={{ color: "#4F46E5", fontWeight: 700,
            textDecoration: "none", borderBottom: "1.5px solid #4F46E5" }}>
            Create Account
          </Link>
        </div>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: "#6B7280" }}>
          Want to sell locally?{" "}
          <Link href="/vendor/register" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
            Open your shop
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#eef2ff", fontWeight: 700, color: "#4F46E5" }}>
        Loading…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
