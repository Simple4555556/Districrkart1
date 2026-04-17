import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

/**
 * GET /api/vendor/cart
 *
 * Returns all CartItems for products belonging to this vendor's shop.
 * User phone numbers are HIDDEN here — they are only accessible via the
 * Order.contactNumber field once a real order has been placed.
 */
export async function GET() {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 });

  const cartItems = await prisma.cartItem.findMany({
    where: {
      product: { shopId },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          subCategory: { select: { name: true } },
        },
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
  });

  // Group by product for a summary view
  const summary = cartItems.reduce<Record<string, { product: any; count: number; users: any[] }>>(
    (acc, item) => {
      const pid = item.product.id;
      if (!acc[pid]) {
        acc[pid] = { product: item.product, count: 0, users: [] };
      }
      acc[pid].count += item.quantity;
      acc[pid].users.push({ ...item.user, quantity: item.quantity, addedAt: item.createdAt });
      return acc;
    },
    {}
  );

  return NextResponse.json({
    cartItems,
    summary: Object.values(summary),
    total: cartItems.length,
    note: "User phone numbers are hidden until an order is placed. See Order.contactNumber for confirmed orders.",
  });
}
