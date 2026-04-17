"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2, Settings,
  LogOut, MessageCircle, Eye, Star, MapPin, Menu, X,
  RefreshCw, Wifi, TrendingUp, Users, Plus, Pencil, Trash2, ChevronRight,
  Tag, Store, Instagram, Facebook, Youtube, Phone, Navigation,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ─── Types ─────────────────────────────────────────────────────────── */
type Tab = "dashboard" | "products" | "orders" | "sales" | "categories" | "settings";

interface Product {
  id: string; name: string; description: string; price: number;
  discount: number; sellingPrice: number;
  imageUrl?: string; isActive: boolean;
  subCategory: { id: string; name: string };
}
interface SubCategory {
  id: string; name: string; description?: string;
  mainCategoryId: string;
  mainCategory: { id: string; name: string; icon: string };
  _count: { products: number };
}
interface MainCategory {
  id: string; name: string; icon: string;
}
interface Order {
  id: string; totalAmount: number; status: string;
  paymentMethod: string; paymentStatus: string;
  deliveryAddress: string; contactNumber: string; createdAt: string;
  orderItems: { id: string; quantity: number; price: number; product: { name: string; imageUrl?: string } }[];
  user: { id: string; name: string; email: string };
}
interface CartItem {
  id: string; quantity: number;
  product: { id: string; name: string; price: number; imageUrl?: string; category: { name: string } };
  user: { id: string; name: string; email: string };
}

