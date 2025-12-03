import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateEmployeeSchema = z.object({
  role: z.enum(["MANAGER", "CHEF", "WAITER", "COURIER"]).optional(),
  permissions: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
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
      include: {
        ownedRestaurants: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const restaurantId = parseInt(params.id);
    
    // Проверяем, что пользователь является владельцем ресторана или админом приложения
    const isAppAdmin = ["APP_OWNER", "APP_EDITOR"].includes(user.role);
    const isOwner = user.ownedRestaurants.some((r) => r.id === restaurantId);

    if (!isAppAdmin && !isOwner) {
      return NextResponse.json(
        { message: "Нет доступа к этому ресторану" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.permissions !== undefined) updateData.permissions = validatedData.permissions;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const employee = await prisma.restaurantEmployee.update({
      where: { id: parseInt(params.employeeId) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(employee);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { message: "Сотрудник не найден" },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка обновления сотрудника";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
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
      include: {
        ownedRestaurants: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const restaurantId = parseInt(params.id);
    
    // Проверяем, что пользователь является владельцем ресторана или админом приложения
    const isAppAdmin = ["APP_OWNER", "APP_EDITOR"].includes(user.role);
    const isOwner = user.ownedRestaurants.some((r) => r.id === restaurantId);

    if (!isAppAdmin && !isOwner) {
      return NextResponse.json(
        { message: "Нет доступа к этому ресторану" },
        { status: 403 }
      );
    }

    await prisma.restaurantEmployee.delete({
      where: { id: parseInt(params.employeeId) },
    });

    return NextResponse.json({ message: "Сотрудник удален" });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { message: "Сотрудник не найден" },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка удаления сотрудника";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

