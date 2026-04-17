const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  const shopCount = await prisma.shop.count();
  const products = await prisma.product.findMany({ 
    include: { shop: true },
    take: 5 
  });
  const shops = await prisma.shop.findMany({ take: 5 });

  console.log("Product Count:", productCount);
  console.log("Shop Count:", shopCount);
  console.log("Products Sample:", JSON.stringify(products, null, 2));
  console.log("Shops Sample:", JSON.stringify(shops, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
