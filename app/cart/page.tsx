"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  discount?: number;
  sellingPrice?: number;
  imageUrl?: string;
  shop: { id: string; name: string; logoUrl?: string };
  subCategory: { id: string; name: string };
}

interface CartItem {
  id: string;
  quantity: number;
  product: CartProduct;
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchCart();
    if (status === "unauthenticated") setLoading(false);
  }, [status, fetchCart]);

  const updateQty = async (productId: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return removeItem(productId);

    setUpdatingId(productId);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: newQty }),
    });
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      )
    );
    setUpdatingId(null);
  };

  const removeItem = async (productId: string) => {
    setUpdatingId(productId);
    await fetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    setUpdatingId(null);
  };

  const effectivePrice = (p: CartProduct) => (p.discount ?? 0) > 0 ? (p.sellingPrice ?? p.price) : p.price;
  const subtotal = items.reduce((acc, i) => acc + effectivePrice(i.product) * i.quantity, 0);
  const deliveryFee = items.length > 0 ? 40 : 0;
  const total = subtotal + deliveryFee;

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm w-full bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to see your cart</h2>
            <p className="text-gray-500 text-sm mb-6">You must be logged in to view your cart.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition"
            >
              Sign In <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm w-full bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything yet.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition"
            >
              Continue Shopping <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-indigo-600" />
          Your Cart
          <span className="text-base font-semibold text-gray-400">({items.length} item{items.length !== 1 ? "s" : ""})</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, overflow: "hidden" }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex gap-4 shadow-sm"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={32} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product.shop.name}</p>
                    <p className="text-indigo-600 font-black text-base sm:text-lg mt-1">
                      ₹{(effectivePrice(item.product) * item.quantity).toLocaleString("en-IN")}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[11px] text-gray-400">
                        ₹{effectivePrice(item.product).toLocaleString("en-IN")} each
                      </p>
                      {(item.product.discount ?? 0) > 0 && (
                        <>
                          <span className="text-[11px] text-gray-300 line-through">₹{item.product.price.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded">{item.product.discount}% OFF</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity + Remove */}
                  <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
                    <button
                      onClick={() => removeItem(item.product.id)}
                      disabled={updatingId === item.product.id}
                      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl border border-gray-100 p-1">
                      <button
                        onClick={() => updateQty(item.product.id, -1, item.quantity)}
                        disabled={updatingId === item.product.id}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-40"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-bold text-sm tabular-nums">
                        {updatingId === item.product.id ? (
                          <span className="inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, 1, item.quantity)}
                        disabled={updatingId === item.product.id}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:w-72 xl:w-80">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="font-extrabold text-gray-900 text-lg mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">₹{deliveryFee}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-gray-900 font-black text-lg">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <Link
                href="/"
                className="mt-3 w-full flex items-center justify-center text-sm text-gray-500 hover:text-indigo-600 font-medium transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
