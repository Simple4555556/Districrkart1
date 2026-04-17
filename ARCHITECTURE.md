# District Kart: System Architecture Documentation

This document provides a comprehensive "A to Z" technical blueprint of the **District Kart** platform, a multi-vendor hyperlocal marketplace designed for the Samastipur region.

---

## 1. Tech Stack Overview

District Kart is built on a modern, high-performance stack optimized for scalability, accessibility, and SEO.

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14.2.0](https://nextjs.org/) (App Router) | RSC for data fetching; `"use client"` only where state is needed |
| **Primary Styling** | `styles.css` — Custom Design System | CSS custom properties (`--bg-primary`, `--text-secondary`, etc.) drive all theming |
| **Utility Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Used for dashboard layouts and quick utilities |
| **Theme System** | `ThemeContext` + `data-theme` attribute | Light / Dark toggle; persisted to `localStorage` |
| **Database ORM** | [Prisma 5.12.1](https://www.prisma.io/) | Type-safe queries; `select` guards prevent over-fetching |
| **Database** | **SQLite** (dev) · **PostgreSQL via Supabase** (prod) | Schema identical; provider swapped via `DATABASE_URL` |
| **Authentication** | [NextAuth.js v4](https://next-auth.js.org/) | JWT sessions; Role-Based Access Control (RBAC) |
| **Charts** | [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/) | Used in Vendor Dashboard (Sales Overview, Sales Report) |
| **Realtime / Client** | [Supabase JS SDK](https://supabase.com/docs/reference/javascript) | Client initialised in `lib/supabase.ts`; 30-second polling adds live-feel on vendor dashboard |
| **Animations** | [Framer Motion 12](https://www.framer.com/motion/) | Page transitions & scroll animations on marketing pages |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent icon set across all components |
| **Error Monitoring** | [Sentry](https://sentry.io/) | Global crash reporting and performance monitoring |

---

## 2. Theme System

District Kart ships a first-class **Light / Dark theme** with zero flash of unstyled content.

### How It Works

```
ThemeProvider (components/ThemeContext.tsx)
  │
  ├─ On mount: reads localStorage("dk-theme") or prefers-color-scheme
  ├─ Sets document.documentElement.setAttribute("data-theme", "light"|"dark")
  └─ Exposes { theme, toggleTheme } via useTheme() hook
```

### CSS Variable Architecture

All semantic tokens live in `styles.css` under `:root` (light) and are overridden by `[data-theme="dark"]`:

```css
:root {
  --bg-primary:    #FFFFFF;
  --bg-secondary:  #FAFAFA;
  --bg-card:       #FFFFFF;
  --text-primary:  #171717;
  --text-secondary:#525252;
  --border-light:  #E5E5E5;
  /* + spacing, radii, shadow, typography tokens */
}

[data-theme="dark"] {
  --bg-primary:    #0F172A;
  --bg-secondary:  #1E293B;
  --bg-card:       #1E293B;
  --text-primary:  #F1F5F9;
  --text-secondary:#94A3B8;
  --border-light:  #1E293B;
  /* + stronger shadow values */
}
```

Component-level overrides (e.g. `.site-header`, `.hero-section`, `.testimonial-card-green`) are co-located in the same `[data-theme="dark"]` block.

### Integration Points

| File | Role |
| :--- | :--- |
| `components/ThemeContext.tsx` | Context provider + `useTheme()` hook |
| `components/Providers.tsx` | Wraps `<ThemeProvider>` around `<SessionProvider>` |
| `app/layout.tsx` | `<html suppressHydrationWarning>` prevents SSR/client mismatch |
| `app/globals.css` | `body { background: var(--bg-primary); color: var(--text-primary); }` |
| `components/Header.tsx` | Sun/Moon toggle button — always visible on both desktop and mobile |

---

## 3. Database Schema & Relationships

The platform uses a relational data model to manage the hierarchy between vendors, shops, and customers.

### Core Models

| Model | Description | Primary Relationships |
| :--- | :--- | :--- |
| **User** | Core identity for Admins, Vendors, Riders, and Customers. | Owns 1 Shop (if Vendor); has Many Orders; has Many Reviews. |
| **Shop** | The storefront entity representing a local business. Fields: `name`, `description`, `logoUrl`, `bannerUrl`, `location`, `status`, `isActive`. | Belongs to 1 Vendor; has Many Products, Categories, Orders, Coupons. |
| **Category** | Logical grouping for products within a specific shop. | Belongs to 1 Shop; contains Many Products. |
| **Product** | Individual items for sale. Fields: `name`, `description`, `price`, `imageUrl`, `isActive`. | Belongs to 1 Shop & 1 Category; has Many Reviews. |
| **Order** | Encapsulates a transaction. Fields: `paymentMethod` (COD/Online), `paymentStatus`, `deliveryAddress`, `contactNumber`. | Linked to 1 User & 1 Shop; contains Multiple OrderItems. |
| **OrderItem** | Snapshot of a product's price and quantity at the time of order. | Belongs to 1 Order; references 1 Product. |
| **CartItem** | Persistent shopping cart items for authenticated users. Unique constraint on `[userId, productId]`. | Linked to 1 User & 1 Product. |
| **Review** | Customer feedback for products. | Linked to 1 Product and 1 User. |
| **Coupon** | Promotional discounts offered by shops. | Linked to 1 Shop. |

### Key Logic: Location & Hyperlocal Filtering

Each `Shop` has a `location` field (e.g., `"Nawabganj"`, `"Samastipur Junction"`). The homepage (`app/page.tsx`) reads a `loc` search parameter to filter shops and products, ensuring users see the most relevant local options first.

### Order Status Workflow

```
PLACED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                ↘                                  ↗
              CANCELLED (allowed from PLACED or PROCESSING)
```

---

## 4. Role-Based Access Control (RBAC)

Security is enforced at the server level using NextAuth sessions and Prisma query-level guards.

### User Roles

| Role | Route Access | Key Permissions |
| :--- | :--- | :--- |
| **ADMIN** | `/admin` | Approve/reject shops; view platform-wide revenue; manage all users. |
| **VENDOR** | `/vendor` | Manage own shop profile, categories, products; process own orders. |
| **RIDER** | `/rider` | Manage delivery assignments; update order status to `SHIPPED` / `DELIVERED`. |
| **USER** | `/user`, `/cart`, `/checkout` | Browse shops & products; manage own cart and profile. |

### Visibility & Status Logic

A product is publicly visible only when **all three** conditions are met:

1. `Shop.status === "APPROVED"` — set by an Admin.
2. `Shop.isActive === true`
3. `Product.isActive === true`

**Guardrails:** API routes validate that a Vendor's `shopId` matches the resource being mutated — preventing cross-shop data tampering.

---

## 5. Directory Structure & Core Modules

```text
├── app/
│   ├── admin/                # Admin dashboards — stats, vendor approvals
│   ├── api/
│   │   ├── auth/             # NextAuth route handler
│   │   ├── vendor/           # shop · products · categories · orders · cart
│   │   ├── admin/            # Platform-level management endpoints
│   │   ├── cart/             # Customer cart mutations
│   │   └── user/             # Profile management
│   ├── auth/                 # Login / Register pages
│   ├── cart/                 # Customer cart page
│   ├── category/[slug]/      # Category browse pages
│   ├── checkout/             # Checkout flow & address entry
│   ├── shop/[id]/            # Dynamic shop storefronts  ← redesigned
│   ├── vendor/               # Vendor dashboard          ← redesigned
│   │   ├── page.tsx          # Main dashboard (client)
│   │   ├── layout.tsx        # Auth + approval guard
│   │   └── pending/          # Approval-pending holding page
│   ├── globals.css           # Tailwind directives + body theme tokens
│   ├── layout.tsx            # Root layout — fonts, Providers, CookieBanner
│   └── page.tsx              # Homepage — hyperlocal product grid (ISR 60s)
│
├── components/
│   ├── ThemeContext.tsx       # Light/Dark theme provider + useTheme() hook
│   ├── Providers.tsx         # SessionProvider + ThemeProvider
│   ├── Header.tsx            # Sticky nav — Sun/Moon toggle, mobile drawer
│   ├── Footer.tsx            # Site footer with Framer Motion animations
│   ├── Hero.tsx              # Marketing hero section
│   ├── CategoryShowcase.tsx  # 5-column category grid with hover overlays
│   ├── HowItWorks.tsx        # 3-step explainer with icons
│   ├── Testimonials.tsx      # Customer review cards (3 colour variants)
│   ├── ShopCTA.tsx           # Vendor sign-up call-to-action banner
│   ├── ProductCard.tsx       # Interactive product tile (cart, WhatsApp, shop link)
│   ├── VendorCard.tsx        # Shop listing card with gradient banner
│   └── CookieBanner.tsx      # GDPR-compliant consent banner
│
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   └── supabase.ts           # Supabase JS client (realtime / storage)
│
├── styles.css                # Master design system — tokens, components, dark theme
└── prisma/
    └── schema.prisma         # Single source of truth for DB schema
```

---

## 6. Key Page Architectures

### 6a. Shop Storefront (`app/shop/[id]/page.tsx`)

A **Server Component** that fetches shop + products via Prisma, then renders:

```
┌─ Full-Width Hero Banner (280px) ──────────────────────────────────┐
│  bannerUrl image  OR  scenic green CSS gradient fallback          │
└───────────────────────────────────────────────────────────────────┘
┌─ Identity Row ────────────────────────────────────────────────────┐
│  [Circular Avatar -mt-16]  Shop Name  ★★★★★  Location Pin        │
│                            [WhatsApp Order]  [Follow]             │
└───────────────────────────────────────────────────────────────────┘
┌─ Tab Bar ─────────────────────────────────────────────────────────┐
│  Products (active, green underline)  │  About  │  Reviews         │
└───────────────────────────────────────────────────────────────────┘
┌─ Products Header ─────────────────────────────────────────────────┐
│  "Our Products"  +  description              [Sort: Popular ▾]    │
└───────────────────────────────────────────────────────────────────┘
  product-grid-4  →  <ProductCard /> ×N
  
  store-map-section  →  Contact info + Google Maps iframe
```

### 6b. Vendor Dashboard (`app/vendor/page.tsx`)

A **Client Component** (`"use client"`) with 30-second live polling and Chart.js visualisations.

```
┌─ Sidebar (240px, bg #15452e) ─────────────────────────────────────┐
│  DK Logo  │  Dashboard  Products  Orders  Sales Report  Settings  │
│           │  ● Live pulse  │  Sign Out                            │
└───────────────────────────────────────────────────────────────────┘
┌─ Main (flex-1) ───────────────────────────────────────────────────┐
│  ┌─ Shop Identity (always visible) ─────────────────────────────┐ │
│  │  Banner  →  Avatar  Shop Name  ★ Rating  [WhatsApp][View Shop]│ │
│  │  [Dashboard] [Products] [Orders] [Sales Report]   Wifi Live   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Dashboard Tab:                                                   │
│  ┌─ Stats (4-col) ──────┐  ┌─ Right column ──────────────────┐  │
│  │ Revenue Products     │  │ Recent Orders (avatars + badges) │  │
│  │ Orders  Customers    │  │ Recent Customers (de-duped)      │  │
│  ├─ Sales Chart (Bar) ──┤  └──────────────────────────────────┘  │
│  │ Last 7 days revenue  │                                         │
│  ├─ Top Products ───────┤                                         │
│  │ Name + progress bar  │                                         │
│  └──────────────────────┘                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Tab → Content mapping:**

| Tab | Content |
| :--- | :--- |
| Dashboard | Stats cards, Bar chart (7-day revenue), Top selling products, Recent orders, Recent customers |
| Products | Image card grid; Add/Edit/Delete modal with `imageUrl` field |
| Orders | Full order cards with status badges, address, items, next-status action buttons |
| Sales Report | 5 KPI cards, grouped Bar chart (revenue + order count), full order history table |
| Settings | Category grid with Add/Edit/Delete modal |

### 6c. Live Data Strategy

The vendor dashboard does **not** use WebSockets. Instead, it:
1. Fetches all data (`shop`, `products`, `categories`, `orders`) in parallel via `Promise.all` on mount.
2. Re-fetches every **30 seconds** via `setInterval`, updating state silently (no loading spinner — only a `RefreshCw` spin indicator in the tab bar).
3. Shows an animated green pulse **"Live"** dot in the sidebar footer.

---

## 7. Security & Performance

### Data Sanitization

All Prisma queries for `User` or `Shop` data use explicit `.select()` blocks — `password` hashes and internal flags are never returned to the client.

### Performance Optimizations

| Technique | Where Applied |
| :--- | :--- |
| **ISR (60s revalidation)** | Homepage (`app/page.tsx`) |
| **React Server Components** | Shop storefront, Admin pages — zero client JS for static data |
| **`next/image`** | All product and shop assets — automatic WebP conversion and lazy loading |
| **CSS Custom Properties** | All theme tokens resolved at paint time — no JS-in-CSS overhead |
| **`suppressHydrationWarning`** | `<html>` element — prevents React warning from `data-theme` attribute set by client script |

### Accessibility (a11y)

- Every interactive element carries an `aria-label`.
- The mobile navigation drawer traps focus and responds to `Escape`.
- Colour contrast meets WCAG AA in both light and dark themes.
- The Sun/Moon toggle is keyboard-navigable with visible focus ring.

---

## 8. Environment Variables

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Prisma connection string (SQLite path or Supabase Postgres URL) |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `NEXTAUTH_URL` | Yes | Canonical app URL for OAuth callbacks |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (safe for client) |
| `SENTRY_DSN` | Optional | Error tracking DSN |

---

*Last Updated: April 2026*
