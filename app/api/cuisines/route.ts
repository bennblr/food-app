import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cuisines = await prisma.cuisine.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(cuisines);
  } catch (error: any) {
    // Во время билда БД может быть недоступна
    if (process.env.NODE_ENV === 'production' && error.message?.includes('Can\'t reach database')) {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки кухонь" },
      { status: 500 }
    );
  }
}

