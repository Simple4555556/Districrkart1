"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";

interface SubCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  subCategoryId: string;
  subCategory?: { name: string };
}

interface Shop {
  id: string;
  name: string;
  vendor?: { phone: string | null };
}

interface ShopProductsProps {
  products: Product[];
  subcategories: SubCategory[];
  shop: Shop;
}

export default function ShopProducts({ products, subcategories, shop }: ShopProductsProps) {
  const [activeSub, setActiveSub] = useState("ALL");

  const filtered =
    activeSub === "ALL"
      ? products
      : products.filter((p) => p.subCategoryId === activeSub);

  return (
    <div>
      {/* Subcategory Filter Navbar */}
      {subcategories.length > 0 && (
        <div style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 28,
          scrollbarWidth: "none",
        }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          <button
            onClick={() => setActiveSub("ALL")}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1.5px solid",
              borderColor: activeSub === "ALL" ? "#16a34a" : "#E5E7EB",
              background: activeSub === "ALL" ? "#16a34a" : "var(--bg-primary)",
              color: activeSub === "ALL" ? "#fff" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            All
          </button>

          {subcategories.map((sub) => {
            const active = activeSub === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSub(sub.id)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "1.5px solid",
                  borderColor: active ? "#16a34a" : "#E5E7EB",
                  background: active ? "#16a34a" : "var(--bg-primary)",
                  color: active ? "#fff" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      <div className="product-grid-4">
        {filtered.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            shop={shop}
            priority={idx === 0}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: "1 / -1", textAlign: "center", padding: "80px 24px",
            color: "#A3A3A3", border: "2px dashed #EEEEEE", borderRadius: 20,
          }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📦</p>
            <p style={{ fontSize: 16 }}>No products in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
