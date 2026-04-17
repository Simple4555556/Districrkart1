import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const shops = await prisma.shop.findMany({
      where: { status },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ shops });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  try {
    const { shopId, status, rejectionReason } = await req.json();

    if (!shopId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        isActive: status === "APPROVED",
      },
    });

    return NextResponse.json({ message: `Shop ${status.toLowerCase()} successfully`, shop: updatedShop });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update shop status" }, { status: 500 });
  }
}
