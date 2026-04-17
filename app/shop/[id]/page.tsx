import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopTabs from "@/components/ShopTabs";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Star, MessageCircle, Heart } from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const shop = await prisma.shop.findUnique({
    where: { id: params.id },
  });

  if (!shop) {
    return { title: "Shop Not Found | District Kart" };
  }

  return {
    title: `${shop.name} | Shop Local on District Kart`,
    description: shop.description || `Browse products from ${shop.name} on District Kart, Samastipur's local marketplace.`,
    openGraph: {
      title: `${shop.name} - District Kart`,
      description: shop.description || `Check out ${shop.name} on District Kart.`,
      images: [shop.logoUrl || "/og-image.png"],
    },
  };
}

export default async function ShopPage({ params }: { params: { id: string } }) {
  const shop = await prisma.shop.findUnique({
    where: { id: params.id },
    include: {
      vendor: { select: { phone: true, email: true, name: true } },
      products: {
        where: { isActive: true },
        include: { subCategory: { include: { mainCategory: true } } },
      },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shop) notFound();

  const s = shop as any;

  // Derive unique subcategories from active products
  const subcategoryMap = new Map<string, { id: string; name: string }>();
  for (const p of s.products as Array<{ subCategoryId: string; subCategory?: { name: string } }>) {
    if (p.subCategoryId && p.subCategory && !subcategoryMap.has(p.subCategoryId)) {
      subcategoryMap.set(p.subCategoryId, { id: p.subCategoryId, name: p.subCategory.name });
    }
  }
  const subcategories = Array.from(subcategoryMap.values());

  const shopLocation = shop.location || "Samastipur";
  const vendorPhone  = s.vendor?.phone || "+91 91427 17690";
  const vendorEmail  = s.vendor?.email || "";
  const initials     = shop.name?.slice(0, 2).toUpperCase() || "S";
  const bannerUrl    = s.bannerUrl as string | undefined;

  const avgRating = s.reviews.length
    ? s.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / s.reviews.length
    : 4.8;
  const reviewCount = s.reviews.length || s.products.length * 14 + 8;

  return (
    <main>
      <Header />

      {/* ── Full-Width Hero Banner ── */}
      <div style={{ width: "100%", height: 280, position: "relative", overflow: "hidden" }}>
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${shop.name} banner`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(160deg, #1a4731 0%, #2d6e4e 20%, #3d8c60 40%, #5aab7a 60%, #7ec995 80%, #a8dbb5 100%)",
          }} />
        )}
      </div>

      {/* ── Shop Identity Row ── */}
      <div style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="container container-wide">
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between", flexWrap: "wrap", gap: 16,
          }}>
            {/* Left: avatar + info */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
              <div style={{
                width: 120, height: 120, borderRadius: "50%",
                border: "4px solid var(--bg-primary)",
                background: shop.logoUrl
                  ? `url(${shop.logoUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg, #1a4731, #2d9d5a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: -60,
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                overflow: "hidden",
              }}>
                {!shop.logoUrl && (
                  <span style={{ color: "#fff", fontSize: 36, fontWeight: 700 }}>{initials}</span>
                )}
              </div>

              <div style={{ paddingBottom: 20 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.2 }}>
                  {shop.name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={15}
                      fill={i <= Math.round(avgRating) ? "#FBBF24" : "none"}
                      color={i <= Math.round(avgRating) ? "#FBBF24" : "#D1D5DB"} />
                  ))}
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginLeft: 2 }}>
                    {s.reviews.length > 0 ? avgRating.toFixed(1) : "4.8"}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    ({reviewCount} reviews)
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                  <MapPin size={13} />
                  <span>{shopLocation}</span>
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 20, flexWrap: "wrap" }}>
              <a
                href={`https://wa.me/${vendorPhone.replace(/[^0-9]/g, "")}`}
                target="_blank" rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#25D366", color: "#fff",
                  padding: "10px 20px", borderRadius: 10,
                  fontWeight: 600, fontSize: 14, textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
                }}
              >
                <MessageCircle size={16} /> WhatsApp Order
              </a>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--bg-primary)", color: "var(--text-primary)",
                border: "1.5px solid var(--border-default)",
                padding: "10px 20px", borderRadius: 10,
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
                <Heart size={16} /> Follow
              </button>
            </div>
          </div>

          {/* ShopTabs renders its own tab bar + all panels */}
          <ShopTabs
            shop={{
              id:           shop.id,
              name:         shop.name,
              description:  shop.description,
              logoUrl:      shop.logoUrl,
              location:     shop.location,
              whatsapp:     s.whatsapp   ?? null,
              instagram:    s.instagram  ?? null,
              facebook:     s.facebook   ?? null,
              youtube:      s.youtube    ?? null,
              gstNumber:    s.gstNumber  ?? null,
              businessType: s.businessType ?? null,
              latitude:     s.latitude   ?? null,
              longitude:    s.longitude  ?? null,
            }}
            products={s.products}
            subcategories={subcategories}
            reviews={s.reviews}
            vendor={s.vendor}
            vendorPhone={vendorPhone}
            vendorEmail={vendorEmail}
            shopLocation={shopLocation}
          />
        </div>
      </div>

      <Footer />
    </main>
  );
}
