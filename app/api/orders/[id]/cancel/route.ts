import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
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
    const validatedData = cancelOrderSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Заказ не найден" },
        { status: 404 }
      );
    }

    // Проверка прав
    if (order.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { message: "Нет доступа к этому заказу" },
        { status: 403 }
      );
    }

    // Можно отменить только если заказ еще не доставлен
    if (
      ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)
    ) {
      return NextResponse.json(
        { message: "Заказ нельзя отменить" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: {
        status: "CANCELLED",
        cancelReason: validatedData.reason,
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
      { message: error.message || "Ошибка отмены заказа" },
      { status: 500 }
    );
  }
}


