import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

/** POST /api/cart — add or increment a product */
export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as any;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { productId, quantity = 1 } = await req.json();
    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      return NextResponse.json(updated);
    }

    const newItem = await prisma.cartItem.create({
      data: { userId: user.id, productId, quantity },
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch (err) {
    console.error("[cart POST]", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

/** GET /api/cart — return current user's cart */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as any;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          shop: { select: { id: true, name: true, logoUrl: true } },
          subCategory: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cartItems);
}

/** PATCH /api/cart — update quantity of a cart item */
export async function PATCH(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as any;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { productId, quantity } = await req.json();
    if (!productId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Valid productId and quantity (≥1) required" }, { status: 400 });
    }

    const item = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (!item) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[cart PATCH]", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

/** DELETE /api/cart?productId=xxx — remove a specific item */
export async function DELETE(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as any;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId query param required" }, { status: 400 });

  try {
    await prisma.cartItem.deleteMany({
      where: { userId: user.id, productId },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[cart DELETE]", err);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
