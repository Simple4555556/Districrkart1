"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const features = [
  "No setup fees, ever",
  "Easy product & order management",
  "Real-time order tracking",
  "Secure COD & online payments",
];

export default function ShopCTA() {
  return (
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="container">
        <motion.div
          className="cta-banner-enhanced"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Left: text + features */}
          <div className="cta-enhanced-content">
            <h2>
              Transform your local business into a thriving online store.
            </h2>
            <p>
              Join hundreds of vendors already selling on District Kart.
              Start selling today — completely free.
            </p>
            <ul className="cta-feature-list">
              {features.map((f) => (
                <li key={f} className="cta-feature-item">
                  <CheckCircle2 size={16} color="#059669" strokeWidth={2.5} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: CTA */}
          <div className="cta-enhanced-actions">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/vendor/register" className="btn btn-primary btn-lg">
                Start Your Shop
              </Link>
            </motion.div>
            <p className="hero-sub-text" style={{ marginTop: 12 }}>
              Free forever. Upgrade anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
