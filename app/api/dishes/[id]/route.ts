import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            rating: true,
          },
        },
        category: true,
        restaurantCategory: true,
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!dish) {
      return NextResponse.json(
        { message: "Блюдо не найдено" },
        { status: 404 }
      );
    }

    return NextResponse.json(dish);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки блюда" },
      { status: 500 }
    );
  }
}


