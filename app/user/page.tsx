"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, ShoppingBag, Heart, MessageSquare, User,
  LogOut, Clock, ChevronRight, Bell, Menu, X, Package,
  MapPin, Star,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────── */
type Tab = "dashboard" | "orders" | "favorites" | "messages" | "account";
type FilterStatus = "all" | "PLACED" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  id: string; quantity: number; price: number;
  product: { id: string; name: string; imageUrl?: string };
}
interface Order {
  id: string; totalAmount: number; status: string;
  paymentMethod: string; paymentStatus: string;
  deliveryAddress: string; contactNumber: string; createdAt: string;
  shop: { id: string; name: string };
  orderItems: OrderItem[];
}
interface UserProfile {
  id: string; name: string; email: string;
  phone?: string; role: string; createdAt: string;
}

/* ─── Constants ─────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PLACED:          { bg: "#FFF7ED", color: "#EA580C", label: "Pending"          },
  PROCESSING:      { bg: "#FFFBEB", color: "#B45309", label: "Processing"       },
  SHIPPED:         { bg: "#F3E8FF", color: "#7C3AED", label: "Shipped"          },
  OUT_FOR_DELIVERY:{ bg: "#FFF7ED", color: "#C2410C", label: "Out for Delivery" },
  DELIVERED:       { bg: "#F0FDF4", color: "#16A34A", label: "Delivered"        },
  CANCELLED:       { bg: "#FEF2F2", color: "#DC2626", label: "Cancelled"        },
};

const MOCK_MESSAGES = [
  { name: "Linda Wafula",  avatar: "LW", color: "#16a34a", time: "40 min",  msg: "Thanks for the order, it was fresh and delicious!" },
  { name: "George Mutai",  avatar: "GM", color: "#2563eb", time: "1 hr",    msg: "Hi, do you have any discount available for today?" },
  { name: "Sarah Nanga",   avatar: "SN", color: "#9333ea", time: "2 hrs",   msg: "Hello, I'd like to order 1kg of raw honey from your shop." },
  { name: "Daniel Kigen",  avatar: "DK", color: "#d97706", time: "3 hrs",   msg: "Hi, I'd like to order 1kg of raw honey from your shop." },
];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

/* ─── Component ─────────────────────────────────────────────────────── */
export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab]               = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [profile, setProfile]       = useState<UserProfile | null>(null);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [profileForm, setProfileForm]   = useState({ name: "", phone: "" });
  const [saving, setSaving]         = useState(false);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?role=user");
    if (status === "authenticated" && (session?.user as any)?.role !== "USER") router.push("/");
  }, [status, session, router]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const url = filterStatus !== "all" ? `/api/user/orders?status=${filterStatus}` : "/api/user/orders";
    const r = await fetch(url);
    const d = await r.json();
    setOrders(d.orders ?? []);
    setLoading(false);
  }, [filterStatus]);

  const fetchProfile = useCallback(async () => {
    const r = await fetch("/api/user/profile");
    const d = await r.json();
    setProfile(d.user ?? null);
    if (d.user) setProfileForm({ name: d.user.name, phone: d.user.phone ?? "" });
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchOrders();
    fetchProfile();
  }, [status, tab, fetchOrders, fetchProfile]);

  const saveProfile = async () => {
    setSaving(true);
    const r = await fetch("/api/user/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    r.ok ? (notify("Profile updated!"), fetchProfile()) : notify((await r.json()).error ?? "Error", false);
    setSaving(false);
  };

  if (status === "loading") return (
    <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f7f5" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:44,height:44,border:"3px solid #16a34a",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .9s linear infinite",margin:"0 auto 14px" }} />
        <p style={{ color:"#6b7280",fontSize:13 }}>Loading…</p>
      </div>
    </div>
  );

  const user       = session?.user as any;
  const firstName  = (profile?.name || user?.name || "there").split(" ")[0];
  const activeOrders = orders.filter(o => !["DELIVERED","CANCELLED"].includes(o.status));

  const NAV = [
    { t:"dashboard" as Tab, Icon:LayoutGrid,    label:"Dashboard"  },
    { t:"orders"    as Tab, Icon:ShoppingBag,   label:"Orders"     },
    { t:"favorites" as Tab, Icon:Heart,         label:"Favorites"  },
    { t:"messages"  as Tab, Icon:MessageSquare, label:"Messages"   },
    { t:"account"   as Tab, Icon:User,          label:"Account"    },
  ];

  /* ──────────────── RENDER ──────────────── */
  return (
    <div style={{ display:"flex",height:"100vh",background:"#f5f7f5",fontFamily:"inherit",overflow:"hidden" }}>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ud-sidebar{position:fixed;top:0;bottom:0;left:0;width:220px;z-index:50;transition:transform .3s ease}
        .ud-main{margin-left:220px;flex:1;overflow-y:auto}
        .ud-mob-header{display:none}
        .ud-nav-btn:hover{background:#f5f5f5!important}
        .ud-order-card:hover{border-color:#d1d5db!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important}
        @media(max-width:900px){
          .ud-sidebar{transform:translateX(-100%)}
          .ud-sidebar.open{transform:translateX(0)}
          .ud-main{margin-left:0}
          .ud-mob-header{display:flex!important}
          .ud-stats{grid-template-columns:repeat(2,1fr)!important}
          .ud-msg-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:1000,background:toast.ok?"#15452e":"#dc2626",color:"#fff",padding:"11px 18px",borderRadius:12,fontSize:13,fontWeight:600,boxShadow:"0 8px 28px rgba(0,0,0,0.16)",animation:"fadeUp .25s ease" }}>
          {toast.ok?"✓":"✗"} {toast.msg}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:40 }} onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`ud-sidebar${sidebarOpen?" open":""}`}
        style={{ background:"#fff",borderRight:"1px solid #ebebeb",display:"flex",flexDirection:"column",boxShadow:"2px 0 12px rgba(0,0,0,0.04)" }}>

        {/* Profile block */}
        <div style={{ padding:"28px 16px 20px",textAlign:"center",borderBottom:"1px solid #f0f0f0" }}>
          <div style={{ width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#4ade80)",margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff",boxShadow:"0 4px 14px rgba(22,163,74,0.35)" }}>
            {firstName[0]?.toUpperCase()}
          </div>
          <p style={{ fontSize:14,fontWeight:700,color:"#111",marginBottom:2 }}>{profile?.name || user?.name}</p>
          <p style={{ fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 4px" }}>{profile?.email || user?.email}</p>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:"12px 10px",overflowY:"auto" }}>
          {NAV.map(({ t, Icon, label }) => {
            const active = tab === t;
            return (
              <button key={t} className="ud-nav-btn" onClick={() => { setTab(t); setSidebarOpen(false); }}
                style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:active?"#111":"transparent",color:active?"#fff":"#374151",border:"none",cursor:"pointer",fontSize:13,fontWeight:active?600:500,marginBottom:3,textAlign:"left",transition:"all .18s",position:"relative" }}>
                <Icon size={16} strokeWidth={active?2.2:1.8} />
                {label}
                {t==="orders" && activeOrders.length > 0 && (
                  <span style={{ marginLeft:"auto",background:"#f97316",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:99 }}>{activeOrders.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding:"10px",borderTop:"1px solid #f0f0f0" }}>
          <button className="ud-nav-btn" onClick={() => signOut({ callbackUrl:"/auth/login" })}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"transparent",color:"#9ca3af",border:"none",cursor:"pointer",fontSize:13,fontWeight:500,transition:"all .18s" }}>
            <LogOut size={16} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="ud-main">

        {/* Mobile header */}
        <header className="ud-mob-header" style={{ padding:"13px 16px",background:"#fff",borderBottom:"1px solid #ebebeb",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:30 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background:"none",border:"none",cursor:"pointer",color:"#374151" }}><Menu size={22}/></button>
          <span style={{ fontSize:15,fontWeight:700,color:"#111" }}>My Account</span>
          <div style={{ width:32,height:32,borderRadius:"50%",background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff" }}>
            {firstName[0]?.toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding:"28px 32px",maxWidth:960,margin:"0 auto" }}>

          {/* ════ DASHBOARD ════ */}
          {tab === "dashboard" && (
            <div>
              {/* Welcome row */}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
                <div>
                  <h1 style={{ fontSize:22,fontWeight:800,color:"#111",marginBottom:3 }}>
                    Welcome back, {firstName}! 👋
                  </h1>
                  <p style={{ fontSize:13,color:"#9ca3af" }}>
                    {new Date().toLocaleDateString("en",{ weekday:"long",year:"numeric",month:"long",day:"numeric" })}
                  </p>
                </div>
                <button style={{ position:"relative",width:40,height:40,borderRadius:"50%",background:"#fff",border:"1.5px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <Bell size={17} color="#374151" />
                  {activeOrders.length > 0 && <span style={{ position:"absolute",top:7,right:7,width:8,height:8,borderRadius:"50%",background:"#ef4444",border:"2px solid #fff" }} />}
                </button>
              </div>

              {/* Stat cards */}
              <div className="ud-stats" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
                {[
                  { label:"Total Orders",   value:orders.length,         Icon:ShoppingBag,   color:"#16a34a", bg:"#f0fdf4" },
                  { label:"Favorites",      value:14,                    Icon:Heart,         color:"#dc2626", bg:"#fef2f2" },
                  { label:"Messages",       value:MOCK_MESSAGES.length,  Icon:MessageSquare, color:"#2563eb", bg:"#eff6ff" },
                  { label:"Pending Orders", value:activeOrders.length,   Icon:Clock,         color:"#d97706", bg:"#fffbeb" },
                ].map(s => (
                  <div key={s.label} style={{ background:"#fff",borderRadius:14,padding:"18px 16px",border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)",cursor:"default" }}>
                    <div style={{ width:42,height:42,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14 }}>
                      <s.Icon size={20} color={s.color} strokeWidth={1.8} />
                    </div>
                    <p style={{ fontSize:28,fontWeight:800,color:"#111",lineHeight:1,marginBottom:5 }}>{s.value}</p>
                    <p style={{ fontSize:12,color:"#9ca3af",fontWeight:500 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* My Orders card */}
              <div style={{ background:"#fff",borderRadius:16,border:"1px solid #ebebeb",padding:"20px 20px 10px",marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                  <h2 style={{ fontSize:16,fontWeight:700,color:"#111" }}>My Orders</h2>
                </div>

                {/* Filter tabs */}
                <div style={{ display:"flex",gap:7,marginBottom:16,flexWrap:"wrap" }}>
                  {([
                    { key:"all",       label:"All"       },
                    { key:"PLACED",    label:"Pending"   },
                    { key:"DELIVERED", label:"Delivered" },
                    { key:"CANCELLED", label:"Cancelled" },
                  ] as { key: FilterStatus; label: string }[]).map(f => {
                    const active = filterStatus === f.key;
                    const badge = f.key === "PLACED" ? activeOrders.length : 0;
                    return (
                      <button key={f.key} onClick={() => setFilterStatus(f.key)}
                        style={{ padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:active?700:500,background:active?"#111":"transparent",color:active?"#fff":"#6b7280",border:active?"none":"1.5px solid #e5e7eb",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .18s" }}>
                        {f.label}
                        {badge > 0 && <span style={{ background:"#f97316",color:"#fff",fontSize:10,fontWeight:700,padding:"0px 6px",borderRadius:99,lineHeight:"18px" }}>{badge}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Order rows */}
                {loading ? (
                  <div style={{ textAlign:"center",padding:"24px 0",color:"#9ca3af",fontSize:13 }}>Loading orders…</div>
                ) : (
                  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    {orders.slice(0,3).map(o => {
                      const first    = o.orderItems[0];
                      const s        = STATUS_STYLE[o.status] || STATUS_STYLE.PLACED;
                      const isPending = !["DELIVERED","CANCELLED"].includes(o.status);
                      return (
                        <div key={o.id} className="ud-order-card"
                          style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",border:"1.5px solid #f5f5f5",borderRadius:13,background:"#fafafa",transition:"all .2s" }}>
                          {/* Thumbnail */}
                          <div style={{ width:54,height:54,borderRadius:11,flexShrink:0,overflow:"hidden",background:first?.product?.imageUrl?`url(${first.product.imageUrl}) center/cover`:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:"1px solid #ebebeb" }}>
                            {!first?.product?.imageUrl && <Package size={22} color="#16a34a" strokeWidth={1.5} />}
                          </div>

                          {/* Info */}
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3 }}>
                              <span style={{ fontSize:13,fontWeight:700,color:"#111" }}>Order #{o.id.slice(-6).toUpperCase()}</span>
                              <span style={{ fontSize:11,color:"#9ca3af" }}>
                                {new Date(o.createdAt).toLocaleDateString("en",{ month:"short",day:"numeric",year:"numeric" })}
                              </span>
                            </div>
                            <p style={{ fontSize:12,color:"#374151",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                              {first?.product?.name}
                              {o.orderItems.length > 1 ? ` +${o.orderItems.length - 1} more` : ""}
                            </p>
                            <p style={{ fontSize:11,color:"#9ca3af" }}>
                              {o.shop?.name} · {o.orderItems.length} item{o.orderItems.length !== 1 ? "s" : ""}
                            </p>
                          </div>

                          {/* Price + status + CTA */}
                          <div style={{ textAlign:"right",flexShrink:0 }}>
                            <p style={{ fontSize:16,fontWeight:800,color:"#111",marginBottom:6 }}>₹{o.totalAmount}</p>
                            <div style={{ display:"flex",alignItems:"center",gap:7,justifyContent:"flex-end",flexWrap:"wrap" }}>
                              <span style={{ fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:7,background:s.bg,color:s.color }}>
                                {s.label}
                              </span>
                              <button onClick={() => setTab("orders")}
                                style={{ fontSize:12,fontWeight:600,padding:"5px 13px",borderRadius:8,background:isPending?"#16a34a":"#fff",color:isPending?"#fff":"#374151",border:isPending?"none":"1.5px solid #d1d5db",cursor:"pointer",whiteSpace:"nowrap",transition:"all .18s" }}>
                                View Order
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {orders.length === 0 && (
                      <div style={{ textAlign:"center",padding:"32px 0",color:"#9ca3af" }}>
                        <ShoppingBag size={32} style={{ margin:"0 auto 10px",opacity:0.35 }} />
                        <p style={{ fontSize:13 }}>No orders yet</p>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => setTab("orders")}
                  style={{ display:"block",width:"100%",textAlign:"center",marginTop:14,padding:"11px",fontSize:13,fontWeight:600,color:"#16a34a",background:"none",border:"none",cursor:"pointer",borderTop:"1px solid #f5f5f5" }}>
                  View All Orders →
                </button>
              </div>

              {/* Recent Messages */}
              <div style={{ background:"#fff",borderRadius:16,border:"1px solid #ebebeb",padding:"20px 20px 10px",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                  <h2 style={{ fontSize:16,fontWeight:700,color:"#111" }}>Recent Messages</h2>
                  <button onClick={() => setTab("messages")} style={{ fontSize:12,color:"#16a34a",fontWeight:600,background:"none",border:"none",cursor:"pointer" }}>View All</button>
                </div>
                <div className="ud-msg-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  {MOCK_MESSAGES.map((m,i) => (
                    <div key={i} style={{ display:"flex",gap:10,padding:"12px 13px",borderRadius:12,border:"1.5px solid #f5f5f5",background:"#fafafa",cursor:"pointer",transition:"border-color .2s" }}>
                      <div style={{ width:36,height:36,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0 }}>
                        {m.avatar}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                          <span style={{ fontSize:13,fontWeight:600,color:"#111" }}>{m.name}</span>
                          <span style={{ fontSize:11,color:"#9ca3af",flexShrink:0,marginLeft:6 }}>{m.time}</span>
                        </div>
                        <p style={{ fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{m.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab("messages")}
                  style={{ display:"block",width:"100%",textAlign:"center",marginTop:14,padding:"11px",fontSize:13,fontWeight:600,color:"#16a34a",background:"none",border:"none",cursor:"pointer",borderTop:"1px solid #f5f5f5" }}>
                  View All Messages →
                </button>
              </div>
            </div>
          )}

          {/* ════ ORDERS ════ */}
          {tab === "orders" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                <div>
                  <h1 style={{ fontSize:20,fontWeight:800,color:"#111",marginBottom:2 }}>My Orders</h1>
                  <p style={{ fontSize:13,color:"#9ca3af" }}>{orders.length} orders total</p>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{ display:"flex",gap:7,marginBottom:18,flexWrap:"wrap" }}>
                {([
                  { key:"all",       label:"All"       },
                  { key:"PLACED",    label:"Pending"   },
                  { key:"DELIVERED", label:"Delivered" },
                  { key:"CANCELLED", label:"Cancelled" },
                ] as { key: FilterStatus; label: string }[]).map(f => {
                  const active = filterStatus === f.key;
                  const badge = f.key === "PLACED" ? activeOrders.length : 0;
                  return (
                    <button key={f.key} onClick={() => setFilterStatus(f.key)}
                      style={{ padding:"7px 18px",borderRadius:99,fontSize:13,fontWeight:active?700:500,background:active?"#111":"#fff",color:active?"#fff":"#6b7280",border:active?"none":"1.5px solid #e5e7eb",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .18s",boxShadow:active?"0 2px 8px rgba(0,0,0,0.15)":"none" }}>
                      {f.label}
                      {badge > 0 && <span style={{ background:"#f97316",color:"#fff",fontSize:10,fontWeight:700,padding:"0px 6px",borderRadius:99,lineHeight:"18px" }}>{badge}</span>}
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <div style={{ textAlign:"center",padding:"48px 0",color:"#9ca3af" }}>Loading…</div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  {orders.map(o => {
                    const s = STATUS_STYLE[o.status] || STATUS_STYLE.PLACED;
                    return (
                      <div key={o.id} style={{ background:"#fff",borderRadius:16,border:"1px solid #ebebeb",padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8 }}>
                          <div>
                            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap" }}>
                              <span style={{ fontSize:14,fontWeight:700,color:"#111" }}>Order #{o.id.slice(-6).toUpperCase()}</span>
                              <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:7,background:s.bg,color:s.color }}>{s.label}</span>
                            </div>
                            <p style={{ fontSize:11,color:"#9ca3af" }}>
                              {new Date(o.createdAt).toLocaleDateString("en",{ weekday:"short",year:"numeric",month:"short",day:"numeric" })}
                              {" · "}{o.shop?.name}{" · "}{o.paymentMethod}
                            </p>
                          </div>
                          <span style={{ fontSize:20,fontWeight:800,color:"#111" }}>₹{o.totalAmount}</span>
                        </div>

                        {/* Items */}
                        <div style={{ borderTop:"1px solid #f5f5f5",paddingTop:12,marginBottom:14 }}>
                          {o.orderItems.map(item => (
                            <div key={item.id} style={{ display:"flex",alignItems:"center",gap:10,paddingBottom:8,marginBottom:8,borderBottom:"1px solid #fafafa" }}>
                              <div style={{ width:40,height:40,borderRadius:9,overflow:"hidden",background:item.product?.imageUrl?`url(${item.product.imageUrl}) center/cover`:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid #ebebeb" }}>
                                {!item.product?.imageUrl && <Package size={18} color="#16a34a" strokeWidth={1.5} />}
                              </div>
                              <div style={{ flex:1 }}>
                                <p style={{ fontSize:13,fontWeight:600,color:"#111" }}>{item.product?.name}</p>
                                <p style={{ fontSize:11,color:"#9ca3af" }}>Qty: {item.quantity}</p>
                              </div>
                              <span style={{ fontSize:13,fontWeight:700,color:"#374151" }}>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery */}
                        <div style={{ display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:"#6b7280" }}>
                          <MapPin size={13} style={{ marginTop:1,flexShrink:0,color:"#9ca3af" }} />
                          <span>{o.deliveryAddress}</span>
                        </div>
                      </div>
                    );
                  })}

                  {orders.length === 0 && (
                    <div style={{ textAlign:"center",padding:"60px 24px",color:"#9ca3af",border:"2px dashed #e5e7eb",borderRadius:16 }}>
                      <ShoppingBag size={36} style={{ margin:"0 auto 12px",opacity:0.35 }} />
                      <p style={{ fontSize:14 }}>No orders yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════ FAVORITES ════ */}
          {tab === "favorites" && (
            <div style={{ textAlign:"center",padding:"72px 24px",color:"#9ca3af" }}>
              <Heart size={44} style={{ margin:"0 auto 14px",opacity:0.3 }} />
              <h2 style={{ fontSize:18,fontWeight:700,color:"#374151",marginBottom:6 }}>No Favorites Yet</h2>
              <p style={{ fontSize:13,marginBottom:20 }}>Browse shops and tap ♡ to save your favourite products.</p>
              <button onClick={() => router.push("/")} style={{ background:"#16a34a",color:"#fff",padding:"11px 24px",borderRadius:10,fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>
                Browse Shops
              </button>
            </div>
          )}

          {/* ════ MESSAGES ════ */}
          {tab === "messages" && (
            <div>
              <h1 style={{ fontSize:20,fontWeight:800,color:"#111",marginBottom:20 }}>Messages</h1>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {MOCK_MESSAGES.map((m,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:"#fff",borderRadius:14,border:"1.5px solid #ebebeb",cursor:"pointer",transition:"border-color .2s",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ width:46,height:46,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0 }}>
                      {m.avatar}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                        <span style={{ fontSize:14,fontWeight:700,color:"#111" }}>{m.name}</span>
                        <span style={{ fontSize:11,color:"#9ca3af" }}>{m.time}</span>
                      </div>
                      <p style={{ fontSize:12,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.msg}</p>
                    </div>
                    <ChevronRight size={16} color="#d1d5db" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ ACCOUNT ════ */}
          {tab === "account" && (
            <div>
              <h1 style={{ fontSize:20,fontWeight:800,color:"#111",marginBottom:20 }}>Account Settings</h1>
              <div style={{ maxWidth:520,display:"flex",flexDirection:"column",gap:16 }}>
                {/* Avatar block */}
                <div style={{ background:"#fff",borderRadius:16,border:"1px solid #ebebeb",padding:20,display:"flex",alignItems:"center",gap:16,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#4ade80)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff",flexShrink:0 }}>
                    {firstName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize:16,fontWeight:700,color:"#111",marginBottom:2 }}>{profile?.name}</p>
                    <p style={{ fontSize:12,color:"#9ca3af" }}>{profile?.email}</p>
                    <p style={{ fontSize:11,color:"#16a34a",fontWeight:600,marginTop:4 }}>
                      Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en",{ month:"long",year:"numeric" }) : "—"}
                    </p>
                  </div>
                </div>

                {/* Edit form */}
                <div style={{ background:"#fff",borderRadius:16,border:"1px solid #ebebeb",padding:24,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <h3 style={{ fontSize:15,fontWeight:700,color:"#111",marginBottom:18 }}>Edit Profile</h3>
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    {[{label:"Full Name",key:"name",type:"text"},{label:"Phone Number",key:"phone",type:"tel"}].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:6 }}>{f.label}</label>
                        <input type={f.type} value={(profileForm as any)[f.key]} onChange={e => setProfileForm(p => ({ ...p,[f.key]:e.target.value }))}
                          style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",boxSizing:"border-box",transition:"border-color .2s" }}
                          onFocus={e => (e.target.style.borderColor="#16a34a")}
                          onBlur={e  => (e.target.style.borderColor="#e5e7eb")}
                        />
                      </div>
                    ))}
                    <div style={{ display:"flex",gap:10,marginTop:4 }}>
                      <button onClick={saveProfile} disabled={saving}
                        style={{ flex:1,background:"#16a34a",color:"#fff",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,border:"none",cursor:"pointer",opacity:saving?0.7:1 }}>
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                      <button onClick={() => signOut({ callbackUrl:"/auth/login" })}
                        style={{ flex:1,border:"1.5px solid #fee2e2",color:"#dc2626",background:"#fff",padding:"12px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer" }}>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
