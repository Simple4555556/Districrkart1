import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ shop: null });

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  return NextResponse.json({ shop });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const vendorId = (session!.user as any).id;
  const existing = await prisma.shop.findUnique({ where: { vendorId } });
  if (existing) return NextResponse.json({ error: "Shop already exists" }, { status: 400 });

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Shop name is required" }, { status: 400 });

  const shop = await prisma.shop.create({
    data: { name, description, vendorId, status: "PENDING", isActive: false },
  });
  return NextResponse.json({ shop }, { status: 201 });
}

/* PUT /api/vendor/shop — update own shop settings */
export async function PUT(req: NextRequest) {
  const { session, error } = await requireRole("VENDOR");
  if (error) return error;

  const shopId = (session!.user as any).shopId;
  if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 });

  const {
    name, description, logoUrl, bannerUrl, location,
    whatsapp, instagram, facebook, youtube,
    gstNumber, businessType, latitude, longitude,
  } = await req.json();

  if (!name?.trim())
    return NextResponse.json({ error: "Shop name is required" }, { status: 400 });

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: {
      name:         name.trim(),
      description:  description?.trim()  ?? null,
      logoUrl:      logoUrl?.trim()      ?? null,
      bannerUrl:    bannerUrl?.trim()    ?? null,
      location:     location             ?? "Samastipur",
      whatsapp:     whatsapp?.trim()     ?? null,
      instagram:    instagram?.trim()    ?? null,
      facebook:     facebook?.trim()     ?? null,
      youtube:      youtube?.trim()      ?? null,
      gstNumber:    gstNumber?.trim()    ?? null,
      businessType: businessType         ?? null,
      latitude:     latitude  != null    ? Number(latitude)  : null,
      longitude:    longitude != null    ? Number(longitude) : null,
    },
  });

  return NextResponse.json({ shop });
}
