import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validatePassword, isValidEmail, sanitizeInput } from "@/lib/password";

export const dynamic = "force-dynamic";

// Allow 5 user registrations per IP per 15 minutes
const RATE_LIMIT     = 5;
const RATE_WINDOW_MS = 15 * 60 * 1_000;

export async function POST(req: Request) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────
    const ip = getClientIp(req);
    const rl = rateLimit(`user-register:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
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
    const { name = "", email = "", phone = "", password = "" } = body;

    // ── Sanitize ───────────────────────────────────────────────────
    const safeName  = sanitizeInput(name);
    const safeEmail = email.toLowerCase().trim();
    const safePhone = sanitizeInput(phone);

    // ── Required fields ────────────────────────────────────────────
    if (!safeName || !safeEmail || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(safeEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (safeName.length < 2 || safeName.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters." },
        { status: 400 }
      );
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

    // ── Hash password ──────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Create user ────────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        name:     safeName,
        email:    safeEmail,
        phone:    safePhone || null,
        password: hashedPassword,
        role:     "USER",
        isActive: true,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[user-register]", err);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
