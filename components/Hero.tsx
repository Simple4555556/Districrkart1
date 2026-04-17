"use client";

import { motion, type Variants } from "framer-motion";
import { Search, ArrowRight, MapPin, ShoppingBag, Star, Truck } from "lucide-react";

export default function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const stats = [
    { Icon: ShoppingBag, value: "200+", label: "Local Shops" },
    { Icon: Star, value: "5,000+", label: "Happy Customers" },
    { Icon: MapPin, value: "2", label: "Cities Covered" },
    { Icon: Truck, value: "Same Day", label: "Delivery" },
  ];

  return (
    <section className="hero-section" id="heroSection">
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* Location pill */}
          <motion.div
            variants={itemVariants}
            style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}
          >
            <span className="hero-location-pill">
              <MapPin size={13} />
              Now live in Samastipur &amp; Nawabganj
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="hero-title"
            style={{
              background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 55%, #db2777 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Shop locally.
            <br />
            Discover endlessly.
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-subtitle">
            Get everything you need from your favorite local stores in Samastipur —
            food, cakes, clothes, electronics, and more — delivered to your door.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-actions">
            <motion.a
              href="#trending-shops"
              className="btn btn-primary btn-lg"
              whileHover={{ scale: 1.04, boxShadow: "0 16px 32px rgba(0,0,0,0.18)" }}
              whileTap={{ scale: 0.96 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              Start Shopping <ArrowRight size={18} />
            </motion.a>
            <motion.a
              href="/vendor"
              className="btn btn-outline btn-lg"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Open Your Shop
            </motion.a>
          </motion.div>

          {/* Search bar */}
          <motion.div variants={itemVariants} className="hero-search">
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#A3A3A3",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search for shops, food, clothes, electronics..."
                aria-label="Search products"
                style={{ paddingLeft: 52 }}
              />
              <button className="hero-search-btn" type="button">Search</button>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div variants={itemVariants} className="hero-stats-row">
            {stats.map((stat, i) => {
              const { Icon } = stat;
              return (
                <div key={i} style={{ display: "contents" }}>
                  <div className="hero-stat">
                    <Icon size={16} className="hero-stat-icon-el" />
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                  {i < stats.length - 1 && <div className="hero-stat-divider" />}
                </div>
              );
            })}
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
