"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Tab = "overview" | "vendors" | "users";

interface Shop {
  id: string; name: string; description: string; status: string;
  rejectionReason?: string; isActive: boolean;
  vendor: { id: string; name: string; email: string; createdAt: string; isActive: boolean };
  _count: { products: number; orders: number };
}
interface Stats {
  users: { total: number; customers: number; vendors: number; admins: number };
  shops: { total: number; pending: number; approved: number; rejected: number };
  products: { total: number };
  orders: { total: number; byStatus: Record<string, number>; totalRevenuePaid: number };
  recentOrders: any[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string; isActive: boolean }[];
}

const SHOP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopFilter, setShopFilter] = useState<string>("PENDING");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState<{ shopId: string; shopName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?role=admin");
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") router.push("/");
  }, [status, session, router]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/stats");
    const d = await r.json();
    setStats(d);
    setLoading(false);
  }, []);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    const url = shopFilter !== "all" ? `/api/admin/vendors?status=${shopFilter}` : "/api/admin/vendors";
    const r = await fetch(url);
    const d = await r.json();
    setShops(d.shops ?? []);
    setLoading(false);
  }, [shopFilter]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (tab === "overview") fetchStats();
    if (tab === "vendors") fetchShops();
    if (tab === "users") fetchStats(); // reuse stats.recentUsers for now
  }, [tab, status, shopFilter, fetchStats, fetchShops]);

  const updateShopStatus = async (shopId: string, newStatus: "APPROVED" | "REJECTED", reason?: string) => {
    const body: any = { shopId, status: newStatus };
    if (newStatus === "REJECTED") body.rejectionReason = reason;

    const r = await fetch("/api/admin/vendors", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      showToast(`Shop ${newStatus.toLowerCase()} successfully`);
      setRejectModal(null); setRejectReason("");
      fetchShops();
    } else {
      const d = await r.json();
      showToast(`Error: ${d.error}`, "error");
    }
  };

  if (status === "loading") return <div className="flex h-screen items-center justify-center text-gray-400 font-bold">Accessing Admin Panel...</div>;

  const user = session?.user as any;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden text-gray-900 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === "error" ? "bg-red-600" : "bg-gray-900"} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Rejection modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-in-center">
            <h2 className="text-xl font-extrabold mb-1">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-6">Provide a clear reason for rejecting <strong>{rejectModal.shopName}</strong>.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} placeholder="e.g. Incomplete documentation or prohibited products..."
              className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6 shadow-sm transition-all" />
            <div className="flex gap-4">
              <button onClick={() => updateShopStatus(rejectModal.shopId, "REJECTED", rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-100">
                Confirm Rejection
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 border border-gray-200 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-gray-950 text-white absolute top-0 left-0 right-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs">A</div>
          <span className="font-extrabold text-sm tracking-tight uppercase">Admin Panel</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open sidebar menu"
          className="p-2 -mr-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 text-white flex flex-col flex-shrink-0 transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-800 flex items-start justify-between lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm shadow-inner uppercase">
              {user?.name?.[0] ?? "A"}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{user?.name ?? "Admin"}</p>
              <p className="text-[10px] uppercase font-bold text-red-400/60 tracking-widest">Platform Admin</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close sidebar menu"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-400 -mt-1 -mr-2 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {(["overview", "vendors", "users"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${
                tab === t ? "bg-red-600 text-white shadow-xl shadow-red-900/40" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}>
              {{ overview: "📊 Overview", vendors: "🏪 Vendors", users: "👥 Platform Users" }[t]}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {tab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h1 className="text-2xl font-black mb-1">Platform Metrics</h1>
              <p className="text-gray-500 text-sm mb-8 font-medium">Real-time health monitor of DistrictKart marketplace</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
                {[
                  { label: "Total Users", value: stats?.users.total, icon: "👥", color: "bg-blue-50/80 text-blue-700" },
                  { label: "Active Shops", value: stats?.shops.approved, icon: "🏪", color: "bg-purple-50/80 text-purple-700" },
                  { label: "Total Orders", value: stats?.orders.total, icon: "🛒", color: "bg-amber-50/80 text-amber-700" },
                  { label: "Paid Revenue", value: `₹${((stats?.orders.totalRevenuePaid ?? 0) / 1000).toFixed(1)}K`, icon: "💰", color: "bg-green-50/80 text-green-700" },
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-3xl p-6 border border-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <div className="text-2xl font-black">{loading ? "…" : (s.value ?? 0)}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1.5 font-black opacity-60">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Recent Orders</h3>
                  <button className="text-[10px] font-black uppercase text-red-600 hover:tracking-widest transition-all">View All</button>
                </div>
                <div className="overflow-x-auto min-w-full">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50/50">
                      <tr>{["Order ID", "Customer", "Shop", "Amount", "Status", "Date"].map(h => (
                        <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(stats?.recentOrders ?? []).map((o: any) => (
                        <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-[11px] font-bold text-gray-400">#{o.id.slice(-8).toUpperCase()}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{o.user?.name}</p>
                            <p className="text-[10px] font-medium text-gray-400">{o.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-600 italic">@{o.shop?.name}</td>
                          <td className="px-6 py-4 font-black">₹{o.totalAmount}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black tracking-wider shadow-sm ${SHOP_STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-[11px] font-bold">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {(!loading && (stats?.recentOrders?.length ?? 0) === 0) && (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">No recent orders found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "vendors" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Vendor Management</h1>
                  <p className="text-gray-500 text-sm">{shops.length} vendors shown</p>
                </div>
                <div className="flex gap-2">
                  {["PENDING", "APPROVED", "REJECTED", "all"].map(f => (
                    <button key={f} onClick={() => setShopFilter(f)}
                      className={`text-xs px-4 py-2 rounded-xl font-medium transition-colors ${
                        shopFilter === f ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {shops.map(shop => (
                  <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{shop.name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${SHOP_STATUS_COLORS[shop.status]}`}>{shop.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{shop.description}</p>
                    <div className="flex gap-3 pt-4 border-t border-gray-50">
                      {shop.status === "PENDING" && (
                        <>
                          <button onClick={() => updateShopStatus(shop.id, "APPROVED")} className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">Approve</button>
                          <button onClick={() => setRejectModal({ shopId: shop.id, shopName: shop.name })} className="border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "users" && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Users</h1></div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{["User", "Email", "Role", "Joined"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(stats?.recentUsers ?? []).map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium">{u.name}</td>
                        <td className="px-5 py-4 text-gray-500">{u.email}</td>
                        <td className="px-5 py-4"><span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{u.role}</span></td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
