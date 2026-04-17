"use client";

import { useState } from "react";
import Link from "next/link";

interface ShopData {
  id: string;
  name: string;
  description: string | null;
  category?: string | null;
}

const categoryTabs = [
  { label: "All Shops", cat: "all" },
  { label: "Food", cat: "food" },
  { label: "Cakes", cat: "cakes" },
  { label: "Clothes", cat: "clothes" },
  { label: "Electronics", cat: "electronics" },
  { label: "Shoes", cat: "shoes" },
];

// Generate unique gradient for each shop banner based on name
function getShopGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
    "linear-gradient(135deg, #F093FB 0%, #F5576C 100%)",
    "linear-gradient(135deg, #4ECDC4 0%, #556270 100%)",
    "linear-gradient(135deg, #FA709A 0%, #FEE140 100%)",
    "linear-gradient(135deg, #A8E6CF 0%, #88D4AB 100%)",
    "linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)",
    "linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%)",
    "linear-gradient(135deg, #2CD8D5 0%, #C5C1FF 100%)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export default function DiscoverShops({ shops }: { shops: ShopData[] }) {
  const [activeCat, setActiveCat] = useState("all");

  const filteredShops = activeCat === "all"
    ? shops
    : shops.filter((s) => s.category?.toLowerCase() === activeCat);

  return (
    <section className="section" id="shop-all">
      <div className="container container-wide">
        <div className="section-header">
          <span className="text-overline">Explore</span>
          <h2 className="text-h2">Discover Local Shops</h2>
          <p className="text-body">Browse our curated selection of trusted local vendors</p>
        </div>

        <div className="shopall-tabs" id="shopallTabs">
          {categoryTabs.map((tab) => (
            <button
              key={tab.cat}
              className={`shopall-tab${activeCat === tab.cat ? " active" : ""}`}
              onClick={() => setActiveCat(tab.cat)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="product-grid-4" id="shopAllGrid">
          {filteredShops.length > 0 ? (
            filteredShops.map((shop) => {
              const initial = shop.name?.[0] ?? "S";
              return (
                <div className="vendor-showcase-card" key={shop.id}>
                  <div className="vendor-banner" style={{ background: getShopGradient(shop.name) }}>
                    <div className="vendor-avatar">
                      <div className="vendor-avatar-inner">{initial}</div>
                    </div>
                  </div>
                  <div className="vendor-body">
                    <h4 className="vendor-name">{shop.name}</h4>
                    <div className="vendor-meta">
                      <span className="stars">★★★★★</span>
                      <span className="vendor-rating-num">4.9</span>
                      <span>·</span>
                      <span>Marketplace</span>
                    </div>
                    <p className="vendor-desc">
                      {shop.description || "No description available yet."}
                    </p>
                  </div>
                  <div className="vendor-footer">
                    <span className="status-badge active">● Active</span>
                    <Link href={`/shop/${shop.id}`} className="view-shop-btn">
                      View Shop →
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 24px", color: "#A3A3A3" }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🔍</p>
              <p>No shops found in this category. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
