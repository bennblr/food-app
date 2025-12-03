import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const employeeSchema = z.object({
  userId: z.number().min(1, { message: "Необходимо выбрать пользователя" }),
  role: z.enum(["MANAGER", "CHEF", "WAITER", "COURIER"]),
  permissions: z.record(z.any()).optional(),
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

    const employees = await prisma.restaurantEmployee.findMany({
      where: {
        restaurantId: parseInt(params.id),
      },
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
      orderBy: { invitedAt: "desc" },
    });

    return NextResponse.json(employees);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки сотрудников";
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
    const validatedData = employeeSchema.parse(body);

    // Проверяем, что пользователь существует
    const employeeUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!employeeUser) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь еще не является сотрудником этого ресторана
    const existingEmployee = await prisma.restaurantEmployee.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId: validatedData.userId,
        },
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { message: "Пользователь уже является сотрудником этого ресторана" },
        { status: 400 }
      );
    }

    const employee = await prisma.restaurantEmployee.create({
      data: {
        restaurantId,
        userId: validatedData.userId,
        role: validatedData.role,
        permissions: validatedData.permissions || {},
        invitedBy: parseInt(session.user.id),
        acceptedAt: new Date(), // Автоматически принимаем приглашение
        isActive: true,
      },
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

    return NextResponse.json(employee, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { message: "Пользователь уже является сотрудником этого ресторана" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка добавления сотрудника";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

