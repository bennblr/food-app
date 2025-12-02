import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        restaurant: true,
        address: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
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
    });

    if (!order) {
      return NextResponse.json(
        { message: "Заказ не найден" },
        { status: 404 }
      );
    }

    // Проверка прав доступа
    if (
      order.userId !== parseInt(session.user.id) &&
      !["APP_OWNER", "APP_EDITOR"].includes((session.user as any).role)
    ) {
      return NextResponse.json(
        { message: "Нет доступа к этому заказу" },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки заказа" },
      { status: 500 }
    );
  }
}

