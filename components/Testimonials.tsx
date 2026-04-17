"use client";

import { motion, type Variants } from "framer-motion";

const reviews = [
  {
    id: 1,
    rating: 5,
    content:
      "District Kart transformed how I shop locally. I can now browse my favourite stores and get everything delivered — it\u2019s like having the whole market at my fingertips.",
    name: "Priya Sharma",
    role: "Regular Customer",
    initials: "PS",
    cardClass: "testimonial-card-green",
    avatarBg: "#DCFCE7",
    avatarColor: "#166534",
  },
  {
    id: 2,
    rating: 5,
    content:
      "Setting up my shop was incredibly easy. Within a day I had my products listed and orders started coming in. The vendor dashboard gives me full control over everything.",
    name: "Rahul Verma",
    role: "Electronics Vendor",
    initials: "RV",
    cardClass: "testimonial-card-blue",
    avatarBg: "#DBEAFE",
    avatarColor: "#1E40AF",
  },
  {
    id: 3,
    rating: 4,
    content:
      "The delivery is always on time and the product quality from local vendors is amazing. District Kart has truly bridged the gap between local shops and online convenience.",
    name: "Anita Kumari",
    role: "Cake Shop Owner",
    initials: "AK",
    cardClass: "testimonial-card-cream",
    avatarBg: "#FEF3C7",
    avatarColor: "#92400E",
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12 },
  }),
};

export default function Testimonials() {
  return (
    <section className="section" id="testimonials">
      <div className="container container-wide">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-h2">Powering the dreams of local businesses</h2>
          <p className="text-body">See what our community has to say about District Kart</p>
        </motion.div>

        <div className="grid grid-3">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              className={`testimonial-card ${review.cardClass}`}
              variants={cardVariants}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <div>
                {/* Decorative quote mark */}
                <div className="testimonial-quote-mark">&ldquo;</div>

                {/* Stars */}
                <div
                  className="stars"
                  style={{ marginBottom: 16 }}
                  aria-label={`Rating: ${review.rating} out of 5 stars`}
                >
                  {"★".repeat(review.rating)}
                  {review.rating < 5 && (
                    <span className="empty">{"★".repeat(5 - review.rating)}</span>
                  )}
                </div>

                <p className="quote">{review.content}</p>
              </div>

              <div className="testimonial-author">
                <div
                  className="testimonial-avatar"
                  style={{ background: review.avatarBg, color: review.avatarColor }}
                >
                  {review.initials}
                </div>
                <div className="testimonial-info">
                  <div className="name">{review.name}</div>
                  <div className="role">{review.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
