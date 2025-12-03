import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const updateDishSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().nullable().optional(),
  weight: z.string().nullable().optional(),
  calories: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  carbs: z.number().nullable().optional(),
  imageUrl: z.array(z.string()).optional(),
  cookingTime: z.number().nullable().optional(),
  isAvailable: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  categoryId: z.number().nullable().optional(),
  restaurantCategoryId: z.number().nullable().optional(),
  orderIndex: z.number().optional(),
});

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; dishId: string } }
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
    const validatedData = updateDishSchema.parse(body);

    // Если указана категория ресторана, получаем связанную общую категорию
    let categoryId = validatedData.categoryId;
    
    // Если изменяется restaurantCategoryId, всегда обновляем categoryId
    if ('restaurantCategoryId' in validatedData && validatedData.restaurantCategoryId) {
      const restaurantCategory = await prisma.restaurantCategory.findUnique({
        where: { id: validatedData.restaurantCategoryId },
        select: { categoryId: true },
      });
      if (restaurantCategory?.categoryId) {
        categoryId = restaurantCategory.categoryId;
      } else {
        // Если категория ресторана не связана с общей категорией, устанавливаем null
        categoryId = null;
      }
    } else if (!('categoryId' in validatedData) && validatedData.restaurantCategoryId) {
      // Если restaurantCategoryId не изменяется, но есть, проверяем связь
      const restaurantCategory = await prisma.restaurantCategory.findUnique({
        where: { id: validatedData.restaurantCategoryId },
        select: { categoryId: true },
      });
      if (restaurantCategory?.categoryId) {
        categoryId = restaurantCategory.categoryId;
      }
    }

    // Обрабатываем null значения для категорий
    const updateData: Prisma.DishUpdateInput = {};
    
    // Копируем только определенные поля
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.discountPrice !== undefined) updateData.discountPrice = validatedData.discountPrice;
    if (validatedData.weight !== undefined) updateData.weight = validatedData.weight;
    if (validatedData.calories !== undefined) updateData.calories = validatedData.calories;
    if (validatedData.protein !== undefined) updateData.protein = validatedData.protein;
    if (validatedData.fat !== undefined) updateData.fat = validatedData.fat;
    if (validatedData.carbs !== undefined) updateData.carbs = validatedData.carbs;
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl;
    if (validatedData.cookingTime !== undefined) updateData.cookingTime = validatedData.cookingTime;
    if (validatedData.isAvailable !== undefined) updateData.isAvailable = validatedData.isAvailable;
    if (validatedData.isVegetarian !== undefined) updateData.isVegetarian = validatedData.isVegetarian;
    if (validatedData.isSpicy !== undefined) updateData.isSpicy = validatedData.isSpicy;
    if (validatedData.orderIndex !== undefined) updateData.orderIndex = validatedData.orderIndex;
    
    // Обрабатываем категории - если передано null или undefined, устанавливаем null
    if ('restaurantCategoryId' in validatedData) {
      if (validatedData.restaurantCategoryId === null) {
        updateData.restaurantCategory = { disconnect: true };
      } else {
        updateData.restaurantCategory = { connect: { id: validatedData.restaurantCategoryId } };
      }
      // При изменении restaurantCategoryId всегда обновляем categoryId
      if (categoryId !== undefined) {
        if (categoryId === null) {
          updateData.category = { disconnect: true };
        } else {
          updateData.category = { connect: { id: categoryId } };
        }
      }
    }
    if ('categoryId' in validatedData) {
      if (validatedData.categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: validatedData.categoryId } };
      }
    } else if (categoryId !== undefined && !('restaurantCategoryId' in validatedData)) {
      // Обновляем categoryId только если restaurantCategoryId не изменяется
      if (categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: categoryId } };
      }
    }

    const updatedDish = await prisma.dish.update({
      where: { id: parseInt(params.dishId) },
      data: updateData,
      include: {
        restaurantCategory: true,
        category: true,
      },
    });

    return NextResponse.json(updatedDish);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { message: "Блюдо не найдено" },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка обновления блюда";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; dishId: string } }
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

    await prisma.dish.delete({
      where: { id: parseInt(params.dishId) },
    });

    return NextResponse.json({ message: "Блюдо удалено" });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { message: "Блюдо не найдено" },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка удаления блюда";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

