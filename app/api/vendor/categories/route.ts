import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/vendor/categories
// Returns: vendor's SubCategories + all available MainCategories (for the form dropdown)
export async function GET() {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 });

  const [subCategories, mainCategories] = await Promise.all([
    prisma.subCategory.findMany({
      where: { shopId },
      include: {
        mainCategory: { select: { id: true, name: true, icon: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.mainCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ subCategories, mainCategories });
}

// POST /api/vendor/categories — create a SubCategory
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 });

  const { name, description, mainCategoryId } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  if (!mainCategoryId) return NextResponse.json({ error: "Main category selection is required." }, { status: 400 });

  const mainExists = await prisma.mainCategory.findUnique({ where: { id: mainCategoryId } });
  if (!mainExists) return NextResponse.json({ error: "Invalid main category." }, { status: 400 });

  const existing = await prisma.subCategory.findUnique({
    where: { name_shopId: { name: name.trim(), shopId } },
  });
  if (existing) return NextResponse.json({ error: "You already have a category with this name." }, { status: 409 });

  const subCategory = await prisma.subCategory.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      mainCategoryId,
      shopId,
    },
    include: { mainCategory: { select: { id: true, name: true, icon: true } } },
  });

  return NextResponse.json({ subCategory }, { status: 201 });
}
