import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/categories — public, returns all MainCategories with shop counts */
export async function GET() {
  const categories = await prisma.mainCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { subCategories: true } },
    },
  });

  return NextResponse.json({ categories });
}
