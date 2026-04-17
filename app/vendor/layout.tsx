"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?role=vendor");
    } else if (status === "authenticated") {
      const user = session?.user as any;
      const isPending = user.shopStatus === "PENDING";
      const isPendingPage = pathname === "/vendor/pending";

      if (user.role !== "VENDOR") {
        router.push("/");
      } else if (isPending && !isPendingPage) {
        router.push("/vendor/pending");
      } else if (!isPending && isPendingPage) {
        router.push("/vendor");
      }
    }
  }, [status, session, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-indigo-900 font-sans tracking-tight font-bold text-xl">
        Authenticating Vendor...
      </div>
    );
  }

  const user = session?.user as any;
  const isPending = user?.shopStatus === "PENDING";
  const isPendingPage = pathname === "/vendor/pending";

  // Allow rendering if the status matches the page
  if (status === "authenticated" && user.role === "VENDOR") {
    if (isPending && isPendingPage) return <>{children}</>;
    if (!isPending && !isPendingPage) return <>{children}</>;
  }

  return null;
}
