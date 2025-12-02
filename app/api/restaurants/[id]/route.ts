import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        cuisines: {
          include: {
            cuisine: true,
          },
        },
        categories: {
          where: { isActive: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { message: "Ресторан не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки ресторана" },
      { status: 500 }
    );
  }
}

