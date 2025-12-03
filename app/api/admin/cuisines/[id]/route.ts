import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCuisineSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  iconUrl: z.string().optional(),
  orderIndex: z.number().optional(),
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
    const validatedData = updateCuisineSchema.parse(body);

    const updatedCuisine = await prisma.cuisine.update({
      where: { id: parseInt(params.id) },
      data: validatedData,
    });

    return NextResponse.json(updatedCuisine);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: "Кухня не найдена" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Кухня с таким slug уже существует" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка обновления кухни" },
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

    await prisma.cuisine.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Кухня удалена" });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: "Кухня не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка удаления кухни" },
      { status: 500 }
    );
  }
}

