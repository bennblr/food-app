import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json(cities);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки городов";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

