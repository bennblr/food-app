import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["CLIENT", "RESTAURANT_OWNER", "RESTAURANT_EMPLOYEE", "DRIVER", "APP_EDITOR", "APP_OWNER"]).optional(),
  isActive: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';

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
    const validatedData = updateUserSchema.parse(body);

    const updateData: any = {};
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Пользователь с таким email или телефоном уже существует" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка обновления пользователя" },
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

    if (!user || !["APP_OWNER", "APP_EDITOR"].includes(user.role)) {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    
    // Нельзя удалить самого себя
    if (userId === parseInt(session.user.id)) {
      return NextResponse.json(
        { message: "Нельзя удалить самого себя" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "Пользователь удален" });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка удаления пользователя" },
      { status: 500 }
    );
  }
}

