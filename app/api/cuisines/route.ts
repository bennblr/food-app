import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cuisines = await prisma.cuisine.findMany({
      where: { isActive: true },
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

