import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔗 Начинаем связывание категорий ресторана с общими категориями...");

  // Маппинг названий категорий ресторана к slug общих категорий
  const categoryMapping: Record<string, string> = {
    "Пицца": "pizza",
    "Суши и роллы": "sushi",
    "Суши": "sushi",
    "Напитки": "drinks",
    "Бургеры": "burgers",
    "Салаты": "salads",
  };

  // Получаем все категории ресторана
  const restaurantCategories = await prisma.restaurantCategory.findMany({
    where: {
      categoryId: null, // Только те, которые еще не связаны
    },
  });

  console.log(`Найдено категорий ресторана без связи: ${restaurantCategories.length}`);

  let updated = 0;
  for (const restaurantCategory of restaurantCategories) {
    const globalCategorySlug = categoryMapping[restaurantCategory.name];
    
    if (globalCategorySlug) {
      const globalCategory = await prisma.category.findUnique({
        where: { slug: globalCategorySlug },
      });

      if (globalCategory) {
        await prisma.restaurantCategory.update({
          where: { id: restaurantCategory.id },
          data: { categoryId: globalCategory.id },
        });
        console.log(`✅ Связана "${restaurantCategory.name}" с "${globalCategory.name}"`);
        updated++;
      }
    }
  }

  console.log(`\n🎉 Обновлено категорий: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

