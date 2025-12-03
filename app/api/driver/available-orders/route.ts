import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    // Доступ разрешен водителям и админам приложения
    const isAppAdmin = user && ["APP_OWNER", "APP_EDITOR"].includes(user.role);
    
    if (!user || (!isAppAdmin && user.role !== "DRIVER")) {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get("driverId");

    const where: any = {};

    // Для админов: фильтр по конкретному водителю (если указан)
    if (isAppAdmin && driverId) {
      // Если указан driverId, показываем заказы этого водителя (все статусы)
      where.driverId = parseInt(driverId);
    } else {
      // Иначе показываем только заказы, готовые к доставке и еще не назначенные
      where.status = "READY";
      where.driverId = null;
    }

    // Получаем заказы, готовые к доставке
    const orders = await prisma.order.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            dish: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки заказов" },
      { status: 500 }
    );
  }
}


