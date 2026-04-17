import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED:           ["PROCESSING", "CANCELLED"],
  PROCESSING:       ["SHIPPED", "CANCELLED"],
  SHIPPED:          ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED:        [],
  CANCELLED:        [],
};

// GET /api/vendor/orders — list all orders for vendor's shop
export async function GET(req: NextRequest) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const orders = await prisma.order.findMany({
    where: {
      shopId,
      ...(status && { status: status as any }),
    },
    include: {
      orderItems: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.order.count({ where: { shopId, ...(status && { status: status as any }) } });

  return NextResponse.json({ orders, total, page, limit });
}

// PATCH /api/vendor/orders — update a single order's status
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  const { orderId, status } = await req.json();

  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
  }

  // Verify order belongs to this vendor's shop (RBAC guard)
  const order = await prisma.order.findFirst({ where: { id: orderId, shopId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Validate the status transition
  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${status}. Allowed: [${allowed.join(", ")}]` },
      { status: 422 }
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  return NextResponse.json({ order: updated });
}
