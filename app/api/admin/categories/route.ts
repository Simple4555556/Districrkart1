import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/admin/categories
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const categories = await prisma.mainCategory.findMany({
    include: { _count: { select: { subCategories: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { name, icon, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }

  const existing = await prisma.mainCategory.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
  }

  const category = await prisma.mainCategory.create({
    data: {
      name: name.trim(),
      icon: icon?.trim() || "🛒",
      description: description?.trim() || null,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}

// PATCH /api/admin/categories  — body: { id, name?, icon?, description? }
export async function PATCH(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id, name, icon, description } = await req.json();
  if (!id) return NextResponse.json({ error: "Category id is required." }, { status: 400 });

  const category = await prisma.mainCategory.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(icon !== undefined && { icon: icon.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
  });

  return NextResponse.json({ category });
}

// DELETE /api/admin/categories?id=xxx
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required." }, { status: 400 });

  const subCount = await prisma.subCategory.count({ where: { mainCategoryId: id } });
  if (subCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${subCount} vendor subcategory(ies) exist under this category.` },
      { status: 409 }
    );
  }

  await prisma.mainCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