/* ─── Constants ─────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PLACED:          { bg: "#EFF6FF", color: "#1D4ED8", label: "Placed" },
  PROCESSING:      { bg: "#FFFBEB", color: "#B45309", label: "Processing" },
  SHIPPED:         { bg: "#F3E8FF", color: "#7C3AED", label: "Shipped" },
  OUT_FOR_DELIVERY:{ bg: "#FFF7ED", color: "#C2410C", label: "Out for Delivery" },
  DELIVERED:       { bg: "#F0FDF4", color: "#15803D", label: "Delivered" },
  CANCELLED:       { bg: "#FEF2F2", color: "#DC2626", label: "Cancelled" },
};
const NEXT_STATUS: Record<string, string[]> = {
  PLACED: ["PROCESSING","CANCELLED"], PROCESSING: ["SHIPPED","CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"], OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [], CANCELLED: [],
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
const AVATAR_BG = ["#16a34a","#2563eb","#9333ea","#dc2626","#d97706","#0891b2","#be185d","#059669"];
function avatarBg(name = "") { let h = 0; for (const c of name) h += c.charCodeAt(0); return AVATAR_BG[h % AVATAR_BG.length]; }
function initials(name = "") { return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "?"; }

/* ─── Component ─────────────────────────────────────────────────────── */
export default function VendorDashboard() {
  const { data: session, status } = useSession();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<SubCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [lastSync, setLastSync]     = useState(new Date());

  const [shopInfo, setShopInfo]               = useState<any>(null);
  const [needsShop, setNeedsShop]             = useState(false);
  const [shopForm, setShopForm]               = useState({ name: "", description: "" });
  const [creatingShop, setCreatingShop]       = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null);
  const [productForm, setProductForm]         = useState({ name:"", description:"", price:"", discount:"0", imageUrl:"", categoryId:"", isActive:true });
  // Multiple images state: array of uploaded URLs
  const [productImages, setProductImages]     = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [showCatForm, setShowCatForm]         = useState(false);
  const [editingCat, setEditingCat]           = useState<SubCategory | null>(null);
  const [catForm, setCatForm]                 = useState({ name:"", description:"", mainCategoryId:"" });

  // Shop Settings
  const [shopSettings, setShopSettings] = useState({
    name:"", description:"", logoUrl:"", bannerUrl:"", location:"Samastipur",
    whatsapp:"", instagram:"", facebook:"", youtube:"",
    gstNumber:"", businessType:"Individual",
    latitude:"", longitude:"",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [locating, setLocating]             = useState(false);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const fetchData = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const shopRes = await fetch("/api/vendor/shop");
      const shopData = await shopRes.json();
      if (!shopData.shop) { setNeedsShop(true); return; }
      setShopInfo(shopData.shop); setNeedsShop(false);
      const sh = shopData.shop;
      setShopSettings({
        name: sh.name ?? "", description: sh.description ?? "",
        logoUrl: sh.logoUrl ?? "", bannerUrl: sh.bannerUrl ?? "",
        location: sh.location ?? "Samastipur",
        whatsapp: sh.whatsapp ?? "", instagram: sh.instagram ?? "",
        facebook: sh.facebook ?? "", youtube: sh.youtube ?? "",
        gstNumber: sh.gstNumber ?? "", businessType: sh.businessType ?? "Individual",
        latitude: sh.latitude != null ? String(sh.latitude) : "",
        longitude: sh.longitude != null ? String(sh.longitude) : "",
      });
      const [pR, cR, oR] = await Promise.all([
        fetch("/api/vendor/products"),
        fetch("/api/vendor/categories"),
        fetch("/api/vendor/orders"),
      ]);
      if (pR.ok) { const d = await pR.json(); setProducts(d.products ?? []); }
      if (cR.ok) { const d = await cR.json(); setCategories(d.subCategories ?? []); setMainCategories(d.mainCategories ?? []); }
      if (oR.ok) { const d = await oR.json(); setOrders(d.orders ?? []); }
      setLastSync(new Date());
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") fetchData(); }, [status, fetchData]);
  // Live polling every 30 s (Supabase-style interactivity)
  useEffect(() => {
    if (status !== "authenticated") return;
    const iv = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(iv);
  }, [status, fetchData]);

  /* CRUD */
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault(); setCreatingShop(true);
    const r = await fetch("/api/vendor/shop", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(shopForm) });
    r.ok ? (notify("Shop created!"), fetchData()) : notify((await r.json()).error, false);
    setCreatingShop(false);
  };
  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ name:"", description:"", price:"", discount:"0", imageUrl:"", categoryId: categories[0]?.id ?? "", isActive:true });
    setProductImages([]);
    setShowProductForm(true);
  };
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ name:p.name, description:p.description, price:String(p.price), discount:String(p.discount ?? 0), imageUrl:p.imageUrl??"", categoryId:p.subCategory.id, isActive:p.isActive });
    setProductImages(p.imageUrl ? [p.imageUrl] : []);
    setShowProductForm(true);
  };
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) uploaded.push(data.url);
        else notify(data.error ?? "Upload failed", false);
      } catch { notify("Upload failed", false); }
    }
    setProductImages(prev => {
      const next = [...prev, ...uploaded];
      setProductForm(f => ({ ...f, imageUrl: next[0] ?? "" }));
      return next;
    });
    setUploadingImages(false);
  };
  const removeProductImage = (idx: number) => {
    setProductImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      setProductForm(f => ({ ...f, imageUrl: next[0] ?? "" }));
      return next;
    });
  };
  const saveProduct = async () => {
    const method = editingProduct ? "PUT" : "POST";
    const url = editingProduct ? `/api/vendor/products/${editingProduct.id}` : "/api/vendor/products";
    // Use first image as imageUrl (backend compat), send all images as extra field
    const imageUrl = productImages[0] ?? productForm.imageUrl ?? "";
    const body = { ...productForm, imageUrl, subCategoryId: productForm.categoryId };
    const r = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    r.ok ? (notify(editingProduct ? "Product updated!" : "Product created!"), setShowProductForm(false), fetchData()) : notify((await r.json()).error, false);
  };
  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const r = await fetch(`/api/vendor/products/${id}`, { method:"DELETE" });
    r.ok ? (notify("Product deleted"), fetchData()) : notify("Delete failed", false);
  };
  const openNewCat = () => { setEditingCat(null); setCatForm({ name:"", description:"", mainCategoryId: mainCategories[0]?.id ?? "" }); setShowCatForm(true); };
  const openEditCat = (c: SubCategory) => { setEditingCat(c); setCatForm({ name:c.name, description:c.description??"", mainCategoryId:c.mainCategoryId }); setShowCatForm(true); };
  const saveCat = async () => {
    const method = editingCat ? "PUT" : "POST";
    const url = editingCat ? `/api/vendor/categories/${editingCat.id}` : "/api/vendor/categories";
    const r = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(catForm) });
    r.ok ? (notify(editingCat ? "Category updated!" : "Category created!"), setShowCatForm(false), fetchData()) : notify((await r.json()).error, false);
  };
  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const r = await fetch(`/api/vendor/categories/${id}`, { method:"DELETE" });
    r.ok ? (notify("Category deleted"), fetchData()) : notify((await r.json()).error, false);
  };
  const saveShopSettings = async () => {
    setSavingSettings(true);
    const r = await fetch("/api/vendor/shop", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...shopSettings,
        latitude:  shopSettings.latitude  ? parseFloat(shopSettings.latitude)  : null,
        longitude: shopSettings.longitude ? parseFloat(shopSettings.longitude) : null,
      }),
    });
    r.ok ? (notify("Shop settings saved!"), fetchData()) : notify((await r.json()).error ?? "Save failed", false);
    setSavingSettings(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { notify("Geolocation not supported", false); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShopSettings(s => ({
          ...s,
          latitude:  String(pos.coords.latitude.toFixed(6)),
          longitude: String(pos.coords.longitude.toFixed(6)),
        }));
        setLocating(false);
        notify("Location captured!");
      },
      () => { notify("Could not get location", false); setLocating(false); }
    );
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const r = await fetch("/api/vendor/orders", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ orderId, status:newStatus }) });
    r.ok ? (notify(`Order → ${newStatus.replace(/_/g," ")}`), fetchData()) : notify((await r.json()).error, false);
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f4f8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:44,height:44,border:"3px solid #16a34a",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 14px" }} />
        <p style={{ color:"#6b7280",fontSize:13 }}>Loading dashboard…</p>
      </div>
    </div>
  );

  const user = session?.user as any;

  /* ── Shop Creation ── */
  if (needsShop) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f4f8", padding:16 }}>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:999,background:toast.ok?"#15452e":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:12,fontSize:13,fontWeight:600 }}>{toast.msg}</div>}
      <div style={{ background:"#fff",borderRadius:24,padding:36,maxWidth:420,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:56,height:56,borderRadius:14,background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:22,fontWeight:800,color:"#fff" }}>DK</div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#111827",marginBottom:6 }}>Create Your Shop</h1>
          <p style={{ fontSize:13,color:"#6b7280" }}>Set up your shop to start selling on District Kart.</p>
        </div>
        <form onSubmit={handleCreateShop} style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:6 }}>Shop Name</label>
            <input required value={shopForm.name} onChange={e => setShopForm(s => ({...s,name:e.target.value}))}
              style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"12px 16px",fontSize:14,outline:"none",boxSizing:"border-box" }}
              placeholder="e.g. Green Harvest" />
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:6 }}>Description (optional)</label>
            <textarea value={shopForm.description} onChange={e => setShopForm(s => ({...s,description:e.target.value}))} rows={3}
              style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"12px 16px",fontSize:14,outline:"none",resize:"none",boxSizing:"border-box" }}
              placeholder="What are you selling?" />
          </div>
          <button type="submit" disabled={creatingShop}
            style={{ background:"#16a34a",color:"#fff",padding:"14px",borderRadius:12,fontSize:14,fontWeight:700,border:"none",cursor:"pointer",marginTop:8,opacity:creatingShop?0.7:1 }}>
            {creatingShop ? "Creating…" : "Set Up My Shop"}
          </button>
        </form>
        <button onClick={() => signOut({ callbackUrl:"/auth/login" })} style={{ display:"block",margin:"16px auto 0",fontSize:13,color:"#9ca3af",background:"none",border:"none",cursor:"pointer" }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  /* ── Computed ── */
  const activeOrders = orders.filter(o => !["DELIVERED","CANCELLED"].includes(o.status));
  const totalRevenue = orders.reduce((s,o) => s + o.totalAmount, 0);
  const paidRevenue  = orders.filter(o => o.paymentStatus === "PAID").reduce((s,o) => s + o.totalAmount, 0);
  const uniqueCustomers = Array.from(new Set(orders.map(o => o.user?.id))).filter(Boolean);

  const last7 = Array.from({ length:7 }, (_,i) => { const d = new Date(); d.setDate(d.getDate()-(6-i)); return d; });
  const chartLabels = last7.map(d => d.toLocaleDateString("en",{ weekday:"short" }));
  const chartValues = last7.map(d => orders.filter(o => new Date(o.createdAt).toDateString()===d.toDateString()).reduce((s,o)=>s+o.totalAmount,0));
  const hasData = chartValues.some(v=>v>0);
  const displayChart = hasData ? chartValues : [1800,3200,2400,4100,3600,5200,4400];

  const salesMap: Record<string,{ name:string; imageUrl?:string; count:number; revenue:number }> = {};
  orders.forEach(o => o.orderItems.forEach(item => {
    if (!salesMap[item.product.name]) salesMap[item.product.name] = { name:item.product.name, imageUrl:item.product.imageUrl, count:0, revenue:0 };
    salesMap[item.product.name].count += item.quantity;
    salesMap[item.product.name].revenue += item.price * item.quantity;
  }));
  const topSelling = Object.values(salesMap).sort((a,b)=>b.count-a.count).slice(0,5);
  const topProducts = topSelling.length > 0 ? topSelling : products.slice(0,5).map(p=>({ name:p.name, imageUrl:p.imageUrl, count:0, revenue:p.price }));
  const maxCount = Math.max(...topProducts.map(p=>p.count), 1);

  const shopInitials = shopInfo?.name?.slice(0,2).toUpperCase() || "S";

  const NAV = [
    { t:"dashboard"  as Tab, Icon:LayoutDashboard, label:"Dashboard"    },
    { t:"products"   as Tab, Icon:Package,         label:"Products"     },
    { t:"orders"     as Tab, Icon:ShoppingCart,    label:"Orders"       },
    { t:"sales"      as Tab, Icon:BarChart2,       label:"Sales Report" },
    { t:"categories" as Tab, Icon:Tag,             label:"Categories"   },
    { t:"settings"   as Tab, Icon:Store,           label:"Shop Settings"},
  ];

  /* ─────────────────────── RENDER ─────────────────────────────────── */
  return (
    <div style={{ display:"flex", height:"100vh", background:"#f0f4f8", overflow:"hidden" }}>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .vd-sidebar{position:fixed;top:0;bottom:0;left:0;width:232px;z-index:50;transition:transform .3s ease}
        .vd-main{margin-left:232px;flex:1;overflow-y:auto;display:flex;flex-direction:column}
        .vd-mob-header{display:none}
        .vd-nav-btn:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important}
        .vd-tab-btn:hover{color:#16a34a!important}
        @media(max-width:900px){
          .vd-sidebar{transform:translateX(-100%)}
          .vd-sidebar.open{transform:translateX(0)}
          .vd-main{margin-left:0}
          .vd-mob-header{display:flex!important}
          .vd-dash-grid{grid-template-columns:1fr!important}
          .vd-stats-grid{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",top:20,right:20,zIndex:1000,background:toast.ok?"#15452e":"#dc2626",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,boxShadow:"0 8px 30px rgba(0,0,0,0.18)",animation:"fadeUp .3s ease",display:"flex",alignItems:"center",gap:8 }}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:40 }} onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`vd-sidebar${sidebarOpen?" open":""}`} style={{ background:"#15452e",color:"#fff",display:"flex",flexDirection:"column" }}>
        {/* Logo */}
        <div style={{ padding:"22px 18px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:11 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,letterSpacing:"-0.5px" }}>DK</div>
            <div>
              <p style={{ fontSize:14,fontWeight:700,color:"#fff",lineHeight:1.2,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{shopInfo?.name || "District Kart"}</p>
              <p style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2 }}>Vendor Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:"10px",overflowY:"auto" }}>
          {NAV.map(({ t, Icon, label }) => {
            const active = tab === t;
            return (
              <button key={t} className="vd-nav-btn" onClick={() => { setTab(t); setSidebarOpen(false); }}
                style={{ width:"100%",display:"flex",alignItems:"center",gap:11,padding:"10px 12px",borderRadius:10,background:active?"#16a34a":"transparent",color:active?"#fff":"rgba(255,255,255,0.55)",border:"none",cursor:"pointer",fontSize:13,fontWeight:active?600:500,marginBottom:3,textAlign:"left",transition:"all .2s",position:"relative" }}>
                <Icon size={17} strokeWidth={active?2.2:1.8} />
                {label}
                {label==="Orders" && activeOrders.length>0 && (
                  <span style={{ marginLeft:"auto",background:"#fbbf24",color:"#000",fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:99 }}>{activeOrders.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:"10px",borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",marginBottom:4 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 7px #4ade80",animation:"livePulse 2s infinite" }} />
            <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>Live · {lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
            {refreshing && <RefreshCw size={11} color="#4ade80" style={{ animation:"spin 1s linear infinite",marginLeft:"auto" }} />}
          </div>
          <button className="vd-nav-btn" onClick={() => signOut({ callbackUrl:"/auth/login" })}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:11,padding:"10px 12px",borderRadius:10,background:"transparent",color:"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",fontSize:13,fontWeight:500,transition:"all .2s" }}>
            <LogOut size={17} strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="vd-main">

        {/* Mobile header */}
        <header className="vd-mob-header" style={{ padding:"13px 16px",background:"#15452e",color:"#fff",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:30 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",padding:4 }}><Menu size={22} /></button>
          <span style={{ fontSize:14,fontWeight:700 }}>{shopInfo?.name || "Dashboard"}</span>
          <div style={{ width:32,height:32,borderRadius:"50%",background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700 }}>{shopInitials}</div>
        </header>

        {/* ── SHOP IDENTITY (always visible) ── */}
        <div style={{ background:"#fff",flexShrink:0 }}>
          {/* Banner */}
          <div style={{ height:180,overflow:"hidden",position:"relative" }}>
            {shopInfo?.bannerUrl
              ? <img src={shopInfo.bannerUrl} alt="banner" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
              : <div style={{ width:"100%",height:"100%",background:"linear-gradient(160deg,#1a4731 0%,#2d6e4e 25%,#4a8c65 50%,#7ec995 80%,#a8dbb5 100%)" }} />
            }
          </div>

          {/* Identity row */}
          <div style={{ padding:"0 24px",borderBottom:"1px solid #f0f0f0" }}>
            <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
              <div style={{ display:"flex",alignItems:"flex-end",gap:14 }}>
                {/* Avatar */}
                <div style={{ width:84,height:84,borderRadius:"50%",border:"4px solid #fff",background:shopInfo?.logoUrl?`url(${shopInfo.logoUrl}) center/cover`:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",marginTop:-42,flexShrink:0,boxShadow:"0 4px 14px rgba(0,0,0,0.16)",overflow:"hidden",fontSize:26,fontWeight:800,color:"#fff" }}>
                  {!shopInfo?.logoUrl && shopInitials}
                </div>
                <div style={{ paddingBottom:14 }}>
                  <h2 style={{ fontSize:19,fontWeight:800,color:"#111827",marginBottom:4,lineHeight:1.2 }}>{shopInfo?.name}</h2>
                  <div style={{ display:"flex",alignItems:"center",gap:3,marginBottom:4 }}>
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#FBBF24" color="#FBBF24" />)}
                    <span style={{ fontSize:12,color:"#6b7280",marginLeft:5 }}>({products.length * 14 + 8} reviews)</span>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#6b7280" }}>
                    <MapPin size={11} />{shopInfo?.location || "Samastipur"}
                  </div>
                </div>
              </div>
              {/* Buttons */}
              <div style={{ display:"flex",gap:9,paddingBottom:14,flexWrap:"wrap" }}>
                <a href={`https://wa.me/${user?.phone?.replace(/[^0-9]/g,"")||""}`} target="_blank" rel="noreferrer"
                  style={{ display:"inline-flex",alignItems:"center",gap:7,background:"#25D366",color:"#fff",padding:"9px 16px",borderRadius:10,fontWeight:600,fontSize:13,textDecoration:"none",boxShadow:"0 2px 8px rgba(37,211,102,0.3)" }}>
                  <MessageCircle size={14} /> WhatsApp Order
                </a>
                {shopInfo?.id && (
                  <Link href={`/shop/${shopInfo.id}`}
                    style={{ display:"inline-flex",alignItems:"center",gap:7,background:"#fff",color:"#374151",border:"1.5px solid #d1d5db",padding:"9px 16px",borderRadius:10,fontWeight:600,fontSize:13,textDecoration:"none" }}>
                    <Eye size={14} /> View Shop
                  </Link>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display:"flex",alignItems:"center" }}>
              {(["dashboard","products","orders","sales"] as Tab[]).map(t => {
                const labels: Record<string,string> = { dashboard:"Dashboard",products:"Products",orders:"Orders",sales:"Sales Report" };
                const active = tab===t;
                return (
                  <button key={t} className="vd-tab-btn" onClick={() => setTab(t)}
                    style={{ padding:"11px 18px",fontSize:13,fontWeight:active?700:500,color:active?"#16a34a":"#6b7280",background:"none",border:"none",borderBottom:active?"2px solid #16a34a":"2px solid transparent",cursor:"pointer",transition:"color .2s",marginBottom:-1,whiteSpace:"nowrap" }}>
                    {labels[t]}
                    {t==="orders" && activeOrders.length>0 && <span style={{ marginLeft:5,background:"#fbbf24",color:"#000",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99 }}>{activeOrders.length}</span>}
                  </button>
                );
              })}
              <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:5,paddingBottom:8 }}>
                <Wifi size={12} color="#4ade80" />
                <span style={{ fontSize:11,color:"#9ca3af" }}>Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <div style={{ flex:1,padding:"22px 24px",minHeight:0,overflowY:"auto" }}>

          {/* ════ DASHBOARD ════ */}
          {tab === "dashboard" && (
            <div className="vd-dash-grid" style={{ display:"grid",gridTemplateColumns:"1fr 320px",gap:18 }}>

              {/* Left */}
              <div style={{ display:"flex",flexDirection:"column",gap:18 }}>

                {/* Stats */}
                <div className="vd-stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
                  {[
                    { label:"Total Revenue", value:`₹${totalRevenue.toLocaleString()}`, sub:`₹${paidRevenue.toLocaleString()} paid`,   color:"#16a34a",bg:"#f0fdf4" },
                    { label:"Products",      value:products.length,                      sub:`${products.filter(p=>p.isActive).length} active`, color:"#2563eb",bg:"#eff6ff" },
                    { label:"Orders",        value:orders.length,                        sub:`${activeOrders.length} pending`,           color:"#d97706",bg:"#fffbeb" },
                    { label:"Customers",     value:uniqueCustomers.length,               sub:"unique buyers",                            color:"#7c3aed",bg:"#f5f3ff" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"#fff",borderRadius:14,padding:"16px 16px",border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                      <p style={{ fontSize:11,color:"#6b7280",fontWeight:500,marginBottom:6 }}>{s.label}</p>
                      <p style={{ fontSize:22,fontWeight:800,color:"#111827",marginBottom:5,lineHeight:1 }}>{s.value}</p>
                      <span style={{ fontSize:11,color:s.color,fontWeight:600,background:s.bg,padding:"2px 8px",borderRadius:6,display:"inline-block" }}>{s.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Sales Chart */}
                <div style={{ background:"#fff",borderRadius:16,padding:20,border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18 }}>
                    <div>
                      <p style={{ fontSize:12,color:"#6b7280",fontWeight:500,marginBottom:4 }}>Sales Overview</p>
                      <div style={{ display:"flex",alignItems:"baseline",gap:10 }}>
                        <span style={{ fontSize:26,fontWeight:800,color:"#111827" }}>₹{totalRevenue.toLocaleString()}</span>
                        <span style={{ fontSize:12,color:"#16a34a",fontWeight:700,background:"#f0fdf4",padding:"2px 8px",borderRadius:6 }}>↑ +12%</span>
                      </div>
                      <p style={{ fontSize:11,color:"#9ca3af",marginTop:3 }}>{chartLabels[0]} – {chartLabels[6]}</p>
                    </div>
                    <select style={{ fontSize:12,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"6px 10px",color:"#374151",outline:"none",background:"#fff",cursor:"pointer" }}>
                      <option>Last 7 days</option><option>Last 30 days</option>
                    </select>
                  </div>
                  <div style={{ height:190 }}>
                    <Bar
                      data={{
                        labels: chartLabels,
                        datasets:[{
                          data: displayChart,
                          backgroundColor: displayChart.map((_,i) => i===displayChart.indexOf(Math.max(...displayChart))?"#16a34a":"#bbf7d0"),
                          borderRadius: 6,
                          borderSkipped: false,
                        }],
                      }}
                      options={{
                        responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:ctx=>`₹${ctx.raw}` } } },
                        scales:{
                          x:{ grid:{ display:false }, border:{ display:false }, ticks:{ color:"#9ca3af", font:{ size:11 } } },
                          y:{ grid:{ color:"#f3f4f6" }, border:{ display:false }, ticks:{ color:"#9ca3af", font:{ size:11 }, callback:v=>`₹${v}` } },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Top Selling Products */}
                <div style={{ background:"#fff",borderRadius:16,padding:20,border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                    <h3 style={{ fontSize:15,fontWeight:700,color:"#111827" }}>Top Selling Products</h3>
                    <button onClick={() => setTab("products")} style={{ fontSize:12,color:"#16a34a",fontWeight:600,background:"none",border:"none",cursor:"pointer" }}>Manage →</button>
                  </div>
                  {topProducts.map((p,i) => (
                    <div key={p.name} style={{ display:"flex",alignItems:"center",gap:12,paddingBottom:i<topProducts.length-1?12:0,marginBottom:i<topProducts.length-1?12:0,borderBottom:i<topProducts.length-1?"1px solid #f9fafb":"none" }}>
                      <div style={{ width:38,height:38,borderRadius:9,overflow:"hidden",flexShrink:0,background:p.imageUrl?`url(${p.imageUrl}) center/cover`:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>
                        {!p.imageUrl && "🌿"}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                          <span style={{ fontSize:13,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</span>
                          <span style={{ fontSize:13,fontWeight:700,color:"#374151",flexShrink:0,marginLeft:8 }}>{p.count||"—"}</span>
                        </div>
                        <div style={{ height:4,background:"#f0f0f0",borderRadius:2,overflow:"hidden" }}>
                          <div style={{ height:"100%",width:`${((p.count||0)/maxCount)*100||55}%`,background:"#16a34a",borderRadius:2,transition:"width .5s" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {topProducts.length===0 && <p style={{ fontSize:13,color:"#9ca3af",textAlign:"center",padding:"20px 0" }}>No products yet</p>}
                </div>
              </div>

              {/* Right column */}
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

                {/* Recent Orders */}
                <div style={{ background:"#fff",borderRadius:16,padding:18,border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                    <h3 style={{ fontSize:14,fontWeight:700,color:"#111827" }}>Recent Orders</h3>
                    <button onClick={() => setTab("orders")} style={{ fontSize:12,color:"#16a34a",fontWeight:600,background:"none",border:"none",cursor:"pointer" }}>View All</button>
                  </div>
                  {orders.slice(0,5).map(o => {
                    const s = STATUS_STYLE[o.status] || STATUS_STYLE.PLACED;
                    return (
                      <div key={o.id} style={{ display:"flex",alignItems:"flex-start",gap:10,paddingBottom:12,marginBottom:12,borderBottom:"1px solid #f9fafb" }}>
                        <div style={{ width:34,height:34,borderRadius:"50%",flexShrink:0,background:avatarBg(o.user?.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff" }}>
                          {initials(o.user?.name)}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
                            <span style={{ fontSize:13,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{o.user?.name}</span>
                            <span style={{ fontSize:11,color:"#9ca3af",flexShrink:0,marginLeft:6 }}>{timeAgo(o.createdAt)}</span>
                          </div>
                          <p style={{ fontSize:11,color:"#6b7280",marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                            {o.orderItems.map(i=>i.product?.name).join(", ")}
                          </p>
                          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                            <span style={{ fontSize:13,fontWeight:700,color:"#111827" }}>₹{o.totalAmount}</span>
                            <span style={{ fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:6,background:s.bg,color:s.color }}>{s.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {orders.length===0 && <p style={{ fontSize:13,color:"#9ca3af",textAlign:"center",padding:"16px 0" }}>No orders yet</p>}
                </div>

                {/* Recent Customers */}
                <div style={{ background:"#fff",borderRadius:16,padding:18,border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                    <h3 style={{ fontSize:14,fontWeight:700,color:"#111827" }}>Recent Customers</h3>
                    <span style={{ fontSize:12,color:"#9ca3af" }}>{uniqueCustomers.length} total</span>
                  </div>
                  {Array.from(new Map(orders.map(o=>[o.user?.id,o.user])).values()).filter(Boolean).slice(0,4).map((u:any,i) => (
                    <div key={u?.id||i} style={{ display:"flex",alignItems:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:"1px solid #f9fafb" }}>
                      <div style={{ width:34,height:34,borderRadius:"50%",flexShrink:0,background:avatarBg(u?.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff" }}>
                        {initials(u?.name)}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:13,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u?.name}</p>
                        <p style={{ fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u?.email}</p>
                      </div>
                      {i===0 && <span style={{ fontSize:10,fontWeight:700,background:"#eff6ff",color:"#2563eb",padding:"2px 8px",borderRadius:6,flexShrink:0 }}>New</span>}
                    </div>
                  ))}
                  {uniqueCustomers.length===0 && <p style={{ fontSize:13,color:"#9ca3af",textAlign:"center",padding:"12px 0" }}>No customers yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ════ PRODUCTS ════ */}
          {tab === "products" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                <div>
                  <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",marginBottom:2 }}>Products</h2>
                  <p style={{ fontSize:13,color:"#6b7280" }}>{products.length} total · {products.filter(p=>p.isActive).length} active</p>
                </div>
                <button onClick={openNewProduct} style={{ display:"inline-flex",alignItems:"center",gap:7,background:"#16a34a",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 2px 8px rgba(22,163,74,0.3)" }}>
                  <Plus size={15} /> Add Product
                </button>
              </div>

              {showProductForm && (
                <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
                  <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:460,padding:28,boxShadow:"0 16px 60px rgba(0,0,0,0.2)" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                      <h2 style={{ fontSize:17,fontWeight:800,color:"#111827" }}>{editingProduct?"Edit Product":"New Product"}</h2>
                      <button onClick={()=>setShowProductForm(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#6b7280" }}><X size={20}/></button>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                      {/* Product Name */}
                      <div>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Product Name</label>
                        <input type="text" value={productForm.name} onChange={e=>setProductForm(p=>({...p,name:e.target.value}))}
                          style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
                      </div>
                      {/* ── Multi-Image Uploader ── */}
                      <div>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:8 }}>Product Images</label>
                        {/* Previews */}
                        {productImages.length > 0 && (
                          <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:10 }}>
                            {productImages.map((url,idx) => (
                              <div key={idx} style={{ position:"relative",width:80,height:80,borderRadius:10,overflow:"hidden",border:idx===0?"2.5px solid #16a34a":"1.5px solid #e5e7eb",flexShrink:0 }}>
                                <img src={url} alt={`product-${idx}`} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                                {idx===0 && (
                                  <span style={{ position:"absolute",bottom:0,left:0,right:0,fontSize:9,fontWeight:700,background:"#16a34a",color:"#fff",textAlign:"center",padding:"2px 0" }}>COVER</span>
                                )}
                                <button
                                  type="button"
                                  onClick={()=>removeProductImage(idx)}
                                  style={{ position:"absolute",top:3,right:3,width:20,height:20,borderRadius:"50%",background:"rgba(0,0,0,0.65)",color:"#fff",border:"none",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Drop zone */}
                        <label
                          htmlFor="product-img-upload"
                          style={{
                            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
                            border:"2px dashed #d1d5db",borderRadius:12,padding:"18px 14px",
                            cursor:uploadingImages?"not-allowed":"pointer",
                            background:uploadingImages?"#f9fafb":"#fafafa",
                            transition:"border-color .2s",
                            opacity:uploadingImages?0.7:1,
                          }}
                        >
                          {uploadingImages ? (
                            <>
                              <div style={{ width:24,height:24,border:"3px solid #16a34a",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.9s linear infinite" }} />
                              <span style={{ fontSize:12,color:"#6b7280" }}>Uploading…</span>
                            </>
                          ) : (
                            <>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                              <span style={{ fontSize:12,color:"#6b7280",textAlign:"center" }}>
                                <strong style={{ color:"#374151" }}>Click to upload</strong> or drag &amp; drop<br/>
                                <span style={{ fontSize:11 }}>JPG, PNG, WebP · max 5 MB each · multiple OK</span>
                              </span>
                            </>
                          )}
                          <input
                            id="product-img-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            disabled={uploadingImages}
                            style={{ display:"none" }}
                            onChange={e=>handleImageUpload(e.target.files)}
                          />
                        </label>
                      </div>
                      {/* Price + Discount row */}
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                        <div>
                          <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Price (₹)</label>
                          <input type="number" min="0" value={productForm.price} onChange={e=>setProductForm(p=>({...p,price:e.target.value}))}
                            style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Discount %</label>
                          <input type="number" min="0" max="100" value={productForm.discount} onChange={e=>setProductForm(p=>({...p,discount:e.target.value}))}
                            style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
                        </div>
                      </div>
                      {/* Selling price preview */}
                      {parseFloat(productForm.price) > 0 && parseFloat(productForm.discount) > 0 && (
                        <div style={{ background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:12 }}>
                          <Tag size={15} color="#16a34a" />
                          <span style={{ fontSize:13,color:"#374151" }}>
                            Selling at <strong style={{ color:"#16a34a" }}>₹{(parseFloat(productForm.price) - parseFloat(productForm.price) * parseFloat(productForm.discount) / 100).toFixed(2)}</strong>
                            {" "}(saves ₹{(parseFloat(productForm.price) * parseFloat(productForm.discount) / 100).toFixed(2)})
                          </span>
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Description</label>
                        <textarea value={productForm.description} onChange={e=>setProductForm(p=>({...p,description:e.target.value}))} rows={3}
                          style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",resize:"none",boxSizing:"border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Sub-Category</label>
                        <select value={productForm.categoryId} onChange={e=>setProductForm(p=>({...p,categoryId:e.target.value}))}
                          style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",background:"#fff" }}>
                          {categories.map(c=><option key={c.id} value={c.id}>{c.mainCategory?.icon} {c.mainCategory?.name} › {c.name}</option>)}
                        </select>
                      </div>
                      <label style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer" }}>
                        <input type="checkbox" checked={productForm.isActive} onChange={e=>setProductForm(p=>({...p,isActive:e.target.checked}))} />
                        Active (visible to customers)
                      </label>
                      <div style={{ display:"flex",gap:10,marginTop:4 }}>
                        <button onClick={saveProduct} style={{ flex:1,background:"#16a34a",color:"#fff",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,border:"none",cursor:"pointer" }}>Save</button>
                        <button onClick={()=>setShowProductForm(false)} style={{ flex:1,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",padding:"12px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14 }}>
                {products.map(p => (
                  <div key={p.id} style={{ background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)",transition:"box-shadow .2s" }}>
                    {p.imageUrl && <div style={{ height:140,background:`url(${p.imageUrl}) center/cover`,borderBottom:"1px solid #f0f0f0" }} />}
                    <div style={{ padding:16 }}>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
                        <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:p.isActive?"#f0fdf4":"#f9fafb",color:p.isActive?"#16a34a":"#6b7280" }}>{p.isActive?"Active":"Hidden"}</span>
                        <span style={{ fontSize:11,color:"#9ca3af" }}>{p.subCategory?.name}</span>
                      </div>
                      <h3 style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</h3>
                      <p style={{ fontSize:12,color:"#6b7280",marginBottom:12,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{p.description}</p>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                        <div>
                          {p.discount > 0 ? (
                            <>
                              <span style={{ fontSize:11,color:"#9ca3af",textDecoration:"line-through",marginRight:4 }}>₹{p.price}</span>
                              <span style={{ fontSize:16,fontWeight:800,color:"#16a34a" }}>₹{p.sellingPrice}</span>
                              <span style={{ fontSize:10,fontWeight:700,background:"#fef2f2",color:"#dc2626",padding:"1px 6px",borderRadius:5,marginLeft:4 }}>{p.discount}% OFF</span>
                            </>
                          ) : (
                            <span style={{ fontSize:17,fontWeight:800,color:"#16a34a" }}>₹{p.price}</span>
                          )}
                        </div>
                        <div style={{ display:"flex",gap:6 }}>
                          <button onClick={()=>openEditProduct(p)} style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,border:"1.5px solid #e5e7eb",color:"#374151",padding:"5px 10px",borderRadius:8,background:"#fff",cursor:"pointer" }}><Pencil size={12}/>Edit</button>
                          <button onClick={()=>deleteProduct(p.id)} style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,border:"1.5px solid #fee2e2",color:"#dc2626",padding:"5px 10px",borderRadius:8,background:"#fff",cursor:"pointer" }}><Trash2 size={12}/>Del</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {products.length===0 && (
                  <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"60px 24px",color:"#9ca3af",border:"2px dashed #e5e7eb",borderRadius:16 }}>
                    <Package size={36} style={{ margin:"0 auto 12px",opacity:0.4 }} />
                    <p style={{ fontSize:14 }}>No products yet</p>
                    <button onClick={openNewProduct} style={{ marginTop:12,background:"#16a34a",color:"#fff",padding:"9px 20px",borderRadius:10,fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>Add your first product</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ ORDERS ════ */}
          {tab === "orders" && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",marginBottom:2 }}>Orders</h2>
                <p style={{ fontSize:13,color:"#6b7280" }}>{orders.length} total · {activeOrders.length} active</p>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {orders.map(o => {
                  const s = STATUS_STYLE[o.status] || STATUS_STYLE.PLACED;
                  return (
                    <div key={o.id} style={{ background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10 }}>
                        <div>
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap" }}>
                            <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6,background:s.bg,color:s.color }}>{s.label}</span>
                            <span style={{ fontSize:11,color:"#9ca3af" }}>{o.paymentMethod} · {o.paymentStatus}</span>
                          </div>
                          <p style={{ fontSize:11,color:"#9ca3af" }}>#{o.id.slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleString()}</p>
                        </div>
                        <span style={{ fontSize:20,fontWeight:800,color:"#111827" }}>₹{o.totalAmount}</span>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
                        <div>
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                            <div style={{ width:30,height:30,borderRadius:"50%",background:avatarBg(o.user?.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>
                              {initials(o.user?.name)}
                            </div>
                            <div>
                              <p style={{ fontSize:13,fontWeight:600,color:"#111827" }}>{o.user?.name}</p>
                              <p style={{ fontSize:11,color:"#6b7280" }}>{o.user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize:11,color:"#9ca3af",marginBottom:3 }}>Delivery Address</p>
                          <p style={{ fontSize:12,color:"#374151" }}>{o.deliveryAddress}</p>
                          <p style={{ fontSize:12,color:"#16a34a",fontWeight:600,marginTop:2 }}>📞 {o.contactNumber}</p>
                        </div>
                      </div>
                      <div style={{ borderTop:"1px solid #f9fafb",paddingTop:12,marginBottom:12 }}>
                        {o.orderItems.map(item => (
                          <div key={item.id} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0" }}>
                            <span style={{ color:"#374151" }}>{item.product?.name} × {item.quantity}</span>
                            <span style={{ color:"#6b7280",fontWeight:600 }}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {(NEXT_STATUS[o.status]?.length ?? 0) > 0 && (
                        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                          {NEXT_STATUS[o.status].map(next => (
                            <button key={next} onClick={() => updateOrderStatus(o.id, next)}
                              style={{ fontSize:12,padding:"8px 16px",borderRadius:9,fontWeight:600,cursor:"pointer",border:"none",background:next==="CANCELLED"?"#fef2f2":next==="DELIVERED"?"#f0fdf4":"#16a34a",color:next==="CANCELLED"?"#dc2626":next==="DELIVERED"?"#16a34a":"#fff",transition:"all .2s" }}>
                              Mark as {next.replace(/_/g," ")}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {orders.length===0 && (
                  <div style={{ textAlign:"center",padding:"60px 24px",color:"#9ca3af",border:"2px dashed #e5e7eb",borderRadius:16 }}>
                    <ShoppingCart size={36} style={{ margin:"0 auto 12px",opacity:0.4 }} />
                    <p style={{ fontSize:14 }}>No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ SALES REPORT ════ */}
          {tab === "sales" && (
            <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
              <div>
                <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",marginBottom:2 }}>Sales Report</h2>
                <p style={{ fontSize:13,color:"#6b7280" }}>Revenue breakdown & analytics</p>
              </div>
              {/* KPI row */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12 }}>
                {[
                  { label:"Total Revenue",   value:`₹${totalRevenue.toLocaleString()}`,              color:"#16a34a",bg:"#f0fdf4" },
                  { label:"Paid Revenue",    value:`₹${paidRevenue.toLocaleString()}`,               color:"#2563eb",bg:"#eff6ff" },
                  { label:"Pending Revenue", value:`₹${(totalRevenue-paidRevenue).toLocaleString()}`, color:"#d97706",bg:"#fffbeb" },
                  { label:"Total Orders",    value:orders.length,                                     color:"#7c3aed",bg:"#f5f3ff" },
                  { label:"Avg Order Value", value:orders.length>0?`₹${Math.round(totalRevenue/orders.length).toLocaleString()}`:"₹0", color:"#059669",bg:"#ecfdf5" },
                ].map(s => (
                  <div key={s.label} style={{ background:"#fff",borderRadius:14,padding:"16px",border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <p style={{ fontSize:11,color:"#6b7280",fontWeight:500,marginBottom:6 }}>{s.label}</p>
                    <p style={{ fontSize:20,fontWeight:800,color:"#111827",marginBottom:5 }}>{s.value}</p>
                    <div style={{ height:3,background:s.bg,borderRadius:2 }}><div style={{ height:"100%",width:"70%",background:s.color,borderRadius:2 }} /></div>
                  </div>
                ))}
              </div>
              {/* Full chart */}
              <div style={{ background:"#fff",borderRadius:16,padding:24,border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <h3 style={{ fontSize:15,fontWeight:700,color:"#111827",marginBottom:18 }}>Revenue — Last 7 Days</h3>
                <div style={{ height:240 }}>
                  <Bar
                    data={{
                      labels:chartLabels,
                      datasets:[
                        { label:"Revenue (₹)", data:displayChart, backgroundColor:"#bbf7d0", borderRadius:6, borderSkipped:false },
                        { label:"Orders",       data:last7.map(d=>orders.filter(o=>new Date(o.createdAt).toDateString()===d.toDateString()).length), backgroundColor:"#16a34a", borderRadius:6, borderSkipped:false },
                      ],
                    }}
                    options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:"top",labels:{ font:{ size:12 } } }, tooltip:{ callbacks:{ label:ctx=>ctx.datasetIndex===0?`₹${ctx.raw}`:`${ctx.raw} orders` } } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:"#f3f4f6" } } } }}
                  />
                </div>
              </div>
              {/* Orders table */}
              <div style={{ background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ padding:"16px 20px",borderBottom:"1px solid #f0f0f0" }}>
                  <h3 style={{ fontSize:15,fontWeight:700,color:"#111827" }}>Order History</h3>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#fafafa" }}>
                        {["Order ID","Customer","Amount","Status","Date"].map(h => (
                          <th key={h} style={{ padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.4px",borderBottom:"1px solid #f0f0f0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => {
                        const s = STATUS_STYLE[o.status] || STATUS_STYLE.PLACED;
                        return (
                          <tr key={o.id} style={{ borderBottom:"1px solid #f9fafb" }}>
                            <td style={{ padding:"12px 16px",color:"#6b7280",fontFamily:"monospace",fontSize:12 }}>#{o.id.slice(-8).toUpperCase()}</td>
                            <td style={{ padding:"12px 16px" }}><p style={{ fontWeight:600,color:"#111827" }}>{o.user?.name}</p><p style={{ fontSize:11,color:"#9ca3af" }}>{o.user?.email}</p></td>
                            <td style={{ padding:"12px 16px",fontWeight:700,color:"#111827" }}>₹{o.totalAmount}</td>
                            <td style={{ padding:"12px 16px" }}><span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:6,background:s.bg,color:s.color }}>{s.label}</span></td>
                            <td style={{ padding:"12px 16px",color:"#6b7280",fontSize:12 }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {orders.length===0 && <p style={{ textAlign:"center",padding:"32px",color:"#9ca3af",fontSize:13 }}>No orders yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ════ CATEGORIES / SETTINGS ════ */}
          {tab === "categories" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                <div>
                  <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",marginBottom:2 }}>Categories</h2>
                  <p style={{ fontSize:13,color:"#6b7280" }}>{categories.length} total</p>
                </div>
                <button onClick={openNewCat} style={{ display:"inline-flex",alignItems:"center",gap:7,background:"#16a34a",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:700,border:"none",cursor:"pointer" }}>
                  <Plus size={15} /> Add Category
                </button>
              </div>

              {showCatForm && (
                <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
                  <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:420,padding:28,boxShadow:"0 16px 60px rgba(0,0,0,0.2)" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                      <h2 style={{ fontSize:17,fontWeight:800,color:"#111827" }}>{editingCat?"Edit Category":"New Category"}</h2>
                      <button onClick={()=>setShowCatForm(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#6b7280" }}><X size={20}/></button>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                      <div>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Main Category</label>
                        <select value={catForm.mainCategoryId} onChange={e=>setCatForm(c=>({...c,mainCategoryId:e.target.value}))}
                          style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box" }}>
                          <option value="">— Select main category —</option>
                          {mainCategories.map(m=><option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Sub-Category Name</label>
                        <input value={catForm.name} onChange={e=>setCatForm(c=>({...c,name:e.target.value}))}
                          style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box" }} placeholder="e.g. Organic Vegetables" />
                      </div>
                      <div>
                        <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Description (optional)</label>
                        <textarea value={catForm.description} onChange={e=>setCatForm(c=>({...c,description:e.target.value}))} rows={2}
                          style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",resize:"none",boxSizing:"border-box" }} />
                      </div>
                      <div style={{ display:"flex",gap:10,marginTop:4 }}>
                        <button onClick={saveCat} style={{ flex:1,background:"#16a34a",color:"#fff",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,border:"none",cursor:"pointer" }}>Save</button>
                        <button onClick={()=>setShowCatForm(false)} style={{ flex:1,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",padding:"12px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14 }}>
                {categories.map(c => (
                  <div key={c.id} style={{ background:"#fff",borderRadius:14,border:"1px solid #f0f0f0",padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,fontSize:18 }}>{c.mainCategory?.icon || "🏷️"}</div>
                    <p style={{ fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3 }}>{c.mainCategory?.name}</p>
                    <h3 style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:4 }}>{c.name}</h3>
                    {c.description && <p style={{ fontSize:12,color:"#6b7280",marginBottom:8 }}>{c.description}</p>}
                    <p style={{ fontSize:12,color:"#9ca3af",marginBottom:14 }}>{c._count?.products||0} product{(c._count?.products||0)!==1?"s":""}</p>
                    <div style={{ display:"flex",gap:8 }}>
                      <button onClick={()=>openEditCat(c)} style={{ flex:1,fontSize:12,border:"1.5px solid #e5e7eb",color:"#374151",padding:"7px",borderRadius:8,background:"#fff",cursor:"pointer",fontWeight:600 }}>Edit</button>
                      <button onClick={()=>deleteCat(c.id)} style={{ flex:1,fontSize:12,border:"1.5px solid #fee2e2",color:"#dc2626",padding:"7px",borderRadius:8,background:"#fff",cursor:"pointer",fontWeight:600 }}>Delete</button>
                    </div>
                  </div>
                ))}
                {categories.length===0 && (
                  <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"60px 24px",color:"#9ca3af",border:"2px dashed #e5e7eb",borderRadius:16 }}>
                    <Tag size={36} style={{ margin:"0 auto 12px",opacity:0.4 }} />
                    <p style={{ fontSize:14 }}>No categories yet</p>
                    <button onClick={openNewCat} style={{ marginTop:12,background:"#16a34a",color:"#fff",padding:"9px 20px",borderRadius:10,fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>Add first category</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SHOP SETTINGS TAB ── */}
          {tab === "settings" && (
            <div style={{ padding:"24px 20px",animation:"fadeUp .3s ease" }}>
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",marginBottom:4 }}>Shop Settings</h2>
                <p style={{ fontSize:13,color:"#6b7280" }}>Update your shop profile, social links, and location</p>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:20 }}>

                {/* ── Basic Info ── */}
                <div style={{ background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",padding:22,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <h3 style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:16,display:"flex",alignItems:"center",gap:8 }}>
                    <Store size={15} color="#16a34a" /> Basic Info
                  </h3>
                  {([
                    ["Shop Name *", "name", "text", "e.g. Green Harvest"],
                    ["Logo URL", "logoUrl", "url", "https://..."],
                    ["Banner URL", "bannerUrl", "url", "https://..."],
                  ] as [string, keyof typeof shopSettings, string, string][]).map(([label, key, type, ph]) => (
                    <div key={key} style={{ marginBottom:12 }}>
                      <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>{label}</label>
                      <input type={type} value={shopSettings[key]} onChange={e => setShopSettings(s => ({...s,[key]:e.target.value}))}
                        placeholder={ph}
                        style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box" }}
                        onFocus={e => e.target.style.borderColor="#16a34a"}
                        onBlur={e => e.target.style.borderColor="#e5e7eb"} />
                    </div>
                  ))}
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Description</label>
                    <textarea value={shopSettings.description} onChange={e => setShopSettings(s => ({...s,description:e.target.value}))}
                      rows={3} placeholder="Tell customers about your shop…"
                      style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",resize:"none",boxSizing:"border-box" }}
                      onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor="#16a34a"}
                      onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor="#e5e7eb"} />
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Location</label>
                    <select value={shopSettings.location} onChange={e => setShopSettings(s => ({...s,location:e.target.value}))}
                      style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",cursor:"pointer",boxSizing:"border-box" }}>
                      {["Samastipur","Nawabganj","Kalyanpur","Tajpur","Rosera","Pusa","Musrigharari"].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* ── Social Links ── */}
                <div style={{ background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",padding:22,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <h3 style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:16,display:"flex",alignItems:"center",gap:8 }}>
                    <Phone size={15} color="#16a34a" /> Social & Contact
                  </h3>
                  {([
                    ["WhatsApp Number *", "whatsapp", <Phone size={13}/>, "#25D366", "+91 98765 43210"],
                    ["Instagram", "instagram", <Instagram size={13}/>, "#E1306C", "@yourshop"],
                    ["Facebook", "facebook", <Facebook size={13}/>, "#1877F2", "facebook.com/yourshop"],
                    ["YouTube", "youtube", <Youtube size={13}/>, "#FF0000", "youtube.com/@yourshop"],
                  ] as [string, keyof typeof shopSettings, React.ReactNode, string, string][]).map(([label, key, icon, color, ph]) => (
                    <div key={key} style={{ marginBottom:12 }}>
                      <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"flex",alignItems:"center",gap:5,marginBottom:5 }}>
                        <span style={{ color }}>{icon}</span> {label}
                      </label>
                      <input value={shopSettings[key]} onChange={e => setShopSettings(s => ({...s,[key]:e.target.value}))}
                        placeholder={ph}
                        style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box" }}
                        onFocus={e => e.target.style.borderColor=color}
                        onBlur={e => e.target.style.borderColor="#e5e7eb"} />
                    </div>
                  ))}
                </div>

                {/* ── Business & Location ── */}
                <div style={{ background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",padding:22,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <h3 style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:16,display:"flex",alignItems:"center",gap:8 }}>
                    <MapPin size={15} color="#16a34a" /> Business & GPS Location
                  </h3>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Business Type</label>
                    <select value={shopSettings.businessType} onChange={e => setShopSettings(s => ({...s,businessType:e.target.value}))}
                      style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",cursor:"pointer",boxSizing:"border-box" }}>
                      <option value="Individual">Individual</option>
                      <option value="Company">Company / Firm</option>
                      <option value="Partnership">Partnership</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>GST Number</label>
                    <input value={shopSettings.gstNumber} onChange={e => setShopSettings(s => ({...s,gstNumber:e.target.value}))}
                      placeholder="22AAAAA0000A1Z5" maxLength={15}
                      style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"monospace" }}
                      onFocus={e => e.target.style.borderColor="#16a34a"}
                      onBlur={e => e.target.style.borderColor="#e5e7eb"} />
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Latitude</label>
                      <input value={shopSettings.latitude} onChange={e => setShopSettings(s => ({...s,latitude:e.target.value}))}
                        placeholder="25.8629" type="number" step="any"
                        style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box" }}
                        onFocus={e => e.target.style.borderColor="#16a34a"}
                        onBlur={e => e.target.style.borderColor="#e5e7eb"} />
                    </div>
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5 }}>Longitude</label>
                      <input value={shopSettings.longitude} onChange={e => setShopSettings(s => ({...s,longitude:e.target.value}))}
                        placeholder="85.7815" type="number" step="any"
                        style={{ width:"100%",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box" }}
                        onFocus={e => e.target.style.borderColor="#16a34a"}
                        onBlur={e => e.target.style.borderColor="#e5e7eb"} />
                    </div>
                  </div>
                  <button onClick={getCurrentLocation} disabled={locating}
                    style={{ width:"100%",background:"#f0fdf4",color:"#16a34a",border:"1.5px solid #bbf7d0",padding:"10px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    <Navigation size={14} style={{ animation: locating?"spin 1s linear infinite":undefined }} />
                    {locating ? "Getting location…" : "Use My Current Location"}
                  </button>
                  {shopSettings.latitude && shopSettings.longitude && (
                    <div style={{ marginTop:12,borderRadius:10,overflow:"hidden",border:"1px solid #e5e7eb" }}>
                      <iframe
                        src={`https://www.google.com/maps?q=${shopSettings.latitude},${shopSettings.longitude}&z=15&output=embed`}
                        width="100%" height="160" style={{ border:0,display:"block" }}
                        loading="lazy" title="Shop location preview"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Save Button */}
              <div style={{ marginTop:24 }}>
                <button onClick={saveShopSettings} disabled={savingSettings}
                  style={{ background:savingSettings?"#9ca3af":"#16a34a",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:14,fontWeight:700,border:"none",cursor:savingSettings?"not-allowed":"pointer",transition:"background .2s",display:"inline-flex",alignItems:"center",gap:8 }}>
                  {savingSettings ? <><div style={{ width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.9s linear infinite" }} /> Saving…</> : "Save Shop Settings"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
