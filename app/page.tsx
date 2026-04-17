import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import VendorCard from "@/components/VendorCard";
import HowItWorks from "@/components/HowItWorks";
import CategoryShowcase from "@/components/CategoryShowcase";
import DiscoverShops from "@/components/DiscoverShops";
import Testimonials from "@/components/Testimonials";
import ShopCTA from "@/components/ShopCTA";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { loc?: string };
}) {
  const location = searchParams.loc || "all";
  const shopWhere: any = { status: "APPROVED", isActive: true };
  if (location !== "all") {
    shopWhere.location = location;
  }

  const shops = await prisma.shop.findMany({
    where: shopWhere,
    take: 8,
  });

  const serializedShops = shops.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: null as string | null,
  }));

  return (
    <main>
      <Header />
      <Hero />
      
      <div className="page page-home active">

        {/* 1. Trending Shops */}
        <section className="section" id="trending-shops">
          <div className="container container-wide">
            <div className="section-header">
              <span className="text-overline">Featured</span>
              <h2 className="text-h2">Trending Shops</h2>
              <p className="text-body">Handpicked local shops loved by customers in Samastipur</p>
            </div>
            
            <div className="trending-slider">
              {shops.length > 0 ? (
                shops.slice(0, 6).map((shop) => <VendorCard key={shop.id} shop={shop} />)
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#A3A3A3', width: '100%' }}>
                  <p>No active shops at the moment. Check back later!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. How It Works */}
        <HowItWorks />

        {/* 3. Discover Local Shops */}
        <DiscoverShops shops={serializedShops} />

        {/* 4. Category Showcase */}
        <CategoryShowcase />

        {/* 5. Testimonials */}
        <Testimonials />

        {/* 6. CTA Banner */}
        <ShopCTA />
      </div>

      <Footer />
    </main>
  );
}
