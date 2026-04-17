"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Store, MessageCircle } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    discount?: number;
    sellingPrice?: number;
    imageUrl: string | null;
    subCategoryId: string;
    subCategory?: { name: string };
  };
  shop: {
    id: string;
    name: string;
    vendor?: {
      phone: string | null;
    };
  };
  priority?: boolean;
}

export default function ProductCard({ product, shop, priority = false }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const hasDiscount   = (product.discount ?? 0) > 0;
  const displayPrice  = hasDiscount ? (product.sellingPrice ?? product.price) : product.price;

  const vendorPhone = shop.vendor?.phone;
  const whatsappUrl = vendorPhone 
    ? `https://wa.me/${vendorPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`I want to buy ${product.name} from ${shop.name} listed on District Kart.`)}`
    : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Failed to add to cart");
      }
      
      // Simple feedback
      alert("Added to cart!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:border-indigo-100 transition-all duration-300 group shadow-sm hover:shadow-xl hover:-translate-y-1">
      {/* Image Container with Hover Overlay */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              title="Order via WhatsApp"
              aria-label={`Order ${product.name} via WhatsApp`}
            >
              <MessageCircle size={20} />
            </a>
          )}
          <Link
            href={`/shop/${shop.id}`}
            className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
            title="Visit Shop"
            aria-label={`Visit ${shop.name} shop`}
          >
            <Store size={20} />
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
            title="Add to Cart"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={20} className={isAdding ? "animate-bounce" : ""} />
          </button>
        </div>

        {/* Category Badge (Visible always) */}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-700 border border-gray-100 shadow-sm">
            {product.subCategory?.name || "Product"}
          </span>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-4 right-4">
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow">
              {product.discount}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 md:p-6">
        <div className="mb-2">
            <Link href={`/shop/${shop.id}`} className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline">
                {shop.name}
            </Link>
        </div>
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1" data-testid="product-name">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            {hasDiscount ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-gray-900 tracking-tighter" data-testid="product-price">
                    ₹{displayPrice}
                  </span>
                  <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-md">
                    {product.discount}% OFF
                  </span>
                </div>
                <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
              </div>
            ) : (
              <span className="text-xl font-black text-gray-900 tracking-tighter" data-testid="product-price">₹{product.price}</span>
            )}
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/btn"
          >
            {isAdding ? "Adding..." : "Quick Add"}
            <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
