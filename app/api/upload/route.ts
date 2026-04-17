import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const CLOUD_NAME     = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET  = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

/* ── POST /api/upload ─────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  // Only authenticated users can upload
  const session = await getServerSession(authOptions as any);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPEG, PNG, WebP and GIF are allowed." },
      { status: 400 }
    );
  }

  // Validate file size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 400 });
  }

  // Use unsigned upload preset — no signature required
  const cloudFormData = new FormData();
  cloudFormData.append("file", file);
  cloudFormData.append("upload_preset", UPLOAD_PRESET);
  cloudFormData.append("folder", "district-kart/products");

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: cloudFormData }
  );

  const cloudData = await cloudRes.json();

  if (!cloudRes.ok || cloudData.error) {
    console.error("Cloudinary error:", cloudData);
    return NextResponse.json(
      { error: cloudData.error?.message ?? "Upload failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: cloudData.secure_url,
    publicId: cloudData.public_id,
  });
}
