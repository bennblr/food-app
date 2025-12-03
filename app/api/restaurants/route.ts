import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cuisineId = searchParams.get("cuisineId");
    const minRating = searchParams.get("minRating");
    const search = searchParams.get("search");
    const cityId = searchParams.get("cityId");

    const where: Record<string, unknown> = {
      isActive: true,
    };

    // Фильтрация по городу
    if (cityId) {
      where.cities = {
        some: {
          cityId: parseInt(cityId),
        },
      };
    }

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
        cities: {
          include: {
            city: true,
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
    });

    return NextResponse.json(restaurants);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки ресторанов";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

