import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔗 Начинаем обновление блюд для установки categoryId...");

  // Получаем все блюда, у которых есть restaurantCategoryId, но нет categoryId
  const dishes = await prisma.dish.findMany({
    where: {
      restaurantCategoryId: { not: null },
      OR: [
        { categoryId: null },
        // Также обновим те, у которых categoryId может быть неверным
      ],
    },
    include: {
      restaurantCategory: {
        select: {
          id: true,
          categoryId: true,
        },
      },
    },
  });

  console.log(`Найдено блюд для обновления: ${dishes.length}`);

  let updated = 0;
  for (const dish of dishes) {
    if (dish.restaurantCategory?.categoryId) {
      await prisma.dish.update({
        where: { id: dish.id },
        data: { categoryId: dish.restaurantCategory.categoryId },
      });
      console.log(`✅ Обновлено блюдо #${dish.id}: установлен categoryId = ${dish.restaurantCategory.categoryId}`);
      updated++;
    }
  }

  console.log(`\n🎉 Обновлено блюд: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

