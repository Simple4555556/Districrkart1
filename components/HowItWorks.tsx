"use client";

import { motion, type Variants } from "framer-motion";
import { Search, ShoppingCart, Package } from "lucide-react";
import React from "react";

const steps = [
  {
    num: "01",
    Icon: Search,
    color: "#3B82F6",
    bg: "#EFF6FF",
    title: "Browse Local Shops",
    description:
      "Explore verified local shops in Samastipur. Filter by category, location, or what you're craving.",
  },
  {
    num: "02",
    Icon: ShoppingCart,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    title: "Add to Cart",
    description:
      "Pick your favourite products, check prices and reviews, then add them to your cart with one tap.",
  },
  {
    num: "03",
    Icon: Package,
    color: "#10B981",
    bg: "#ECFDF5",
    title: "Get It Delivered",
    description:
      "Place your order and get it delivered right to your doorstep. Fast, reliable, and hassle-free.",
  },
];

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15 },
  }),
};

export default function HowItWorks() {
  return (
    <section className="section section-alt" id="how-it-works">
      <div className="container">
        <motion.div
          className="section-header"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="text-overline">How It Works</span>
          <h2 className="text-h2">Start in 3 Simple Steps</h2>
          <p className="text-body">From sign-up to your first order — we&apos;ve made it effortless</p>
        </motion.div>

        <div className="hiw-grid">
          {steps.map((step, i) => {
            const { Icon } = step;
            return (
              <React.Fragment key={step.num}>
                <motion.div
                  className="hiw-card"
                  variants={cardVariants}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <div className="hiw-icon-wrap" style={{ background: step.bg }}>
                    <Icon size={28} color={step.color} strokeWidth={2} />
                  </div>
                  <div className="hiw-step-num" style={{ color: step.color }}>{step.num}</div>
                  <h4 className="text-h4">{step.title}</h4>
                  <p className="hiw-desc">{step.description}</p>
                </motion.div>

                {i < steps.length - 1 && (
                  <div className="hiw-arrow" aria-hidden="true">
                    <svg width="36" height="16" viewBox="0 0 36 16" fill="none">
                      <path
                        d="M0 8H32M26 2L34 8L26 14"
                        stroke="#D1D5DB"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
