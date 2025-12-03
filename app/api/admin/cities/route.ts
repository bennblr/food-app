import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const citySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  isActive: z.boolean().default(true),
  orderIndex: z.number().default(0),
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

    if (!user) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Только админы могут управлять городами
    if (user.role !== "APP_OWNER" && user.role !== "APP_EDITOR") {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    // Проверяем, доступна ли модель City в Prisma Client
    if (!prisma.city) {
      console.error("Prisma City model is not available. Please run: npx prisma generate");
      return NextResponse.json(
        { message: "Модель City недоступна. Необходимо перегенерировать Prisma Client." },
        { status: 500 }
      );
    }

    const cities = await prisma.city.findMany({
      orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(cities);
  } catch (error: unknown) {
    console.error("Error fetching cities:", error);
    const message = error instanceof Error ? error.message : "Ошибка загрузки городов";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    return NextResponse.json(
      { 
        message, 
        error: process.env.NODE_ENV === "development" ? errorDetails : undefined,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error)
      },
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

    if (!user) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    if (user.role !== "APP_OWNER" && user.role !== "APP_EDITOR") {
      return NextResponse.json(
        { message: "Нет доступа" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = citySchema.parse(body);

    const city = await prisma.city.create({
      data: validatedData,
    });

    return NextResponse.json(city, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Ошибка создания города";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

