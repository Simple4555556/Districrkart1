import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type Params = { params: { id: string } };

// PUT /api/vendor/categories/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  const existing = await prisma.subCategory.findFirst({ where: { id: params.id, shopId } });
  if (!existing) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const { name, description, mainCategoryId } = await req.json();

  const subCategory = await prisma.subCategory.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(mainCategoryId !== undefined && { mainCategoryId }),
    },
    include: { mainCategory: { select: { id: true, name: true, icon: true } } },
  });

  return NextResponse.json({ subCategory });
}

// DELETE /api/vendor/categories/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  const existing = await prisma.subCategory.findFirst({ where: { id: params.id, shopId } });
  if (!existing) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const productCount = await prisma.product.count({ where: { subCategoryId: params.id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} product(s) use this category. Reassign them first.` },
      { status: 409 }
    );
  }

  await prisma.subCategory.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
