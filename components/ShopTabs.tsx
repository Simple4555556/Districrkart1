"use client";

import { useState } from "react";
import {
  ShoppingBag, Info, Star, MessageCircle, MapPin, Phone, Mail,
  Clock, Instagram, Facebook, Youtube, ThumbsUp, User,
} from "lucide-react";
import ShopProducts from "./ShopProducts";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string | null; image?: string | null };
}

interface ShopTabsProps {
  shop: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    location: string;
    whatsapp: string | null;
    instagram: string | null;
    facebook: string | null;
    youtube: string | null;
    gstNumber: string | null;
    businessType: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  products: any[];
  subcategories: { id: string; name: string }[];
  reviews: Review[];
  vendor: { phone: string | null; email: string | null; name: string | null };
  vendorPhone: string;
  vendorEmail: string;
  shopLocation: string;
}

type Tab = "products" | "reviews" | "about";

/* ─── Helpers ────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ["#16a34a","#2563eb","#9333ea","#dc2626","#d97706","#0891b2","#be185d","#059669"];
function avatarColor(name = "") {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function userInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Star renderer ──────────────────────────────────────────────────── */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? "#FBBF24" : "none"}
          color={i <= rating ? "#FBBF24" : "#D1D5DB"}
        />
      ))}
    </div>
  );
}

