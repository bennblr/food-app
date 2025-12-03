import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  orderIndex: z.number().default(0),
  isActive: z.boolean().default(true),
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

    const categories = await prisma.restaurantCategory.findMany({
      where: {
        restaurantId: parseInt(params.id),
      },
      orderBy: { orderIndex: "asc" },
    });

    // Получаем информацию о связанных категориях отдельно
    const categoriesWithDetails = await Promise.all(
      categories.map(async (cat) => {
        let category = null;
        if (cat.categoryId) {
          category = await prisma.category.findUnique({
            where: { id: cat.categoryId },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          });
        }
        return {
          ...cat,
          category,
        };
      })
    );

    return NextResponse.json(categoriesWithDetails);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки категорий";
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
    const validatedData = categorySchema.parse(body);

    const createData: Prisma.RestaurantCategoryCreateInput = {
      name: validatedData.name,
      description: validatedData.description ?? null,
      orderIndex: validatedData.orderIndex ?? 0,
      isActive: validatedData.isActive ?? true,
      restaurant: {
        connect: { id: parseInt(params.id) },
      },
      ...(validatedData.categoryId && {
        category: {
          connect: { id: validatedData.categoryId },
        },
      }),
    };

    const category = await prisma.restaurantCategory.create({
      data: createData,
    });

    // Получаем информацию о связанной категории, если есть
    let categoryDetails = null;
    if (category.categoryId) {
      categoryDetails = await prisma.category.findUnique({
        where: { id: category.categoryId },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    }

    return NextResponse.json(
      {
        ...category,
        category: categoryDetails,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { message: "Категория с таким названием уже существует" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка создания категории";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

