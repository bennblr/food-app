import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const restaurantSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: "Неверный формат URL" }
  ),
  coverUrl: z.string().nullable().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: "Неверный формат URL" }
  ),
  address: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  cityIds: z.array(z.number()).optional(),
  deliveryFee: z.number().optional(),
  deliveryTime: z.number().nullable().optional(),
  minOrderAmount: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  ownerId: z.number().min(1, { message: "Необходимо выбрать владельца ресторана" }).optional(),
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

    // Если указан ownerId, проверяем, что пользователь существует
    if (validatedData.ownerId !== undefined) {
      const owner = await prisma.user.findUnique({
        where: { id: validatedData.ownerId },
      });

      if (!owner) {
        return NextResponse.json(
          { message: "Пользователь не найден" },
          { status: 404 }
        );
      }
    }

    // Преобразуем пустые строки в null для URL полей
    const { cityIds, ...restaurantData } = validatedData;
    
    const updateData: Record<string, unknown> = {};
    if (restaurantData.name !== undefined) updateData.name = restaurantData.name;
    if (restaurantData.description !== undefined) updateData.description = restaurantData.description;
    if (restaurantData.address !== undefined) updateData.address = restaurantData.address;
    if (restaurantData.phone !== undefined) updateData.phone = restaurantData.phone;
    if (restaurantData.email !== undefined) updateData.email = restaurantData.email;
    if (restaurantData.deliveryFee !== undefined) updateData.deliveryFee = restaurantData.deliveryFee;
    if (restaurantData.deliveryTime !== undefined) updateData.deliveryTime = restaurantData.deliveryTime;
    if (restaurantData.minOrderAmount !== undefined) updateData.minOrderAmount = restaurantData.minOrderAmount;
    if (restaurantData.isActive !== undefined) updateData.isActive = restaurantData.isActive;
    if (restaurantData.ownerId !== undefined) updateData.ownerId = restaurantData.ownerId;
    
    // Обновляем города, если они указаны
    if (cityIds !== undefined) {
      // Проверяем, что все указанные города существуют
      if (cityIds.length > 0) {
        const cities = await prisma.city.findMany({
          where: { id: { in: cityIds } },
        });
        if (cities.length !== cityIds.length) {
          return NextResponse.json(
            { message: "Один или несколько городов не найдены" },
            { status: 400 }
          );
        }
      }
      
      // Удаляем все существующие связи и создаем новые
      await prisma.restaurantCity.deleteMany({
        where: { restaurantId: parseInt(params.id) },
      });
      
      updateData.cities = {
        create: cityIds.map((cityId: number) => ({
          cityId,
        })),
      };
    }
    
    if ('logoUrl' in validatedData) {
      updateData.logoUrl = validatedData.logoUrl && validatedData.logoUrl.trim() !== '' ? validatedData.logoUrl : null;
    }
    if ('coverUrl' in validatedData) {
      updateData.coverUrl = validatedData.coverUrl && validatedData.coverUrl.trim() !== '' ? validatedData.coverUrl : null;
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: {
        cities: {
          include: {
            city: true,
          },
        },
      },
    });

    return NextResponse.json(restaurant);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка обновления ресторана";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (!user || user.role !== "APP_OWNER") {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    await prisma.restaurant.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Ресторан удален" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка удаления ресторана" },
      { status: 500 }
    );
  }
}


