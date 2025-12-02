import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addToCartSchema = z.object({
  dishId: z.number(),
  restaurantId: z.number(),
  quantity: z.number().min(1).default(1),
  notes: z.string().optional(),
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

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(session.user.id) },
      include: {
        dish: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cartItems);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки корзины" },
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
    const validatedData = addToCartSchema.parse(body);

    // Проверка, что корзина не содержит блюд из другого ресторана
    const existingCart = await prisma.cartItem.findFirst({
      where: {
        userId: parseInt(session.user.id),
        restaurantId: { not: validatedData.restaurantId },
      },
    });

    if (existingCart) {
      // Очищаем корзину от других ресторанов
      await prisma.cartItem.deleteMany({
        where: { userId: parseInt(session.user.id) },
      });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_dishId: {
          userId: parseInt(session.user.id),
          dishId: validatedData.dishId,
        },
      },
      update: {
        quantity: { increment: validatedData.quantity },
        notes: validatedData.notes,
      },
      create: {
        userId: parseInt(session.user.id),
        dishId: validatedData.dishId,
        restaurantId: validatedData.restaurantId,
        quantity: validatedData.quantity,
        notes: validatedData.notes,
      },
      include: {
        dish: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(session.user.id) },
      include: {
        dish: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json(cartItems);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка добавления в корзину" },
      { status: 500 }
    );
  }
}

