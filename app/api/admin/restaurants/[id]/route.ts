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
  deliveryFee: z.number().optional(),
  deliveryTime: z.number().nullable().optional(),
  minOrderAmount: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
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

    // Преобразуем пустые строки в null для URL полей
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.deliveryFee !== undefined) updateData.deliveryFee = validatedData.deliveryFee;
    if (validatedData.deliveryTime !== undefined) updateData.deliveryTime = validatedData.deliveryTime;
    if (validatedData.minOrderAmount !== undefined) updateData.minOrderAmount = validatedData.minOrderAmount;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    
    if ('logoUrl' in validatedData) {
      updateData.logoUrl = validatedData.logoUrl && validatedData.logoUrl.trim() !== '' ? validatedData.logoUrl : null;
    }
    if ('coverUrl' in validatedData) {
      updateData.coverUrl = validatedData.coverUrl && validatedData.coverUrl.trim() !== '' ? validatedData.coverUrl : null;
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    });

    return NextResponse.json(restaurant);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка обновления ресторана" },
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


