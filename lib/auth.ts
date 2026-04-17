import { getServerSession, AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const MAX_ATTEMPTS      = 5;
const LOCKOUT_MS        = 15 * 60 * 1_000; // 15 minutes

export const authOptions: AuthOptions = {
  // PrismaAdapter handles OAuth account linking and user creation.
  // With strategy "jwt" it does NOT store sessions in the DB.
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id:    profile.sub,
          name:  profile.name,
          email: profile.email,
          image: profile.picture,
          // custom fields — default role for new Google users
          role:  "USER",
        };
      },
    }),

    // ── Email / Password ─────────────────────────────────────────────
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
          include: { shop: { select: { id: true, status: true } } },
        });

        // Unknown user or deactivated account
        if (!user || !user.isActive) return null;

        // ── Account lockout check ──────────────────────────────────
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          // Return null — client will show a generic "too many attempts" banner
          return null;
        }

        // OAuth users (no stored password) cannot use credentials
        if (!user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          const newAttempts = (user.loginAttempts ?? 0) + 1;
          const shouldLock  = newAttempts >= MAX_ATTEMPTS;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: shouldLock ? 0 : newAttempts,
              lockedUntil:   shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
            },
          });
          return null;
        }

        // ── Success — clear lockout state ──────────────────────────
        if ((user.loginAttempts ?? 0) > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id:         user.id,
          name:       user.name,
          email:      user.email,
          role:       user.role,
          shopId:     user.shop?.id     ?? null,
          shopStatus: user.shop?.status ?? null,
        } as any;
      },
    }),
  ],

  callbacks: {
    // ── jwt: enrich token on first sign-in ─────────────────────────
    async jwt({ token, user }) {
      if (user) {
        // Fetch full user from DB so we always get custom fields (role, shop)
        // regardless of which provider was used.
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { shop: { select: { id: true, status: true } } },
        });

        token.id         = user.id;
        token.role       = dbUser?.role       ?? "USER";
        token.shopId     = dbUser?.shop?.id   ?? null;
        token.shopStatus = dbUser?.shop?.status ?? null;
      }
      return token;
    },

    // ── session: expose safe subset to client ──────────────────────
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id         = token.id         as string;
        (session.user as any).role       = token.role       as string;
        (session.user as any).shopId     = token.shopId     as string | null;
        (session.user as any).shopStatus = token.shopStatus as string | null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },

  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET,
};

// ── Server-side helpers ────────────────────────────────────────────────

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function requireRole(role: "USER" | "VENDOR" | "ADMIN") {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };

  const user = session!.user as any;

  if (user.role !== role) {
    return {
      session: null,
      error: NextResponse.json(
        { error: `Forbidden: Requires ${role} role` },
        { status: 403 }
      ),
    };
  }

  // Extra guard for vendors: must be APPROVED
  if (role === "VENDOR" && user.shopStatus !== "APPROVED") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Forbidden: Shop access pending approval or rejected", status: user.shopStatus },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
