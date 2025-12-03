import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { dishId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const dish = await prisma.dish.findUnique({
      where: { id: parseInt(params.dishId) },
    });

    if (!dish) {
      return NextResponse.json(
        { message: "Блюдо не найдено" },
        { status: 404 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: parseInt(session.user.id),
        dishId: parseInt(params.dishId),
        restaurantId: dish.restaurantId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error: any) {
    // Если уже в избранном, игнорируем ошибку
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Уже в избранном" }, { status: 200 });
    }

    return NextResponse.json(
      { message: error.message || "Ошибка добавления в избранное" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { dishId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: parseInt(session.user.id),
        dishId: parseInt(params.dishId),
      },
    });

    return NextResponse.json({ message: "Удалено из избранного" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка удаления из избранного" },
      { status: 500 }
    );
  }
}


