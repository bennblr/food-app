import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cuisineId = searchParams.get("cuisineId");
    const minRating = searchParams.get("minRating");
    const search = searchParams.get("search");

    const where: any = {
      isActive: true,
    };

    if (cuisineId) {
      where.cuisines = {
        some: {
          cuisineId: parseInt(cuisineId),
        },
      };
    }

    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating),
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        cuisines: {
          include: {
            cuisine: true,
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
    });

    return NextResponse.json(restaurants);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ошибка загрузки ресторанов" },
      { status: 500 }
    );
  }
}

