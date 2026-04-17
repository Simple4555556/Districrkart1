import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/coupons — admin create coupon
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { code, discount, type, minAmount, maxDiscount, expiresAt, isActive = true } = body;

  if (!code || !discount || !type) {
    return NextResponse.json({ error: "code, discount, and type are required" }, { status: 400 });
  }
  if (!["PERCENTAGE", "FIXED"].includes(type)) {
    return NextResponse.json({ error: "type must be PERCENTAGE or FIXED" }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code:        code.toUpperCase().trim(),
        discount:    parseFloat(discount),
        type,
        minAmount:   minAmount   != null ? parseFloat(minAmount)   : null,
        maxDiscount: maxDiscount != null ? parseFloat(maxDiscount) : null,
        isActive,
        expiresAt:   expiresAt ? new Date(expiresAt) : null,
      },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    throw e;
  }
}

// GET /api/coupons — admin list all coupons
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}
