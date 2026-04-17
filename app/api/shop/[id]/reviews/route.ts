import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* GET /api/shop/[id]/reviews — public */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const reviews = await prisma.review.findMany({
    where: { shopId: params.id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return NextResponse.json({ reviews, average: avg, total: reviews.length });
}

/* POST /api/shop/[id]/reviews — USER only, one review per shop */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "USER")
    return NextResponse.json({ error: "Only customers can leave reviews" }, { status: 403 });

  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  if (!comment?.trim())
    return NextResponse.json({ error: "Comment is required" }, { status: 400 });

  // Check shop exists
  const shop = await prisma.shop.findUnique({ where: { id: params.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  try {
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment: comment.trim(),
        userId: user.id,
        shopId: params.id,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002")
      return NextResponse.json({ error: "You have already reviewed this shop" }, { status: 409 });
    throw e;
  }
}

/* DELETE /api/shop/[id]/reviews — user deletes own review */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const deleted = await prisma.review.deleteMany({
    where: { shopId: params.id, userId: user.id },
  });

  if (deleted.count === 0)
    return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
