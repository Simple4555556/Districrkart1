"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ShoppingBag, Truck, MapPin, CheckCircle2, Package,
  ArrowRight, Tag, X, Navigation, Loader2,
} from "lucide-react";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  discount?: number;
  sellingPrice?: number;
  imageUrl?: string;
  shop: { id: string; name: string };
}
interface CartItem { id: string; quantity: number; product: CartProduct }
interface AppliedCoupon { code: string; discountAmount: number; type: string; discount: number }

const effectivePrice = (p: CartProduct) =>
  (p.discount ?? 0) > 0 ? (p.sellingPrice ?? p.price) : p.price;

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [items, setItems]                 = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart]     = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced]     = useState(false);
  const [orderId, setOrderId]             = useState("");

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [locating, setLocating]           = useState(false);
  const [locationError, setLocationError] = useState("");

  // Coupon state
  const [couponCode, setCouponCode]       = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError]     = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const fetchCart = useCallback(async () => {
    setLoadingCart(true);
    try {
      const res = await fetch("/api/cart");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCart();
      const user = session?.user as any;
      setForm(f => ({ ...f, name: user?.name ?? "", phone: user?.phone ?? "" }));
    }
    if (status === "unauthenticated") router.push("/auth/login?callbackUrl=/checkout");
  }, [status, fetchCart, router, session]);

  const subtotal     = items.reduce((acc, i) => acc + effectivePrice(i.product) * i.quantity, 0);
  const deliveryFee  = 40;
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const total        = subtotal + deliveryFee - couponDiscount;

  // ── Live Location ───────────────────────────────────────────────────
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.display_name ?? `${latitude}, ${longitude}`;
          setForm(f => ({ ...f, address: addr }));
        } catch {
          setForm(f => ({ ...f, address: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}` }));
        }
        setLocating(false);
      },
      () => {
        setLocationError("Could not get location. Please enter your address manually.");
        setLocating(false);
      }
    );
  };

  // ── Apply Coupon ────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code:           data.coupon.code,
          discountAmount: data.discountAmount,
          type:           data.coupon.type,
          discount:       data.coupon.discount,
        });
        setCouponError("");
      }
    } catch {
      setCouponError("Failed to apply coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // ── Place Order ─────────────────────────────────────────────────────
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsPlacingOrder(true);

    try {
      const shopGroups: Record<string, CartItem[]> = {};
      for (const item of items) {
        const sid = item.product.shop.id;
        if (!shopGroups[sid]) shopGroups[sid] = [];
        shopGroups[sid].push(item);
      }

      const orderIds: string[] = [];
      for (const [shopId, shopItems] of Object.entries(shopGroups)) {
        const shopSubtotal = shopItems.reduce(
          (a, i) => a + effectivePrice(i.product) * i.quantity, 0
        );
        const shopDelivery = deliveryFee;
        const shopDiscount = appliedCoupon
          ? Math.round((shopSubtotal / subtotal) * couponDiscount * 100) / 100
          : 0;
        const shopTotal = shopSubtotal + shopDelivery - shopDiscount;

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId,
            deliveryAddress: form.address,
            contactNumber:   form.phone,
            paymentMethod:   "COD",
            items: shopItems.map(i => ({
              productId: i.product.id,
              quantity:  i.quantity,
              price:     effectivePrice(i.product),
            })),
            totalAmount: shopTotal,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          orderIds.push(data.order?.id ?? "");
        }
      }

      setOrderId(orderIds[0] ?? "");
      setOrderPlaced(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // order creation failed silently — user sees the form again
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const buildWhatsAppMsg = () => {
    const lines = [
      `*New Order — District Kart*`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Address: ${form.address}`,
      ``,
      `*Items:*`,
      ...items.map(i => `• ${i.product.name} x${i.quantity} — ₹${effectivePrice(i.product) * i.quantity}`),
      ``,
      appliedCoupon ? `Coupon (${appliedCoupon.code}): -₹${couponDiscount}` : null,
      `Delivery: ₹${deliveryFee}`,
      `*Total: ₹${total}* (Cash on Delivery)`,
    ].filter(Boolean);
    return encodeURIComponent(lines.join("\n"));
  };

  // ── Order Success ───────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-green-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Order Placed!</h1>
            {orderId && (
              <p className="text-xs text-gray-400 font-mono mb-2">#{orderId.slice(-10).toUpperCase()}</p>
            )}
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Thank you for shopping with District Kart. Your order is confirmed and the vendor will contact you shortly.
            </p>
            <a
              href={`https://wa.me/?text=${buildWhatsAppMsg()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mb-4 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold py-3.5 rounded-xl transition shadow-lg"
            >
              <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 2.827.734 5.476 2.018 7.782L0 32l8.418-2.002A15.94 15.94 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.184 22.184c-.34.957-1.984 1.826-2.743 1.945-.693.108-1.567.153-2.527-.16-.582-.188-1.33-.437-2.28-.857-4.013-1.733-6.636-5.76-6.836-6.026-.197-.265-1.607-2.14-1.607-4.083 0-1.943 1.018-2.898 1.379-3.294a1.455 1.455 0 0 1 1.055-.496c.264 0 .528.003.759.014.243.013.569-.093.892.68.34.8 1.155 2.742 1.255 2.942.1.2.168.437.033.706-.133.266-.2.432-.397.664-.2.231-.42.517-.6.694-.2.198-.408.412-.174.808.233.397 1.038 1.713 2.229 2.775 1.53 1.363 2.82 1.786 3.218 1.987.397.2.63.166.863-.1.23-.265.99-1.156 1.256-1.553.264-.397.53-.332.895-.2.363.134 2.303 1.087 2.697 1.285.394.2.657.3.755.462.096.16.096.928-.245 1.887z"/>
              </svg>
              Share via WhatsApp
            </a>
            <Link
              href="/user"
              className="w-full mb-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition"
            >
              View My Orders
            </Link>
            <button
              onClick={() => router.push("/")}
              className="w-full text-gray-600 hover:text-indigo-600 font-semibold py-2 text-sm transition"
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === "loading" || loadingCart) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Add items before checking out.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition">
              Go Shopping <ArrowRight size={16} />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Left Column ──────────────────────────────────────────── */}
          <div className="flex-grow space-y-6">

            {/* Delivery Address */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
              </div>

              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input
                      required type="text" placeholder="Janardhan Sharma"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <input
                      required type="tel" placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Address</label>
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={locating}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition"
                    >
                      {locating
                        ? <><Loader2 size={13} className="animate-spin" /> Detecting…</>
                        : <><Navigation size={13} /> Use My Location</>
                      }
                    </button>
                  </div>
                  <textarea
                    required rows={3}
                    placeholder="House No., Street, Landmark, City, PIN"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  />
                  {locationError && (
                    <p className="text-xs text-red-500 ml-1">{locationError}</p>
                  )}
                </div>
              </form>
            </section>

            {/* Coupon */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Tag className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Coupon Code</h2>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Tag size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800 text-sm">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">
                        {appliedCoupon.type === "PERCENTAGE"
                          ? `${appliedCoupon.discount}% off`
                          : `₹${appliedCoupon.discount} off`}
                        {" · "}You save ₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 transition">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition text-sm whitespace-nowrap"
                  >
                    {couponLoading ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-500 mt-2 ml-1">{couponError}</p>
              )}
            </section>

            {/* Payment */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Truck className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Cash on Delivery</h4>
                  <p className="text-sm text-gray-500">Pay when your order arrives at your door</p>
                </div>
                <Truck className="ml-auto w-6 h-6 text-indigo-600" />
              </div>
            </section>
          </div>

          {/* ── Right: Order Summary ───────────────────────────────────── */}
          <div className="lg:w-[380px]">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-[280px] overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p className="text-xs text-gray-400">Qty: {item.quantity} · {item.product.shop.name}</p>
                        {(item.product.discount ?? 0) > 0 && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded">{item.product.discount}% OFF</span>
                        )}
                      </div>
                      {(item.product.discount ?? 0) > 0 && (
                        <p className="text-[11px] text-gray-300 line-through">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 text-sm flex-shrink-0">
                      ₹{(effectivePrice(item.product) * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2.5 border-t border-gray-100 pt-5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">₹{deliveryFee}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag size={12} /> {appliedCoupon.code}
                    </span>
                    <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 font-black text-xl pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                form="checkout-form"
                type="submit"
                disabled={isPlacingOrder}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-2xl transition shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <><Loader2 size={16} className="animate-spin" /> Placing Order…</>
                ) : (
                  <>Place Order · ₹{total.toLocaleString("en-IN")}</>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${buildWhatsAppMsg()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3 rounded-xl transition text-sm"
              >
                <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 2.827.734 5.476 2.018 7.782L0 32l8.418-2.002A15.94 15.94 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.184 22.184c-.34.957-1.984 1.826-2.743 1.945-.693.108-1.567.153-2.527-.16-.582-.188-1.33-.437-2.28-.857-4.013-1.733-6.636-5.76-6.836-6.026-.197-.265-1.607-2.14-1.607-4.083 0-1.943 1.018-2.898 1.379-3.294a1.455 1.455 0 0 1 1.055-.496c.264 0 .528.003.759.014.243.013.569-.093.892.68.34.8 1.155 2.742 1.255 2.942.1.2.168.437.033.706-.133.266-.2.432-.397.664-.2.231-.42.517-.6.694-.2.198-.408.412-.174.808.233.397 1.038 1.713 2.229 2.775 1.53 1.363 2.82 1.786 3.218 1.987.397.2.63.166.863-.1.23-.265.99-1.156 1.256-1.553.264-.397.53-.332.895-.2.363.134 2.303 1.087 2.697 1.285.394.2.657.3.755.462.096.16.096.928-.245 1.887z"/>
                </svg>
                Order via WhatsApp
              </a>

              <p className="mt-3 text-center text-xs text-gray-400">
                By placing the order, you agree to District Kart&apos;s{" "}
                <a href="/terms" className="underline">Terms of Service</a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
