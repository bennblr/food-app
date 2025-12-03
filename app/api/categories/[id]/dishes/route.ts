import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    
    // Ищем блюда, которые связаны с категорией напрямую или через категорию ресторана
    const dishes = await prisma.dish.findMany({
      where: {
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
      },
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

