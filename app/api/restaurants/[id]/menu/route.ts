import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dishes = await prisma.dish.findMany({
      where: {
        restaurantId: parseInt(params.id),
        isAvailable: true,
      },
      include: {
        restaurantCategory: true,
        category: true,
      },
      orderBy: [
        { restaurantCategory: { orderIndex: "asc" } },
        { orderIndex: "asc" },
      ],
    });

    return NextResponse.json(dishes);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки меню" },
      { status: 500 }
    );
  }
}

