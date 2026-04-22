"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/dashboard");
    } else if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "VENDOR") router.replace("/vendor");
      else if (role === "ADMIN") router.replace("/secure-admin-portal-9x7k2");
      else router.replace("/user");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
