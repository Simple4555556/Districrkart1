import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("P@ssword123", 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@districtkart.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@districtkart.com",
      password,
      role: "ADMIN",
    },
  });

  // 2. Create Vendor
  const vendor = await prisma.user.upsert({
    where: { email: "vendor@districtkart.com" },
    update: {},
    create: {
      name: "Kashish Handlooms",
      email: "vendor@districtkart.com",
      password,
      role: "VENDOR",
      phone: "+91 91234 56789",
    },
  });

  // 3. Create Shop for Vendor
  const shop = await prisma.shop.upsert({
    where: { vendorId: vendor.id },
    update: {},
    create: {
      name: "Kashish Handlooms",
      description: "Exclusive collection of Samastipur handlooms and traditional wear.",
      status: "APPROVED",
      isActive: true,
      vendorId: vendor.id,
    },
  });

  // 4. Create MainCategory (global — admin-owned)
  const fashionMain = await prisma.mainCategory.upsert({
    where: { name: "Fashion" },
    update: {},
    create: {
      name: "Fashion",
      icon: "👗",
      description: "Clothing, accessories and traditional wear",
    },
  });

  // 5. Create SubCategory for this shop under the MainCategory
  const ethnicSub = await prisma.subCategory.upsert({
    where: { name_shopId: { name: "Ethnic Wear", shopId: shop.id } },
    update: {},
    create: {
      name: "Ethnic Wear",
      description: "Sarees, Suits and more",
      mainCategoryId: fashionMain.id,
      shopId: shop.id,
    },
  });

  // 6. Create Products using the SubCategory
  await prisma.product.createMany({
    data: [
      {
        name: "Premium Silk Saree",
        description: "Hand-woven traditional silk saree from Samastipur weaver society.",
        price: 4500,
        imageUrl:
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
        subCategoryId: ethnicSub.id,
        shopId: shop.id,
      },
      {
        name: "Cotton Kurtis",
        description: "Comfortable daily wear cotton kurtis with elegant prints.",
        price: 899,
        imageUrl:
          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800",
        subCategoryId: ethnicSub.id,
        shopId: shop.id,
      },
    ],
  });

  // 7. Create normal User
  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "Customer User",
      email: "user@example.com",
      password,
      role: "USER",
    },
  });

  console.log("Seed data created successfully!");
  console.log("Admin:  admin@districtkart.com  / P@ssword123");
  console.log("Vendor: vendor@districtkart.com / P@ssword123");
  console.log("User:   user@example.com        / P@ssword123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
