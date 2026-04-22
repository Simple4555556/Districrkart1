"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { User, MapPin, Menu, X, ShoppingCart, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useSession } from "next-auth/react";

export default function Header() {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <HeaderInner />
    </Suspense>
  );
}

function HeaderSkeleton() {
  return (
    <header style={{ position: 'sticky', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #e5e7eb', zIndex: 50, padding: '0 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', height: 72 }}>
        <div style={{ width: 150, height: 38, background: '#f0f0f0', borderRadius: 8 }} />
      </div>
    </header>
  );
}

function HeaderInner() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const loc = searchParams?.get("loc") || "all";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const userInitial = sessionUser?.name?.charAt(0)?.toUpperCase() || "U";

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLoc = e.target.value;
    if (newLoc === "all") {
      router.push("/");
    } else {
      router.push(`/?loc=${newLoc}`);
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/category/food", label: "Food" },
    { href: "/category/clothes", label: "Clothes" },
    { href: "/category/electronics", label: "Electronics" },
    { href: "/category/shoes", label: "Shoes" },
  ];

  const iconColor = isDark ? "#94A3B8" : "#374151";

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .nav-link {
          position: relative;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 15px;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
        }
        .nav-link:hover {
          color: var(--blue-600);
          background: rgba(37, 99, 235, 0.08);
          transform: translateY(-2px);
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #1B4F72, #4CAF50);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
          border-radius: 2px;
        }
        .nav-link:hover::after { width: 60%; }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          background: transparent;
        }
        .action-btn:hover {
          background: var(--bg-secondary);
          color: var(--blue-600);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        .action-btn svg { transition: transform 0.3s ease; }
        .action-btn:hover svg { transform: scale(1.15); }
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid var(--border-light);
          background: var(--bg-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .theme-toggle-btn:hover {
          background: var(--bg-secondary);
          border-color: var(--border-default);
          color: var(--text-primary);
          transform: scale(1.08);
        }
        .cta-btn {
          background: linear-gradient(135deg, #1B4F72 0%, #2563eb 100%);
          color: white;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 20px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(27, 79, 114, 0.3);
          white-space: nowrap;
        }
        .cta-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(27, 79, 114, 0.4);
          background: linear-gradient(135deg, #153d5a 0%, #1d4ed8 100%);
        }
        .cta-btn:active { transform: translateY(-1px) scale(0.98); }
        .mobile-toggle {
          display: none;
          padding: 10px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .mobile-toggle:hover { background: var(--bg-secondary); }
        .mobile-toggle:active { transform: scale(0.95); }
        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .mobile-overlay.open { opacity: 1; visibility: visible; }
        .mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 85%;
          max-width: 320px;
          height: 100%;
          background: var(--bg-primary);
          z-index: 101;
          padding: 24px;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.2);
          overflow-y: auto;
        }
        .mobile-overlay.open .mobile-drawer { transform: translateX(0); }
        .mobile-close {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 8px;
          border-radius: 10px;
          border: none;
          background: var(--bg-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .mobile-close:hover {
          background: var(--border-default);
          transform: rotate(90deg);
        }
        .mobile-link {
          display: block;
          padding: 16px 0;
          color: var(--text-primary);
          font-weight: 500;
          font-size: 17px;
          text-decoration: none;
          border-bottom: 1px solid var(--border-light);
          transition: all 0.3s ease;
        }
        .mobile-link:hover {
          color: var(--blue-600);
          padding-left: 12px;
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.06), transparent);
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: transform 0.3s ease;
        }
        .logo-container:hover { transform: scale(1.03); }
        .logo-text {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .desktop-actions { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (max-width: 480px) {
          .logo-text { font-size: 18px; }
        }
      `}</style>

      <header style={{
        ...styles.header,
        background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderBottom: isDark ? '1px solid #1E293B' : '1px solid #e5e7eb',
      }}>
        <div style={styles.headerInner}>
          {/* Logo */}
          <Link href="/" className="logo-container" aria-label="District Kart Home">
            <div style={styles.logoIcon}>
              <MapPin size={22} color="#4CAF50" strokeWidth={2.5} />
            </div>
            <span className="logo-text">
              <span style={{ color: '#1B4F72' }}>District</span>{' '}
              <span style={{ color: '#4CAF50' }}>Kart</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={styles.nav}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right-side controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Desktop-only links */}
            <div className="desktop-actions" style={styles.actions}>
              {session ? (
                <Link href="/dashboard" className="action-btn" title="My Account" style={{ padding: "4px" }}>
                  {sessionUser?.image ? (
                    <img src={sessionUser.image} alt={sessionUser.name || "User"} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #4CAF50" }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #1B4F72, #4CAF50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", border: "2px solid #4CAF50" }}>
                      {userInitial}
                    </div>
                  )}
                </Link>
              ) : (
                <Link href="/auth/login" className="action-btn">
                  <User size={18} />
                  <span>Login</span>
                </Link>
              )}
              <Link href="/cart" className="action-btn" aria-label="View Cart">
                <ShoppingCart size={18} />
                <span>Cart</span>
              </Link>
              <Link href="/vendor/login" className="cta-btn">
                Open Your Shop
              </Link>
            </div>

            {/* Theme toggle — always visible */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="mobile-toggle"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} color={iconColor} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-overlay ${isMenuOpen ? "open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
          <button
            className="mobile-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} color={iconColor} />
          </button>

          {/* Mobile Logo + Theme Toggle */}
          <div style={{ marginBottom: 32, paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="logo-text">
              <span style={{ color: '#1B4F72' }}>District</span>{' '}
              <span style={{ color: '#4CAF50' }}>Kart</span>
            </span>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav>
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Actions */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {session ? (
              <Link
                href="/dashboard"
                className="action-btn"
                onClick={() => setIsMenuOpen(false)}
                style={{ background: isDark ? '#1E293B' : '#f3f4f6', justifyContent: 'center', padding: '14px 20px', borderRadius: 12 }}
              >
                {sessionUser?.image ? (
                  <img src={sessionUser.image} alt={sessionUser.name || "User"} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1B4F72,#4CAF50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                    {userInitial}
                  </div>
                )}
                <span>My Account</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="action-btn"
                onClick={() => setIsMenuOpen(false)}
                style={{ background: isDark ? '#1E293B' : '#f3f4f6', justifyContent: 'center', padding: '14px 20px', borderRadius: 12 }}
              >
                <User size={18} />
                <span>Login</span>
              </Link>
            )}
            <Link
              href="/cart"
              className="action-btn"
              onClick={() => setIsMenuOpen(false)}
              style={{ background: isDark ? '#1E293B' : '#f3f4f6', justifyContent: 'center', padding: '14px 20px', borderRadius: 12 }}
            >
              <ShoppingCart size={18} />
              <span>Cart</span>
            </Link>
            <Link
              href="/vendor/login"
              className="cta-btn"
              onClick={() => setIsMenuOpen(false)}
              style={{ textAlign: 'center', display: 'block' }}
            >
              Open Your Shop
            </Link>
          </div>

          {/* Location Selector */}
          <div style={{ marginTop: 32 }}>
            <label style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? '#94A3B8' : '#6b7280',
              marginBottom: 10,
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Location
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MapPin size={16} color={isDark ? '#94A3B8' : '#6b7280'} style={{ position: 'absolute', left: 14 }} />
              <select
                value={loc}
                onChange={handleLocationChange}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 40px',
                  borderRadius: 12,
                  border: isDark ? '2px solid #334155' : '2px solid #e5e7eb',
                  background: isDark ? '#1E293B' : 'white',
                  fontSize: 15,
                  color: isDark ? '#F1F5F9' : '#374151',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <option value="all">All Locations</option>
                <option value="Samastipur">Samastipur</option>
                <option value="Nawabganj">Nawabganj</option>
              </select>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    backdropFilter: 'blur(12px)',
    zIndex: 50,
    padding: '0 24px',
  },
  headerInner: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 72,
    gap: 32,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
};
