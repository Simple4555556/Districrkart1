import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

async function getOwnedProduct(productId: string, shopId: string) {
  return prisma.product.findFirst({ where: { id: productId, shopId } });
}

// GET /api/vendor/products/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  const product = await getOwnedProduct(params.id, shopId);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ product });
}

// PUT /api/vendor/products/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  const existing = await getOwnedProduct(params.id, shopId);
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, price, discount, imageUrl, subCategoryId, isActive } = body;

  if (subCategoryId && subCategoryId !== existing.subCategoryId) {
    const sub = await prisma.subCategory.findFirst({ where: { id: subCategoryId, shopId } });
    if (!sub) return NextResponse.json({ error: "SubCategory not found or does not belong to your shop" }, { status: 403 });
  }

  // Recalculate sellingPrice whenever price or discount changes
  const newPrice    = price    !== undefined ? parseFloat(price)    : existing.price;
  const newDiscount = discount !== undefined ? Math.min(Math.max(parseFloat(discount) || 0, 0), 100) : existing.discount;
  const newSelling  = Math.round((newPrice - (newPrice * newDiscount / 100)) * 100) / 100;

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price       !== undefined && { price: newPrice }),
      ...(discount    !== undefined && { discount: newDiscount }),
      sellingPrice: newSelling,
      ...(imageUrl    !== undefined && { imageUrl }),
      ...(subCategoryId !== undefined && { subCategoryId }),
      ...(isActive    !== undefined && { isActive }),
    },
    include: { subCategory: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ product });
}

// DELETE /api/vendor/products/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  const existing = await getOwnedProduct(params.id, shopId);
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
