"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Tab = "overview" | "vendors" | "users" | "categories" | "settings";

interface Shop {
  id: string; name: string; description: string; status: string;
  rejectionReason?: string; isActive: boolean; location: string;
  whatsapp?: string; instagram?: string; facebook?: string;
  vendor: { id: string; name: string; email: string; phone?: string; createdAt: string; isActive: boolean };
  _count: { products: number; orders: number; reviews: number };
}
interface Stats {
  users: { total: number; customers: number; vendors: number; admins: number };
  shops: { total: number; pending: number; approved: number; rejected: number };
  products: { total: number };
  orders: { total: number; byStatus: Record<string, number>; totalRevenuePaid: number };
  recentOrders: any[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string; isActive: boolean }[];
}
interface MainCategory {
  id: string; name: string; icon: string; description?: string;
  _count: { subCategories: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stats / Vendors / Users
  const [stats, setStats] = useState<Stats | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopFilter, setShopFilter] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ shopId: string; shopName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Settings (all shops)
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allShopsFilter, setAllShopsFilter] = useState("all");
  const [allShopsLoading, setAllShopsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Categories
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<MainCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: "", icon: "🛒", description: "" });
  const [catSaving, setCatSaving] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") router.push("/");
  }, [status, session, router]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/stats");
    setStats(await r.json());
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

  const fetchAllShops = useCallback(async () => {
    setAllShopsLoading(true);
    const url = allShopsFilter !== "all" ? `/api/admin/shops?status=${allShopsFilter}` : "/api/admin/shops";
    const r = await fetch(url);
    const d = await r.json();
    setAllShops(d.shops ?? []);
    setAllShopsLoading(false);
  }, [allShopsFilter]);

  const shopAction = async (shopId: string, action: string, reason?: string) => {
    const r = await fetch("/api/admin/shops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, action, rejectionReason: reason }),
    });
    if (r.ok) { showToast(`Shop ${action}d`); fetchAllShops(); }
    else { const d = await r.json(); showToast(d.error ?? "Failed", "error"); }
  };

  const deleteShop = async (id: string) => {
    const r = await fetch(`/api/admin/shops?id=${id}`, { method: "DELETE" });
    if (r.ok) { showToast("Shop deleted permanently"); setDeleteConfirmId(null); fetchAllShops(); }
    else { const d = await r.json(); showToast(d.error ?? "Failed", "error"); }
  };

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    const r = await fetch("/api/admin/categories");
    const d = await r.json();
    setCategories(d.categories ?? []);
    setCatLoading(false);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (tab === "overview") fetchStats();
    if (tab === "vendors") fetchShops();
    if (tab === "users") fetchStats();
    if (tab === "categories") fetchCategories();
    if (tab === "settings") fetchAllShops();
  }, [tab, status, shopFilter, fetchStats, fetchShops, fetchCategories]);

  const updateShopStatus = async (shopId: string, newStatus: "APPROVED" | "REJECTED", reason?: string) => {
    const body: any = { shopId, status: newStatus };
    if (newStatus === "REJECTED") body.rejectionReason = reason;
    const r = await fetch("/api/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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

  const openEditCat = (cat: MainCategory) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, icon: cat.icon, description: cat.description ?? "" });
    setShowCatForm(true);
  };

  const closeCatForm = () => {
    setShowCatForm(false);
    setEditingCat(null);
    setCatForm({ name: "", icon: "🛒", description: "" });
  };

  const saveCat = async () => {
    setCatSaving(true);
    const method = editingCat ? "PATCH" : "POST";
    const body = editingCat ? { id: editingCat.id, ...catForm } : catForm;

    const r = await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (r.ok) {
      showToast(editingCat ? "Category updated" : "Category created");
      closeCatForm();
      fetchCategories();
    } else {
      showToast(d.error ?? "Failed", "error");
    }
    setCatSaving(false);
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete this main category? This cannot be undone.")) return;
    const r = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (r.ok) {
      showToast("Category deleted");
      fetchCategories();
    } else {
      showToast(d.error ?? "Failed", "error");
    }
  };

  if (status === "loading") return (
    <div className="flex h-screen items-center justify-center text-gray-400 font-bold">
      Accessing Admin Panel…
    </div>
  );

  const user = session?.user as any;

  const navItems: { key: Tab; label: string }[] = [
    { key: "overview",   label: "📊 Overview" },
    { key: "vendors",    label: "🏪 Vendors" },
    { key: "categories", label: "🗂 Categories" },
    { key: "users",      label: "👥 Platform Users" },
    { key: "settings",   label: "⚙️ Shop Management" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden text-gray-900 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === "error" ? "bg-red-600" : "bg-gray-900"} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-extrabold mb-1">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-6">
              Provide a reason for rejecting <strong>{rejectModal.shopName}</strong>.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. Incomplete documentation…"
              className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6 shadow-sm"
            />
            <div className="flex gap-4">
              <button
                onClick={() => updateShopStatus(rejectModal.shopId, "REJECTED", rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition shadow-lg shadow-red-100"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 border border-gray-200 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-extrabold mb-6">{editingCat ? "Edit Category" : "New Main Category"}</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-20">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Icon</label>
                  <input
                    type="text"
                    value={catForm.icon}
                    onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-3 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    maxLength={4}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
                  <input
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Food, Electronics"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description (optional)</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveCat}
                disabled={catSaving || !catForm.name.trim()}
                className="flex-1 bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {catSaving ? "Saving…" : (editingCat ? "Save Changes" : "Create Category")}
              </button>
              <button
                onClick={closeCatForm}
                className="flex-1 border border-gray-200 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition"
              >
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
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-gray-800 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 text-white flex flex-col flex-shrink-0 transition-transform duration-500 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-800 flex items-start justify-between lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm uppercase">
              {user?.name?.[0] ?? "A"}
            </div>
            <div>
              <p className="font-bold text-sm truncate">{user?.name ?? "Admin"}</p>
              <p className="text-[10px] uppercase font-bold text-red-400/60 tracking-widest">Platform Admin</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                tab === key ? "bg-red-600 text-white shadow-xl shadow-red-900/40" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/5 hover:text-white transition uppercase tracking-widest"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div>
              <h1 className="text-2xl font-black mb-1">Platform Metrics</h1>
              <p className="text-gray-500 text-sm mb-8 font-medium">Real-time health monitor of DistrictKart marketplace</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
                {[
                  { label: "Total Users",  value: stats?.users.total,    icon: "👥", color: "bg-blue-50/80 text-blue-700" },
                  { label: "Active Shops", value: stats?.shops.approved,  icon: "🏪", color: "bg-purple-50/80 text-purple-700" },
                  { label: "Total Orders", value: stats?.orders.total,    icon: "🛒", color: "bg-amber-50/80 text-amber-700" },
                  { label: "Paid Revenue", value: `₹${((stats?.orders.totalRevenuePaid ?? 0) / 1000).toFixed(1)}K`, icon: "💰", color: "bg-green-50/80 text-green-700" },
                ].map((s) => (
                  <div key={s.label} className={`${s.color} rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <div className="text-2xl font-black">{loading ? "…" : (s.value ?? 0)}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1.5 font-black opacity-60">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-50">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50/50">
                      <tr>
                        {["Order ID", "Customer", "Shop", "Amount", "Status", "Date"].map((h) => (
                          <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{h}</th>
                        ))}
                      </tr>
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
                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black tracking-wider ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-[11px] font-bold">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {!loading && (stats?.recentOrders?.length ?? 0) === 0 && (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">No recent orders</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Vendors ── */}
          {tab === "vendors" && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold">Vendor Management</h1>
                  <p className="text-gray-500 text-sm">{shops.length} vendors shown</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["PENDING", "APPROVED", "REJECTED", "all"].map((f) => (
                    <button key={f} onClick={() => setShopFilter(f)}
                      className={`text-xs px-4 py-2 rounded-xl font-medium transition ${shopFilter === f ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {shops.map((shop) => (
                  <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{shop.name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[shop.status]}`}>{shop.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{shop.description}</p>
                    <p className="text-xs text-gray-400 mb-4">📍 {shop.location} · Vendor: {shop.vendor?.name} ({shop.vendor?.email})</p>
                    {shop.status === "PENDING" && (
                      <div className="flex gap-3 pt-4 border-t border-gray-50">
                        <button onClick={() => updateShopStatus(shop.id, "APPROVED")} className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition">Approve</button>
                        <button onClick={() => setRejectModal({ shopId: shop.id, shopName: shop.name })} className="border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
                {!loading && shops.length === 0 && (
                  <div className="text-center py-16 text-gray-400 font-medium">No vendors found</div>
                )}
              </div>
            </div>
          )}

          {/* ── Categories ── */}
          {tab === "categories" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Main Categories</h1>
                  <p className="text-gray-500 text-sm">Global categories visible to all vendors and customers</p>
                </div>
                <button onClick={() => setShowCatForm(true)}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition">
                  + New Category
                </button>
              </div>

              {catLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">🗂</p>
                  <p className="font-medium">No categories yet. Create your first one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{cat.icon}</span>
                          <div>
                            <h3 className="font-bold text-gray-900">{cat.name}</h3>
                            <p className="text-xs text-gray-400">{cat._count.subCategories} vendor subcategories</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditCat(cat)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium transition">Edit</button>
                          <button onClick={() => deleteCat(cat.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition">Del</button>
                        </div>
                      </div>
                      {cat.description && <p className="text-sm text-gray-500 mt-2">{cat.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Users ── */}
          {tab === "users" && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Platform Users</h1></div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-gray-50">
                      <tr>
                        {["User", "Email", "Role", "Joined"].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(stats?.recentUsers ?? []).map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-5 py-4 font-medium">{u.name}</td>
                          <td className="px-5 py-4 text-gray-500">{u.email}</td>
                          <td className="px-5 py-4">
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{u.role}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Shop Management (Settings) ── */}
          {tab === "settings" && (
            <div>
              {/* Delete confirm modal */}
              {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
                    <p className="text-5xl mb-4">⚠️</p>
                    <h2 className="text-xl font-extrabold mb-2">Delete Shop?</h2>
                    <p className="text-sm text-gray-500 mb-6">This will permanently delete the shop, all its products, orders, and reviews. This cannot be undone.</p>
                    <div className="flex gap-3">
                      <button onClick={() => deleteShop(deleteConfirmId)}
                        className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-sm font-bold hover:bg-red-700 transition">
                        Yes, Delete
                      </button>
                      <button onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 border border-gray-200 py-3 rounded-2xl text-sm font-bold hover:bg-gray-50 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold">Shop Management</h1>
                  <p className="text-gray-500 text-sm">Hide, approve, reject or permanently delete shops</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["all", "PENDING", "APPROVED", "REJECTED"].map((f) => (
                    <button key={f} onClick={() => setAllShopsFilter(f)}
                      className={`text-xs px-4 py-2 rounded-xl font-medium transition ${allShopsFilter === f ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {allShopsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {allShops.map((shop) => (
                    <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg truncate">{shop.name}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[shop.status] ?? "bg-gray-100 text-gray-600"}`}>{shop.status}</span>
                            {!shop.isActive && <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600 font-semibold">Hidden</span>}
                          </div>
                          <p className="text-sm text-gray-500 mb-1 line-clamp-1">{shop.description}</p>
                          <p className="text-xs text-gray-400">
                            📍 {shop.location} · 👤 {shop.vendor?.name} ({shop.vendor?.email})
                            {shop.vendor?.phone && ` · 📞 ${shop.vendor.phone}`}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span>📦 {shop._count?.products ?? 0} products</span>
                            <span>🛒 {shop._count?.orders ?? 0} orders</span>
                            <span>⭐ {shop._count?.reviews ?? 0} reviews</span>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap shrink-0">
                          {shop.status === "PENDING" && (
                            <button onClick={() => shopAction(shop.id, "approve")}
                              className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-700 transition">
                              Approve
                            </button>
                          )}
                          {shop.status === "PENDING" && (
                            <button onClick={() => shopAction(shop.id, "reject")}
                              className="border border-red-200 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 transition">
                              Reject
                            </button>
                          )}
                          {shop.status === "APPROVED" && (
                            <button onClick={() => shopAction(shop.id, shop.isActive ? "hide" : "show")}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${shop.isActive ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
                              {shop.isActive ? "Hide Shop" : "Show Shop"}
                            </button>
                          )}
                          <button onClick={() => setDeleteConfirmId(shop.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-700 transition">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!allShopsLoading && allShops.length === 0 && (
                    <div className="text-center py-16 text-gray-400 font-medium">No shops found</div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
