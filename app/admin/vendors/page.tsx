"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Shop {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  vendor: {
    name: string;
    email: string;
    phone: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function AdminVendorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modal State
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors?status=${activeTab}`);
      const data = await res.json();
      if (res.ok) setShops(data.shops);
      else throw new Error(data.error);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?role=admin");
    else if (status === "authenticated" && (session?.user as any).role === "ADMIN") fetchShops();
  }, [status, session, router, fetchShops]);

  const handleStatusUpdate = async (shopId: string, newStatus: string, reason?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, status: newStatus, rejectionReason: reason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Shop ${newStatus.toLowerCase()} successfully`, "success");
        setRejectModal(null);
        setRejectReason("");
        fetchShops();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || loading) return <div className="flex h-screen items-center justify-center font-bold text-gray-400">Loading Moderation Desk...</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 ${
                toast.type === "error" ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === "error" ? "bg-rose-500" : "bg-emerald-500"} animate-pulse`} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRejectModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-3xl border border-slate-100"
             >
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">Reject Application</h2>
                <p className="text-slate-500 text-sm mb-6">Please provide a clear reason for rejecting <strong>{rejectModal.name}</strong>. This will be shown to the vendor.</p>
                
                <textarea 
                    value={rejectReason} 
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Incomplete shop description or invalid contact info..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all min-h-[120px] mb-6 resize-none"
                />

                <div className="flex gap-4">
                    <button 
                        onClick={() => setRejectModal(null)}
                        className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => handleStatusUpdate(rejectModal.id, "REJECTED", rejectReason)}
                        disabled={!rejectReason.trim() || isSubmitting}
                        className="flex-1 bg-rose-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-rose-700 transition-all disabled:opacity-50 shadow-lg shadow-rose-200"
                    >
                        {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 bg-[#1B4265] text-white flex flex-col flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
        <div className="p-8 border-b border-white/10 relative z-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 font-bold text-xl tracking-tight">
             <span className="w-8 h-8 rounded-lg bg-[#88C140] flex items-center justify-center text-white">D</span>
             <span>DISTRICT KART</span>
          </Link>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">Moderator Console</p>
        </div>
        <nav className="flex-1 p-6 space-y-2 relative z-10">
          <button onClick={() => router.push("/admin")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">
             📊 System Overview
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#88C140]/20 border border-[#88C140]/30 transition-all">
             🏪 Vendor Moderation
          </button>
        </nav>
        <div className="p-6 border-t border-white/10 relative z-10">
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">
             🚪 Exit Console
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
            <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Vendor Management</h1>
                <p className="text-xs text-slate-400 font-medium">Review and moderate shop applications</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {["PENDING", "APPROVED", "REJECTED"].map((t) => (
                    <button 
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === t ? "bg-white text-[#1B4265] shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            {["Shop & Details", "Vendor Info", "Status", "Date", "Actions"].map((h) => (
                                <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {shops.map((shop) => (
                            <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-6 min-w-[300px]">
                                    <p className="font-extrabold text-slate-900 mb-1">{shop.name}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{shop.description}</p>
                                </td>
                                <td className="px-6 py-6">
                                    <p className="font-bold text-slate-800 text-xs">{shop.vendor.name}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">{shop.vendor.email}</p>
                                    <p className="text-[11px] text-[#88C140] font-bold mt-1">📞 {shop.vendor.phone}</p>
                                </td>
                                <td className="px-6 py-6">
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-extrabold border uppercase tracking-tight ${STATUS_COLORS[shop.status]}`}>
                                        {shop.status}
                                    </span>
                                </td>
                                <td className="px-6 py-6">
                                    <p className="text-xs text-slate-400 font-medium">{new Date(shop.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-6">
                                    {shop.status === "PENDING" ? (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleStatusUpdate(shop.id, "APPROVED")}
                                                disabled={isSubmitting}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => setRejectModal({ id: shop.id, name: shop.name })}
                                                disabled={isSubmitting}
                                                className="border border-rose-200 text-rose-600 px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-rose-50 transition-all disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-slate-400 italic">No further actions</p>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {shops.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                        </div>
                                        <p className="text-slate-400 font-bold text-sm">No shops found with status {activeTab}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
      </main>
    </div>
  );
}
