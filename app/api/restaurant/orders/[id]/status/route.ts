import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "ON_THE_WAY",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export async function PUT(
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

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Проверяем права доступа к заказу
    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        restaurant: {
          include: {
            owner: true,
            employees: true,
          },
        },
      },
    });

    if (!order || !order.restaurant) {
      return NextResponse.json(
        { message: "Заказ не найден" },
        { status: 404 }
      );
    }

    const userId = parseInt(session.user.id);
    const isOwner = order.restaurant.ownerId === userId;
    const isEmployee = order.restaurant.employees.some(
      (e) => e.userId === userId && e.isActive
    );

    if (!isOwner && !isEmployee) {
      return NextResponse.json(
        { message: "Нет доступа к этому заказу" },
        { status: 403 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: { status: validatedData.status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка обновления статуса" },
      { status: 500 }
    );
  }
}

