import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/admin/stats — platform-wide statistics
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const [
    totalUsers,
    totalVendors,
    totalAdmins,
    totalShops,
    pendingShops,
    approvedShops,
    rejectedShops,
    totalProducts,
    totalOrders,
    revenueResult,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "VENDOR" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.shop.count(),
    prisma.shop.count({ where: { status: "PENDING" } }),
    prisma.shop.count({ where: { status: "APPROVED" } }),
    prisma.shop.count({ where: { status: "REJECTED" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        shop: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true },
    }),
  ]);

  // Orders by status breakdown
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  return NextResponse.json({
    users: {
      total: totalUsers + totalVendors + totalAdmins,
      customers: totalUsers,
      vendors: totalVendors,
      admins: totalAdmins,
    },
    shops: {
      total: totalShops,
      pending: pendingShops,
      approved: approvedShops,
      rejected: rejectedShops,
    },
    products: { total: totalProducts },
    orders: {
      total: totalOrders,
      byStatus: Object.fromEntries(
        ordersByStatus.map((s) => [s.status, s._count.status])
      ),
      totalRevenuePaid: revenueResult._sum.totalAmount ?? 0,
    },
    recentOrders,
    recentUsers,
  });
}
