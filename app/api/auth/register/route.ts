import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validatePassword, isValidEmail, sanitizeInput } from "@/lib/password";

export const dynamic = "force-dynamic";

// Allow 5 vendor registrations per IP per 15 minutes
const RATE_LIMIT      = 5;
const RATE_WINDOW_MS  = 15 * 60 * 1_000;

export async function POST(req: Request) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────
    const ip  = getClientIp(req);
    const rl  = rateLimit(`vendor-register:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in 15 minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1_000)) },
        }
      );
    }

    const body = await req.json();
    const {
      name        = "",
      email       = "",
      phone       = "",
      password    = "",
      shopName    = "",
      shopDescription = "",
      location    = "",
      // optional business fields
      gstNumber   = "",
      whatsapp    = "",
      instagram   = "",
      facebook    = "",
      youtube     = "",
      latitude,
      longitude,
    } = body;

    // ── Sanitize inputs ────────────────────────────────────────────
    const safeName     = sanitizeInput(name);
    const safeEmail    = email.toLowerCase().trim();
    const safePhone    = sanitizeInput(phone);
    const safeShopName = sanitizeInput(shopName);
    const safeShopDesc = sanitizeInput(shopDescription);
    const safeLocation = sanitizeInput(location);

    // ── Required field validation ──────────────────────────────────
    if (!safeName || !safeEmail || !password || !safeShopName || !safeLocation) {
      return NextResponse.json(
        { error: "Name, email, password, shop name, and location are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(safeEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // ── Password strength ──────────────────────────────────────────
    const pwdResult = validatePassword(password);
    if (!pwdResult.valid) {
      return NextResponse.json(
        { error: `Weak password: ${pwdResult.errors.join(", ")}.` },
        { status: 400 }
      );
    }

    // ── Duplicate email check ──────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: safeEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── Hash password (bcrypt, cost 10) ────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Atomic create: User + Shop ─────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name:     safeName,
          email:    safeEmail,
          phone:    safePhone || null,
          password: hashedPassword,
          role:     "VENDOR",
          isActive: true,
        },
        select: { id: true, email: true, name: true },
      });

      const shop = await tx.shop.create({
        data: {
          name:        safeShopName,
          description: safeShopDesc || null,
          location:    safeLocation,
          status:      "PENDING",
          isActive:    false,
          vendorId:    user.id,
          gstNumber:   sanitizeInput(gstNumber) || null,
          whatsapp:    sanitizeInput(whatsapp)  || null,
          instagram:   sanitizeInput(instagram) || null,
          facebook:    sanitizeInput(facebook)  || null,
          youtube:     sanitizeInput(youtube)   || null,
          latitude:    latitude  != null ? Number(latitude)  : null,
          longitude:   longitude != null ? Number(longitude) : null,
        },
      });

      return { user, shop };
    });

    return NextResponse.json(
      { message: "Vendor registered successfully.", userId: result.user.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[vendor-register]", err);
    return NextResponse.json(
      { error: "Failed to register. Please try again." },
      { status: 500 }
    );
  }
}
