import Link from "next/link";
import { Shop as PrismaShop } from "@prisma/client";

const gradients = [
  "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
  "linear-gradient(135deg, #F093FB 0%, #F5576C 100%)",
  "linear-gradient(135deg, #4ECDC4 0%, #556270 100%)",
  "linear-gradient(135deg, #FA709A 0%, #FEE140 100%)",
  "linear-gradient(135deg, #A8E6CF 0%, #88D4AB 100%)",
  "linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)",
  "linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%)",
  "linear-gradient(135deg, #2CD8D5 0%, #C5C1FF 100%)",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export default function VendorCard({ shop }: { shop: Partial<PrismaShop> }) {
  const initial = shop.name?.[0] ?? "S";
  const bg = getGradient(shop.name || "Shop");

  return (
    <div className="vendor-showcase-card">
      <div className="vendor-banner" style={{ background: bg }}>
        <div className="vendor-avatar">
          <div className="vendor-avatar-inner">{initial}</div>
        </div>
      </div>
      <div className="vendor-body">
        <h4 className="vendor-name">{shop.name}</h4>
        <div className="vendor-meta">
          <span className="stars">★★★★★</span>
          <span className="vendor-rating-num">4.9</span>
          <span>·</span>
          <span>Marketplace</span>
        </div>
        <p className="vendor-desc">{shop.description || "No description available yet."}</p>
      </div>
      <div className="vendor-footer">
        <span className="status-badge active">● Active</span>
        <Link href={`/shop/${shop.id}`} className="view-shop-btn">View Shop →</Link>
      </div>
    </div>
  );
}
