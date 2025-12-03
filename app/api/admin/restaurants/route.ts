import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const restaurantSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: "Неверный формат URL" }
  ),
  coverUrl: z.string().nullable().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: "Неверный формат URL" }
  ),
  address: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  deliveryFee: z.number().default(0),
  deliveryTime: z.number().nullable().optional(),
  minOrderAmount: z.number().nullable().optional(),
  ownerId: z.number().min(1, { message: "Необходимо выбрать владельца ресторана" }),
});

export async function GET() {
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

    if (!user || !["APP_OWNER", "APP_EDITOR"].includes(user.role)) {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    const restaurants = await prisma.restaurant.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(restaurants);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки ресторанов";
    return NextResponse.json(
      { message },
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

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user || !["APP_OWNER", "APP_EDITOR"].includes(user.role)) {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = restaurantSchema.parse(body);

    // Проверяем, что пользователь с указанным ownerId существует
    const owner = await prisma.user.findUnique({
      where: { id: validatedData.ownerId },
    });

    if (!owner) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Преобразуем пустые строки в null для URL полей
    const createData = {
      ...validatedData,
      logoUrl: validatedData.logoUrl && validatedData.logoUrl.trim() !== '' ? validatedData.logoUrl : null,
      coverUrl: validatedData.coverUrl && validatedData.coverUrl.trim() !== '' ? validatedData.coverUrl : null,
    };

    const restaurant = await prisma.restaurant.create({
      data: createData,
    });

    return NextResponse.json(restaurant, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка создания ресторана";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}


