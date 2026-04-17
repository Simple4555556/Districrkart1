"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface MainCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  _count: { subCategories: number };
}

// Fallback gradient palette — cycles through for visual variety
const GRADIENTS = [
  "linear-gradient(135deg, #ff6b35, #f7c948)",
  "linear-gradient(135deg, #e44d26, #f16529)",
  "linear-gradient(135deg, #722ed1, #b37feb)",
  "linear-gradient(135deg, #52c41a, #95de64)",
  "linear-gradient(135deg, #1890ff, #69c0ff)",
  "linear-gradient(135deg, #cf1322, #ff4d4f)",
  "linear-gradient(135deg, #5b3a1a, #8B4513)",
  "linear-gradient(135deg, #eb2f96, #ff85c0)",
  "linear-gradient(135deg, #08979c, #36cfc9)",
  "linear-gradient(135deg, #531dab, #9254de)",
];

// Static fallback categories shown while real ones load (or if DB is empty)
const FALLBACK_CATEGORIES: MainCategory[] = [
  { id: "f1", name: "Food",        icon: "🍔", _count: { subCategories: 0 } },
  { id: "f2", name: "Cakes",       icon: "🎂", _count: { subCategories: 0 } },
  { id: "f3", name: "Clothes",     icon: "👗", _count: { subCategories: 0 } },
  { id: "f4", name: "Electronics", icon: "📱", _count: { subCategories: 0 } },
  { id: "f5", name: "Shoes",       icon: "👟", _count: { subCategories: 0 } },
];

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<MainCategory[]>(FALLBACK_CATEGORIES);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories?.length > 0) {
          setCategories(d.categories);
          setActiveIdx(0);
        }
      })
      .catch(() => {}); // silently fall back
  }, []);

  const activeCat = categories[activeIdx];

  // Generate a visual "sample card" grid for the active category
  const sampleCards = Array.from({ length: 5 }, (_, i) => ({
    label: `${activeCat.icon} ${activeCat.name} ${i + 1}`,
    gradient: GRADIENTS[(activeIdx * 5 + i) % GRADIENTS.length],
  }));

  return (
    <section className="section section-dark" id="sample-showcase">
      <div className="container container-wide">
        <div className="section-header" style={{ color: "#fff" }}>
          <span className="text-overline" style={{ color: "rgba(255,255,255,0.5)" }}>
            Categories
          </span>
          <h2 className="text-h2" style={{ color: "#fff" }}>
            Browse {activeCat.icon} {activeCat.name}
          </h2>
          <p className="text-body" style={{ color: "rgba(255,255,255,0.6)" }}>
            Discover premium local vendors offering the best in every category.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="shopall-tabs" style={{ marginBottom: 36 }}>
          {categories.map((cat, idx) => {
            const active = idx === activeIdx;
            return (
              <motion.button
                key={cat.id}
                className={`shopall-tab${active ? " active" : ""}`}
                onClick={() => setActiveIdx(idx)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                style={
                  active
                    ? { background: "#fff", color: "#000", borderColor: "#fff" }
                    : { background: "transparent", color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.25)" }
                }
              >
                <span style={{ marginRight: 6 }}>{cat.icon}</span>
                {cat.name}
              </motion.button>
            );
          })}
        </div>

        {/* Sample Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            className="sample-grid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            {sampleCards.map((card, i) => (
              <motion.div
                key={`${activeIdx}-${i}`}
                className="sample-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <Link href={`/category/${encodeURIComponent(activeCat.name.toLowerCase())}`}>
                  <div className="sample-placeholder" style={{ background: card.gradient }} />
                  <div className="sample-label">
                    <span>{card.label}</span>
                  </div>
                  <div className="sample-overlay">
                    <div className="sample-overlay-inner">
                      <span>{activeCat.name}</span>
                      <span className="sample-shop-now">Shop Now →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* View All link */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            href={`/category/${encodeURIComponent(activeCat.name.toLowerCase())}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 14,
              transition: "background 0.2s",
            }}
          >
            View All {activeCat.icon} {activeCat.name} Shops →
          </Link>
        </div>
      </div>
    </section>
  );
}
