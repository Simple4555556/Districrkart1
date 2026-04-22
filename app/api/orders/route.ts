import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/orders — create a new order and clear those cart items
export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as any;

  try {
    const {
      shopId,
      deliveryAddress,
      contactNumber,
      paymentMethod = "COD",
      items,
      totalAmount,
    } = await req.json();

    if (!shopId || !deliveryAddress || !contactNumber || !items?.length || totalAmount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        userId:          user.id,
        shopId,
        totalAmount,
        paymentMethod,
        paymentStatus:   "PENDING",
        status:          "PLACED",
        deliveryAddress,
        contactNumber,
        orderItems: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity:  item.quantity,
            price:     item.price,
          })),
        },
      },
      include: { orderItems: true },
    });

    // Clear only the ordered products from this user's cart
    const productIds = items.map((i: any) => i.productId as string);
    await prisma.cartItem.deleteMany({
      where: { userId: user.id, productId: { in: productIds } },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[orders POST]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

// GET /api/orders — list current user's orders (convenience alias for /api/user/orders)
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const userId = (session!.user as any).id;

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      shop: { select: { id: true, name: true } },
      orderItems: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}
