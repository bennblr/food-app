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
      include: {
        ownedRestaurants: true,
        restaurantEmployees: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const restaurantId = searchParams.get("restaurantId");

    // Админы приложения видят все заказы всех ресторанов
    const isAppAdmin = ["APP_OWNER", "APP_EDITOR"].includes(user.role);
    
    const where: any = {};
    
    if (!isAppAdmin) {
      // Получаем ID ресторанов, которыми управляет пользователь
      const restaurantIds = [
        ...user.ownedRestaurants.map((r) => r.id),
        ...user.restaurantEmployees.map((e) => e.restaurantId),
      ];

      if (restaurantIds.length === 0) {
        return NextResponse.json([]);
      }

      where.restaurantId = { in: restaurantIds };
    } else if (restaurantId) {
      // Для админов: фильтр по конкретному ресторану
      where.restaurantId = parseInt(restaurantId);
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        address: true,
        items: {
          include: {
            dish: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки заказов" },
      { status: 500 }
    );
  }
}


