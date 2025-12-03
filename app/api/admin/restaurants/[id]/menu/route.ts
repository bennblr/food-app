import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const dishSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().min(0),
  discountPrice: z.number().nullable().optional(),
  weight: z.string().nullable().optional(),
  calories: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  carbs: z.number().nullable().optional(),
  imageUrl: z.array(z.string()).optional(),
  cookingTime: z.number().nullable().optional(),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  categoryId: z.number().nullable().optional(),
  restaurantCategoryId: z.number().nullable().optional(),
  orderIndex: z.number().default(0),
});

export const dynamic = 'force-dynamic';

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

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user || !["APP_OWNER", "APP_EDITOR"].includes(user.role)) {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    const dishes = await prisma.dish.findMany({
      where: {
        restaurantId: parseInt(params.id),
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки меню";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

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

    if (!user || !["APP_OWNER", "APP_EDITOR"].includes(user.role)) {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = dishSchema.parse(body);

    // Если указана категория ресторана, получаем связанную общую категорию
    let categoryId = validatedData.categoryId;
    if (validatedData.restaurantCategoryId && !categoryId) {
      const restaurantCategory = await prisma.restaurantCategory.findUnique({
        where: { id: validatedData.restaurantCategoryId },
        select: { categoryId: true },
      });
      if (restaurantCategory?.categoryId) {
        categoryId = restaurantCategory.categoryId;
      }
    }

    // Обрабатываем null значения для категорий
    const createData: Prisma.DishCreateInput = {
      name: validatedData.name,
      description: validatedData.description ?? null,
      price: validatedData.price,
      discountPrice: validatedData.discountPrice ?? null,
      weight: validatedData.weight ?? null,
      calories: validatedData.calories ?? null,
      protein: validatedData.protein ?? null,
      fat: validatedData.fat ?? null,
      carbs: validatedData.carbs ?? null,
      imageUrl: validatedData.imageUrl || [],
      cookingTime: validatedData.cookingTime ?? null,
      isAvailable: validatedData.isAvailable ?? true,
      isVegetarian: validatedData.isVegetarian ?? false,
      isSpicy: validatedData.isSpicy ?? false,
      orderIndex: validatedData.orderIndex ?? 0,
      restaurant: {
        connect: { id: parseInt(params.id) },
      },
      ...(validatedData.restaurantCategoryId && {
        restaurantCategory: {
          connect: { id: validatedData.restaurantCategoryId },
        },
      }),
      ...(categoryId && {
        category: {
          connect: { id: categoryId },
        },
      }),
    };

    const dish = await prisma.dish.create({
      data: createData,
      include: {
        restaurantCategory: true,
        category: true,
      },
    });

    return NextResponse.json(dish, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка создания блюда";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

