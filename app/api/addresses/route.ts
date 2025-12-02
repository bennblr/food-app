import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressSchema = z.object({
  address: z.string().min(1),
  city: z.string().optional(),
  street: z.string().optional(),
  house: z.string().optional(),
  apartment: z.string().optional(),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  comment: z.string().optional(),
  isPrimary: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: parseInt(session.user.id) },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(addresses);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки адресов" },
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

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Если это основной адрес, снимаем флаг с других
    if (validatedData.isPrimary) {
      await prisma.address.updateMany({
        where: {
          userId: parseInt(session.user.id),
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: parseInt(session.user.id),
        ...validatedData,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Ошибка создания адреса" },
      { status: 500 }
    );
  }
}

