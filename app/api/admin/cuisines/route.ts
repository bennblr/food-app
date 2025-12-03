import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cuisineSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  iconUrl: z.string().optional(),
  orderIndex: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const cuisines = await prisma.cuisine.findMany({
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(cuisines);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки кухонь" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = cuisineSchema.parse(body);

    const cuisine = await prisma.cuisine.create({
      data: validatedData,
    });

    return NextResponse.json(cuisine, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Кухня с таким slug уже существует" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка создания кухни" },
      { status: 500 }
    );
  }
}

