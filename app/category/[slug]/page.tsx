import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import VendorCard from "@/components/VendorCard";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  // Decode slug — e.g. "food" → match MainCategory name case-insensitively
  const decodedSlug = decodeURIComponent(params.slug);

  // Find the MainCategory matching the slug
  // SQLite is case-insensitive for ASCII by default, so simple equals works
  const mainCategory = await prisma.mainCategory.findFirst({
    where: { name: decodedSlug },
  });

  // Find approved shops that have at least one SubCategory under this MainCategory
  const shops = await prisma.shop.findMany({
    where: {
      status: "APPROVED",
      isActive: true,
      ...(mainCategory
        ? { subCategories: { some: { mainCategoryId: mainCategory.id } } }
        : {}),
    },
    include: {
      _count: { select: { products: true } },
    },
  });

  const displayName = mainCategory?.name ?? decodedSlug;

  return (
    <main>
      <Header />
      <div className="container container-wide section">
        <div className="section-header">
          <h1 className="text-h2 capitalize">
            {mainCategory?.icon && <span className="mr-2">{mainCategory.icon}</span>}
            {displayName} Shops
          </h1>
          <p className="text-body text-gray-500">
            Discover top-rated local vendors in the {displayName} category
          </p>
        </div>

        <div className="product-grid-4 mt-8">
          {shops.length > 0 ? (
            shops.map((shop) => <VendorCard key={shop.id} shop={shop} />)
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400">
              <p className="text-4xl mb-4">🏪</p>
              <p>No shops found in this category yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
