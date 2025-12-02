import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrderSchema = z.object({
  addressId: z.number(),
  paymentMethod: z.enum(["CASH", "CARD_ONLINE", "CARD_COURIER"]),
  notes: z.string().optional(),
  promotionCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId: parseInt(session.user.id) },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки заказов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Получаем корзину
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(session.user.id) },
      include: {
        dish: true,
        restaurant: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { message: "Корзина пуста" },
        { status: 400 }
      );
    }

    const restaurantId = cartItems[0].restaurantId;

    // Рассчитываем суммы
    let totalAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.dish.price) * item.quantity,
      0
    );

    const restaurant = cartItems[0].restaurant;
    const deliveryFee = Number(restaurant.deliveryFee) || 0;
    let discountAmount = 0;

    // Применяем промокод если есть
    if (validatedData.promotionCode) {
      const promotionCode = await prisma.promotionCode.findUnique({
        where: { code: validatedData.promotionCode },
        include: { promotion: true },
      });

      if (
        promotionCode &&
        promotionCode.isActive &&
        (!promotionCode.maxUses ||
          promotionCode.usedCount < promotionCode.maxUses)
      ) {
        const promotion = promotionCode.promotion;
        if (
          promotion.isActive &&
          promotion.startDate <= new Date() &&
          promotion.endDate >= new Date()
        ) {
          if (promotion.discountType === "PERCENT") {
            discountAmount = (totalAmount * Number(promotion.discountValue)) / 100;
          } else if (promotion.discountType === "FIXED") {
            discountAmount = Number(promotion.discountValue);
          } else if (promotion.discountType === "DELIVERY_FREE") {
            discountAmount = deliveryFee;
          }
        }
      }
    }

    const finalAmount = totalAmount + deliveryFee - discountAmount;

    // Генерируем номер заказа
    const date = new Date();
    const orderNumber = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: parseInt(session.user.id),
        restaurantId,
        addressId: validatedData.addressId,
        paymentMethod: validatedData.paymentMethod,
        totalAmount,
        deliveryFee,
        discountAmount,
        finalAmount,
        notes: validatedData.notes,
        items: {
          create: cartItems.map((item) => ({
            dishId: item.dishId,
            dishName: item.dish.name,
            dishPrice: item.dish.price,
            quantity: item.quantity,
            notes: item.notes,
            totalPrice: Number(item.dish.price) * item.quantity,
          })),
        },
      },
      include: {
        restaurant: true,
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

    // Очищаем корзину
    await prisma.cartItem.deleteMany({
      where: { userId: parseInt(session.user.id) },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка создания заказа" },
      { status: 500 }
    );
  }
}

