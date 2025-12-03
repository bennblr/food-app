import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user || user.role !== "DRIVER") {
      return NextResponse.json(
        { message: "Только для курьеров" },
        { status: 403 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Заказ не найден" },
        { status: 404 }
      );
    }

    if (order.status !== "READY") {
      return NextResponse.json(
        { message: "Заказ еще не готов к доставке" },
        { status: 400 }
      );
    }

    if (order.driverId) {
      return NextResponse.json(
        { message: "Заказ уже назначен другому курьеру" },
        { status: 400 }
      );
    }

    // Назначаем курьера
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: {
        driverId: parseInt(session.user.id),
        status: "ON_THE_WAY",
      },
      include: {
        restaurant: true,
        address: true,
        items: true,
      },
    });

    // Создаем запись в driver_orders
    await prisma.driverOrder.create({
      data: {
        driverId: parseInt(session.user.id),
        orderId: parseInt(params.id),
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка принятия заказа" },
      { status: 500 }
    );
  }
}


