import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get("restaurantId");

    const where: any = {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    if (restaurantId) {
      where.restaurantId = parseInt(restaurantId);
    } else {
      where.restaurantId = null; // Глобальные акции
    }

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(promotions);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки акций" },
      { status: 500 }
    );
  }
}


