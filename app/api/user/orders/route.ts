import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/user/orders — list the authenticated user's own orders
export async function GET(req: NextRequest) {
  const { session, error } = await requireRole("USER");
  if (error) return error;

  const userId = (session!.user as any).id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const orders = await prisma.order.findMany({
    where: {
      userId,
      ...(status && { status: status as any }),
    },
    include: {
      shop: { select: { id: true, name: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.order.count({
    where: { userId, ...(status && { status: status as any }) },
  });

  return NextResponse.json({ orders, total, page, limit });
}
