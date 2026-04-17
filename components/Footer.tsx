"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const;

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container container-wide">
        <motion.div
          className="footer-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand */}
          <motion.div variants={itemVariants} className="footer-brand">
            <motion.div
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}
              whileHover={{ x: 4 }}
            >
              <Image
                src="/logo-icon.png"
                alt="District Kart"
                width={32}
                height={32}
                style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
              />
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>District Kart</span>
            </motion.div>
            <p>
              Samastipur&apos;s premier hyperlocal marketplace. Connecting local vendors with customers for a seamless shopping experience.
            </p>
          </motion.div>

          {/* Product */}
          <motion.div variants={itemVariants} className="footer-col">
            <h5>Product</h5>
            <motion.div className="space-y-2">
              {[
                { href: "/", label: "Marketplace" },
                { href: "/category/food", label: "Food & Cakes" },
                { href: "/category/clothes", label: "Clothes" },
                { href: "/category/electronics", label: "Electronics" },
                { href: "/category/shoes", label: "Shoes" },
              ].map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link href={link.href}>{link.label}</Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Company */}
          <motion.div variants={itemVariants} className="footer-col">
            <h5>Company</h5>
            <motion.div className="space-y-2">
              {[
                { href: "/", label: "About" },
                { href: "/", label: "Blog" },
                { href: "/", label: "Careers" },
                { href: "/", label: "Contact" },
              ].map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link href={link.href}>{link.label}</Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants} className="footer-col">
            <h5>Support</h5>
            <motion.div className="space-y-2">
              {[
                { href: "/", label: "Help Center" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "https://wa.me/919142717690", label: "WhatsApp Support", external: true },
              ].map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="footer-bottom"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <span>© {new Date().getFullYear()} District Kart. All rights reserved.</span>
          <motion.div
            className="footer-social"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { href: "https://twitter.com", label: "Twitter" },
              { href: "https://instagram.com", label: "Instagram" },
              { href: "https://linkedin.com", label: "LinkedIn" },
            ].map((social) => (
              <motion.a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {social.label}
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
