import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/coupons/apply
// Body: { code: string, cartTotal: number }
// Returns: { discount, finalAmount, coupon }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const { code, cartTotal } = body;

  if (!code || cartTotal == null) {
    return NextResponse.json({ error: "code and cartTotal are required" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: String(code).toUpperCase().trim() },
  });

  if (!coupon) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
  }
  if (!coupon.isActive) {
    return NextResponse.json({ error: "This coupon is no longer active" }, { status: 400 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
  }
  if (coupon.minAmount && cartTotal < coupon.minAmount) {
    return NextResponse.json(
      { error: `Minimum order amount of ₹${coupon.minAmount} required for this coupon` },
      { status: 400 }
    );
  }

  let discountAmount = 0;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = cartTotal * (coupon.discount / 100);
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    // FIXED
    discountAmount = Math.min(coupon.discount, cartTotal);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalAmount = Math.round((cartTotal - discountAmount) * 100) / 100;

  return NextResponse.json({
    valid:          true,
    discountAmount,
    finalAmount,
    coupon: {
      code:        coupon.code,
      type:        coupon.type,
      discount:    coupon.discount,
      maxDiscount: coupon.maxDiscount,
    },
  });
}
