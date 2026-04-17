import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/vendor/products
export async function GET() {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ error: "No shop found for this vendor" }, { status: 404 });

  const products = await prisma.product.findMany({
    where: { shopId },
    include: { subCategory: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

// POST /api/vendor/products
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ error: "No shop found for this vendor" }, { status: 404 });

  const body = await req.json();
  const { name, description, price, discount = 0, imageUrl, subCategoryId, isActive } = body;

  if (!name || !description || price == null || !subCategoryId) {
    return NextResponse.json({ error: "Missing required fields: name, description, price, subCategoryId" }, { status: 400 });
  }

  // Verify the subcategory belongs to this shop
  const subCategory = await prisma.subCategory.findFirst({ where: { id: subCategoryId, shopId } });
  if (!subCategory) {
    return NextResponse.json({ error: "SubCategory not found or does not belong to your shop" }, { status: 403 });
  }

  const parsedPrice    = parseFloat(price);
  const parsedDiscount = Math.min(Math.max(parseFloat(discount) || 0, 0), 100);
  const sellingPrice   = parsedPrice - (parsedPrice * parsedDiscount / 100);

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price:        parsedPrice,
      discount:     parsedDiscount,
      sellingPrice: Math.round(sellingPrice * 100) / 100,
      imageUrl:     imageUrl ?? null,
      isActive:     isActive ?? true,
      shopId,
      subCategoryId,
    },
    include: { subCategory: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ product }, { status: 201 });
}
