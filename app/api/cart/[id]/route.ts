import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const body = await request.json();
    const { quantity } = body;

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: parseInt(params.id) },
      });
    } else {
      await prisma.cartItem.update({
        where: { id: parseInt(params.id) },
        data: { quantity },
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(session.user.id) },
      include: {
        dish: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            weight: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cartItems);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка обновления корзины";
    return NextResponse.json(
      { message },
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

    await prisma.cartItem.delete({
      where: { id: parseInt(params.id) },
    });

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(session.user.id) },
      include: {
        dish: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            weight: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cartItems);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка удаления из корзины";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

