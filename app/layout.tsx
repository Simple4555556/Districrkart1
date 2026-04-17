import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "@/styles.css"; // We'll move the css to root or reference effectively
import "./globals.css"; // For tailwind (dashboards use it)
import Providers from "@/components/Providers";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL("https://districtkart.com"),
  title: "District Kart | Discover Local Shops in Samastipur",
  description: "Samastipur's premium hyperlocal marketplace. Shop from your favorite local stores for food, cakes, clothes, electronics, and more with home delivery.",
  keywords: ["District Kart", "Samastipur Shopping", "Local Marketplace", "Online Delivery Samastipur", "Hyperlocal E-commerce"],
  authors: [{ name: "District Kart Team" }],
  openGraph: {
    title: "District Kart | Your Trusted Local Marketplace",
    description: "Empowering Samastipur's local vendors and providing customers with the best online shopping experience.",
    url: "https://districtkart.com",
    siteName: "District Kart",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "District Kart - Local Shopping Hub",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "District Kart | Samastipur's Local Shopping Hub",
    description: "Bringing your local high street stores to your fingertips.",
    images: ["/og-image.png"],
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans`}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
