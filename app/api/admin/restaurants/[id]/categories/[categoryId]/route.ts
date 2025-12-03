import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  orderIndex: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
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
    const validatedData = updateCategorySchema.parse(body);

    const updateData: Prisma.RestaurantCategoryUpdateInput = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.orderIndex !== undefined) updateData.orderIndex = validatedData.orderIndex;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    
    // Обновляем связь с категорией через relation
    if ('categoryId' in validatedData) {
      if (validatedData.categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: validatedData.categoryId } };
      }
    }

    const updatedCategory = await prisma.restaurantCategory.update({
      where: { id: parseInt(params.categoryId) },
      data: updateData,
    });

    // Получаем информацию о связанной категории, если есть
    let categoryDetails = null;
    if (updatedCategory.categoryId) {
      categoryDetails = await prisma.category.findUnique({
        where: { id: updatedCategory.categoryId },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    }

    return NextResponse.json({
      ...updatedCategory,
      category: categoryDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { message: "Категория не найдена" },
          { status: 404 }
        );
      }

      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: "Категория с таким названием уже существует" },
          { status: 400 }
        );
      }
    }

    const message = error instanceof Error ? error.message : "Ошибка обновления категории";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
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

    await prisma.restaurantCategory.delete({
      where: { id: parseInt(params.categoryId) },
    });

    return NextResponse.json({ message: "Категория удалена" });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { message: "Категория не найдена" },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка удаления категории";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