/* ─── Rating bar row ─────────────────────────────────────────────────── */
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", width: 12, textAlign: "right" }}>{star}</span>
      <Star size={11} fill="#FBBF24" color="#FBBF24" />
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--bg-tertiary,#f3f4f6)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#FBBF24", borderRadius: 3, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", width: 24, textAlign: "right" }}>{count}</span>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────────── */
export default function ShopTabs({
  shop, products, subcategories, reviews, vendor, vendorPhone, vendorEmail, shopLocation,
}: ShopTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("products");

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const mapSrc = shop.latitude && shop.longitude
    ? `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}&z=15&output=embed`
    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${shopLocation}, Bihar, India`)}`;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "products", label: "Products", icon: <ShoppingBag size={14} />, badge: products.length },
    { key: "reviews",  label: "Reviews",  icon: <Star size={14} />,        badge: reviews.length },
    { key: "about",    label: "About",    icon: <Info size={14} /> },
  ];

  return (
    <>
      {/* ── Navigation Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-light)" }}>
        {tabs.map(({ key, label, icon, badge }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 24px",
                fontSize: 14, fontWeight: active ? 600 : 500,
                color: active ? "#16a34a" : "var(--text-secondary)",
                borderBottom: active ? "2px solid #16a34a" : "2px solid transparent",
                marginBottom: -1,
                background: "none", border: "none",
                borderBottomStyle: "solid",
                borderBottomWidth: 2,
                borderBottomColor: active ? "#16a34a" : "transparent",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              {icon}
              {label}
              {badge !== undefined && badge > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  background: active ? "#dcfce7" : "var(--bg-tertiary,#f3f4f6)",
                  color: active ? "#15803d" : "var(--text-secondary)",
                }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Products Tab ── */}
      {activeTab === "products" && (
        <div className="container container-wide section">
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            marginBottom: 28, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                Our Products
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                {shop.description || "Fresh, natural and quality products for a better you."}
              </p>
            </div>
            <select style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1.5px solid var(--border-default)",
              background: "var(--bg-primary)", color: "var(--text-secondary)",
              fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none",
            }}>
              <option>Sort: Popular</option>
              <option>Sort: Newest</option>
              <option>Sort: Price ↑</option>
              <option>Sort: Price ↓</option>
            </select>
          </div>
          <ShopProducts
            products={products}
            subcategories={subcategories}
            shop={{ id: shop.id, name: shop.name, vendor }}
          />
        </div>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === "reviews" && (
        <div className="container container-wide section">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
            Customer Reviews
          </h3>

          {reviews.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px 24px",
              border: "2px dashed var(--border-light,#e5e7eb)", borderRadius: 16,
              color: "var(--text-secondary)",
            }}>
              <Star size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No reviews yet</p>
              <p style={{ fontSize: 13 }}>Be the first to leave a review after your purchase.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}>
              {/* Left: rating summary */}
              <div style={{
                background: "var(--bg-primary)", border: "1px solid var(--border-light)",
                borderRadius: 16, padding: 24, position: "sticky", top: 20,
              }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                    {avgRating.toFixed(1)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 4px" }}>
                    <Stars rating={Math.round(avgRating)} size={18} />
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  {ratingCounts.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} total={reviews.length} />
                  ))}
                </div>
                <div style={{
                  marginTop: 16, padding: "10px 14px", borderRadius: 10,
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <ThumbsUp size={13} color="#16a34a" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>
                      {reviews.length > 0
                        ? `${Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100)}%`
                        : "—"} positive
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#16a34a" }}>Customers recommend this shop</p>
                </div>
              </div>

              {/* Right: review cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {reviews.map((review) => (
                  <div key={review.id} style={{
                    background: "var(--bg-primary)", border: "1px solid var(--border-light)",
                    borderRadius: 14, padding: 20,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      {review.user.image ? (
                        <img
                          src={review.user.image}
                          alt={review.user.name ?? "User"}
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                          background: avatarColor(review.user.name ?? ""),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700, color: "#fff",
                        }}>
                          {userInitials(review.user.name ?? "")}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
                              {review.user.name ?? "Anonymous"}
                            </p>
                            <Stars rating={review.rating} size={13} />
                          </div>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {timeAgo(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── About Tab ── */}
      {activeTab === "about" && (
        <div className="container container-wide section">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>

            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* About */}
              {shop.description && (
                <div style={{
                  background: "var(--bg-primary)", border: "1px solid var(--border-light)",
                  borderRadius: 16, padding: 22,
                }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                    About {shop.name}
                  </h4>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    {shop.description}
                  </p>
                  {shop.businessType && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
                      }}>
                        {shop.businessType}
                      </span>
                      {shop.gstNumber && (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                          fontFamily: "monospace",
                        }}>
                          GST: {shop.gstNumber.slice(0, 2)}***{shop.gstNumber.slice(-3)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Contact & Hours */}
              <div style={{
                background: "var(--bg-primary)", border: "1px solid var(--border-light)",
                borderRadius: 16, padding: 22,
              }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
                  Contact & Hours
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MapPin size={16} color="#16a34a" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Location</p>
                      <p style={{ fontSize: 14, color: "var(--text-primary)" }}>{shopLocation}, Bihar</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Clock size={16} color="#16a34a" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Store Hours</p>
                      <p style={{ fontSize: 14, color: "var(--text-primary)" }}>9:00 AM – 7:00 PM · Open all days</p>
                    </div>
                  </div>

                  {vendorPhone && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Phone size={16} color="#16a34a" />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Phone</p>
                        <a href={`tel:${vendorPhone}`} style={{ fontSize: 14, color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>{vendorPhone}</a>
                      </div>
                    </div>
                  )}

                  {vendorEmail && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Mail size={16} color="#16a34a" />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Email</p>
                        <a href={`mailto:${vendorEmail}`} style={{ fontSize: 14, color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>{vendorEmail}</a>
                      </div>
                    </div>
                  )}
                </div>

                {vendorPhone && (
                  <a
                    href={`https://wa.me/${vendorPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank" rel="noreferrer"
                    style={{
                      marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8,
                      background: "#25D366", color: "#fff", padding: "10px 20px",
                      borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
                    }}
                  >
                    <MessageCircle size={16} /> Chat on WhatsApp
                  </a>
                )}
              </div>

              {/* Social Links */}
              {(shop.instagram || shop.facebook || shop.youtube || shop.whatsapp) && (
                <div style={{
                  background: "var(--bg-primary)", border: "1px solid var(--border-light)",
                  borderRadius: 16, padding: 22,
                }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
                    Follow Us
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {shop.whatsapp && (
                      <a href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, background: "#25D366", color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    )}
                    {shop.instagram && (
                      <a href={shop.instagram.startsWith("http") ? shop.instagram : `https://instagram.com/${shop.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, background: "#E1306C", color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                        <Instagram size={14} /> Instagram
                      </a>
                    )}
                    {shop.facebook && (
                      <a href={shop.facebook.startsWith("http") ? shop.facebook : `https://facebook.com/${shop.facebook}`} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, background: "#1877F2", color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                        <Facebook size={14} /> Facebook
                      </a>
                    )}
                    {shop.youtube && (
                      <a href={shop.youtube.startsWith("http") ? shop.youtube : `https://youtube.com/${shop.youtube}`} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, background: "#FF0000", color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                        <Youtube size={14} /> YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Map */}
            <div style={{
              background: "var(--bg-primary)", border: "1px solid var(--border-light)",
              borderRadius: 16, overflow: "hidden",
              position: "sticky", top: 20,
            }}>
              <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border-light)" }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                  Find Us on Map
                </h4>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{shopLocation}, Bihar</p>
              </div>
              <iframe
                src={mapSrc}
                width="100%" height="380"
                style={{ border: 0, display: "block" }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${shop.name} location`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
