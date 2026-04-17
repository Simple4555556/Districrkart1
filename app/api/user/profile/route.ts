import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// GET /api/user/profile — get own profile (any authenticated role)
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const userId = (session!.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      shop: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

// PATCH /api/user/profile — update own name, phone (any authenticated role)
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const userId = (session!.user as any).id;
  const body = await req.json();
  const { name, phone } = body;

  // Sanitise: only allow name and phone to be changed here
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(phone !== undefined && { phone: String(phone).trim() }),
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return NextResponse.json({ user });
}
