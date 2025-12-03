import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get("cityId");
    
    // Базовое условие для блюд
    const dishWhere: Record<string, unknown> = {
      isAvailable: true,
      OR: [
        // Напрямую через categoryId
        { categoryId: categoryId },
        // Через restaurantCategory, которая связана с общей категорией
        {
          restaurantCategory: {
            categoryId: categoryId,
          },
        },
      ],
    };

    // Если указан город, фильтруем рестораны по городу
    if (cityId) {
      dishWhere.restaurant = {
        isActive: true,
        cities: {
          some: {
            cityId: parseInt(cityId),
          },
        },
      };
    } else {
      dishWhere.restaurant = {
        isActive: true,
      };
    }
    
    // Ищем блюда, которые связаны с категорией напрямую или через категорию ресторана
    const dishes = await prisma.dish.findMany({
      where: dishWhere,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            coverUrl: true,
            address: true,
            rating: true,
            deliveryTime: true,
            deliveryFee: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        restaurantCategory: {
          select: {
            id: true,
            name: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [
        { restaurant: { rating: "desc" } },
        { orderIndex: "asc" },
      ],
    });

    return NextResponse.json(dishes);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки блюд" },
      { status: 500 }
    );
  }
}

