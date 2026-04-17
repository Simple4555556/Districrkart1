import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

/* GET /api/admin/shops — list all shops with vendor info */
export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const shops = await prisma.shop.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: {
      vendor: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { products: true, orders: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ shops });
}

/* PATCH /api/admin/shops — approve/reject/hide/show shop */
export async function PATCH(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { shopId, action, rejectionReason } = await req.json();
  if (!shopId || !action)
    return NextResponse.json({ error: "shopId and action required" }, { status: 400 });

  let data: Record<string, any> = {};

  switch (action) {
    case "approve":
      data = { status: "APPROVED", isActive: true, rejectionReason: null };
      break;
    case "reject":
      data = { status: "REJECTED", isActive: false, rejectionReason: rejectionReason ?? "Rejected by admin" };
      break;
    case "hide":
      data = { isActive: false };
      break;
    case "show":
      data = { isActive: true };
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const shop = await prisma.shop.update({ where: { id: shopId }, data });
  return NextResponse.json({ shop });
}

/* DELETE /api/admin/shops?id=xxx — permanently delete shop */
export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Cascade: orders, products, subcategories, reviews must be deleted first
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { shopId: id } }),
    prisma.cartItem.deleteMany({ where: { product: { shopId: id } } }),
    prisma.orderItem.deleteMany({ where: { product: { shopId: id } } }),
    prisma.order.deleteMany({ where: { shopId: id } }),
    prisma.product.deleteMany({ where: { shopId: id } }),
    prisma.subCategory.deleteMany({ where: { shopId: id } }),
    prisma.shop.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
