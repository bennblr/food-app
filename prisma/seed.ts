import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем заполнение базы данных...");

  // Хешируем пароль для всех тестовых пользователей
  const passwordHash = await bcrypt.hash("password123", 10);

  // Создаем администратора
  const admin = await prisma.user.upsert({
    where: { email: "admin@foodapp.com" },
    update: {},
    create: {
      email: "admin@foodapp.com",
      passwordHash,
      name: "Администратор",
      role: "APP_OWNER",
      isActive: true,
    },
  });
  console.log("✅ Создан администратор:", admin.email);

  // Создаем редактора
  const editor = await prisma.user.upsert({
    where: { email: "editor@foodapp.com" },
    update: {},
    create: {
      email: "editor@foodapp.com",
      passwordHash,
      name: "Редактор",
      role: "APP_EDITOR",
      isActive: true,
    },
  });
  console.log("✅ Создан редактор:", editor.email);

  // Создаем владельца ресторана
  const restaurantOwner = await prisma.user.upsert({
    where: { email: "owner@restaurant.com" },
    update: {},
    create: {
      email: "owner@restaurant.com",
      passwordHash,
      name: "Владелец ресторана",
      phone: "+7 (999) 123-45-67",
      role: "RESTAURANT_OWNER",
      isActive: true,
    },
  });
  console.log("✅ Создан владелец ресторана:", restaurantOwner.email);

  // Создаем сотрудника ресторана
  const employee = await prisma.user.upsert({
    where: { email: "employee@restaurant.com" },
    update: {},
    create: {
      email: "employee@restaurant.com",
      passwordHash,
      name: "Сотрудник ресторана",
      role: "RESTAURANT_EMPLOYEE",
      isActive: true,
    },
  });
  console.log("✅ Создан сотрудник ресторана:", employee.email);

  // Создаем курьера
  const driver = await prisma.user.upsert({
    where: { email: "driver@foodapp.com" },
    update: {},
    create: {
      email: "driver@foodapp.com",
      passwordHash,
      name: "Курьер",
      phone: "+7 (999) 765-43-21",
      role: "DRIVER",
      isActive: true,
    },
  });
  console.log("✅ Создан курьер:", driver.email);

  // Создаем профиль курьера
  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      vehicleType: "CAR",
      vehicleNumber: "A123BC",
      licensePlate: "А123БВ777",
      isAvailable: true,
      rating: 4.8,
      totalDeliveries: 150,
    },
  });
  console.log("✅ Создан профиль курьера");

  // Создаем города
  const moscow = await prisma.city.upsert({
    where: { slug: "moscow" },
    update: {},
    create: {
      name: "Москва",
      slug: "moscow",
      isActive: true,
      orderIndex: 1,
    },
  });
  console.log("✅ Создан город:", moscow.name);

  const spb = await prisma.city.upsert({
    where: { slug: "spb" },
    update: {},
    create: {
      name: "Санкт-Петербург",
      slug: "spb",
      isActive: true,
      orderIndex: 2,
    },
  });
  console.log("✅ Создан город:", spb.name);

  const kazan = await prisma.city.upsert({
    where: { slug: "kazan" },
    update: {},
    create: {
      name: "Казань",
      slug: "kazan",
      isActive: true,
      orderIndex: 3,
    },
  });
  console.log("✅ Создан город:", kazan.name);

  // Создаем клиента
  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      passwordHash,
      name: "Тестовый клиент",
      phone: "+7 (999) 111-22-33",
      role: "CLIENT",
      isActive: true,
    },
  });
  console.log("✅ Создан клиент:", client.email);

  // Создаем адрес для клиента
  await prisma.address.create({
    data: {
      userId: client.id,
      address: "г. Москва, ул. Тестовая, д. 1, кв. 10",
      city: "Москва",
      street: "ул. Тестовая",
      house: "1",
      apartment: "10",
      isPrimary: true,
      latitude: 55.7558,
      longitude: 37.6173,
    },
  });
  console.log("✅ Создан адрес для клиента");

  // Создаем кухни
  const cuisines = [
    { name: "Итальянская", slug: "italian", orderIndex: 1 },
    { name: "Японская", slug: "japanese", orderIndex: 2 },
    { name: "Русская", slug: "russian", orderIndex: 3 },
    { name: "Китайская", slug: "chinese", orderIndex: 4 },
    { name: "Мексиканская", slug: "mexican", orderIndex: 5 },
  ];

  for (const cuisine of cuisines) {
    await prisma.cuisine.upsert({
      where: { slug: cuisine.slug },
      update: {},
      create: cuisine,
    });
  }
  console.log("✅ Создано кухонь:", cuisines.length);

  // Создаем категории
  const categories = [
    { name: "Пицца", slug: "pizza", orderIndex: 1 },
    { name: "Суши", slug: "sushi", orderIndex: 2 },
    { name: "Бургеры", slug: "burgers", orderIndex: 3 },
    { name: "Салаты", slug: "salads", orderIndex: 4 },
    { name: "Напитки", slug: "drinks", orderIndex: 5 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("✅ Создано категорий:", categories.length);

  // Создаем ресторан
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      ownerId: restaurantOwner.id,
      name: "Тестовый ресторан",
      description: "Лучший ресторан в городе с вкусной едой и быстрой доставкой",
      address: "г. Москва, ул. Ресторанная, д. 5",
      phone: "+7 (495) 123-45-67",
      email: "info@testrestaurant.com",
      openingHours: {
        monday: { open: "09:00", close: "23:00" },
        tuesday: { open: "09:00", close: "23:00" },
        wednesday: { open: "09:00", close: "23:00" },
        thursday: { open: "09:00", close: "23:00" },
        friday: { open: "09:00", close: "00:00" },
        saturday: { open: "10:00", close: "00:00" },
        sunday: { open: "10:00", close: "22:00" },
      },
      deliveryTime: 30,
      minOrderAmount: 500,
      deliveryFee: 150,
      rating: 4.5,
      totalReviews: 120,
      isActive: true,
    },
  });
  console.log("✅ Создан ресторан:", restaurant.name);

  // Связываем ресторан с городами
  await prisma.restaurantCity.upsert({
    where: {
      restaurantId_cityId: {
        restaurantId: restaurant.id,
        cityId: moscow.id,
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      cityId: moscow.id,
    },
  });
  await prisma.restaurantCity.upsert({
    where: {
      restaurantId_cityId: {
        restaurantId: restaurant.id,
        cityId: spb.id,
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      cityId: spb.id,
    },
  });
  console.log("✅ Ресторан связан с городами");

  // Связываем ресторан с кухнями
  const italianCuisine = await prisma.cuisine.findUnique({ where: { slug: "italian" } });
  const japaneseCuisine = await prisma.cuisine.findUnique({ where: { slug: "japanese" } });

  if (italianCuisine) {
    const existing = await prisma.restaurantCuisine.findUnique({
      where: {
        restaurantId_cuisineId: {
          restaurantId: restaurant.id,
          cuisineId: italianCuisine.id,
        },
      },
    });
    if (!existing) {
      await prisma.restaurantCuisine.create({
        data: {
          restaurantId: restaurant.id,
          cuisineId: italianCuisine.id,
        },
      });
    }
  }

  if (japaneseCuisine) {
    const existing = await prisma.restaurantCuisine.findUnique({
      where: {
        restaurantId_cuisineId: {
          restaurantId: restaurant.id,
          cuisineId: japaneseCuisine.id,
        },
      },
    });
    if (!existing) {
      await prisma.restaurantCuisine.create({
        data: {
          restaurantId: restaurant.id,
          cuisineId: japaneseCuisine.id,
        },
      });
    }
  }
  console.log("✅ Связаны кухни с рестораном");

  // Создаем категории ресторана и связываем их с общими категориями
  const restaurantCategories = [
    { name: "Пицца", orderIndex: 1, globalCategorySlug: "pizza" },
    { name: "Суши и роллы", orderIndex: 2, globalCategorySlug: "sushi" },
    { name: "Напитки", orderIndex: 3, globalCategorySlug: "drinks" },
  ];

  for (const cat of restaurantCategories) {
    // Находим общую категорию
    const globalCategory = await prisma.category.findUnique({
      where: { slug: cat.globalCategorySlug },
    });

    await prisma.restaurantCategory.upsert({
      where: {
        restaurantId_name: {
          restaurantId: restaurant.id,
          name: cat.name,
        },
      },
      update: {
        categoryId: globalCategory?.id || null,
      },
      create: {
        restaurantId: restaurant.id,
        name: cat.name,
        orderIndex: cat.orderIndex,
        categoryId: globalCategory?.id || null,
      },
    });
  }
  console.log("✅ Созданы категории ресторана и связаны с общими категориями");

  // Создаем блюда
  const pizzaCategory = await prisma.restaurantCategory.findFirst({
    where: { restaurantId: restaurant.id, name: "Пицца" },
  });
  const sushiCategory = await prisma.restaurantCategory.findFirst({
    where: { restaurantId: restaurant.id, name: "Суши и роллы" },
  });
  const drinksCategory = await prisma.restaurantCategory.findFirst({
    where: { restaurantId: restaurant.id, name: "Напитки" },
  });

  const dishes = [
    {
      name: "Маргарита",
      description: "Классическая пицца с томатами и моцареллой",
      price: 450,
      weight: "500г",
      calories: 1200,
      restaurantCategoryId: pizzaCategory?.id,
      imageUrl: [],
      isVegetarian: true,
    },
    {
      name: "Пепперони",
      description: "Пицца с острой колбасой пепперони",
      price: 550,
      weight: "550г",
      calories: 1500,
      restaurantCategoryId: pizzaCategory?.id,
      imageUrl: [],
      isSpicy: true,
    },
    {
      name: "Филадельфия",
      description: "Ролл с лососем и сливочным сыром",
      price: 380,
      weight: "250г",
      calories: 600,
      restaurantCategoryId: sushiCategory?.id,
      imageUrl: [],
    },
    {
      name: "Калифорния",
      description: "Ролл с крабом и авокадо",
      price: 320,
      weight: "230г",
      calories: 550,
      restaurantCategoryId: sushiCategory?.id,
      imageUrl: [],
    },
    {
      name: "Кола",
      description: "Газированный напиток",
      price: 120,
      weight: "500мл",
      calories: 200,
      restaurantCategoryId: drinksCategory?.id,
      imageUrl: [],
    },
  ];

  for (const dish of dishes) {
    await prisma.dish.create({
      data: {
        restaurantId: restaurant.id,
        ...dish,
      },
    });
  }
  console.log("✅ Создано блюд:", dishes.length);

  // Создаем сотрудника ресторана
  await prisma.restaurantEmployee.upsert({
    where: {
      restaurantId_userId: {
        restaurantId: restaurant.id,
        userId: employee.id,
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      userId: employee.id,
      role: "CHEF",
      permissions: {
        can_edit_menu: true,
        can_view_orders: true,
      },
      invitedBy: restaurantOwner.id,
      acceptedAt: new Date(),
      isActive: true,
    },
  });
  console.log("✅ Создан сотрудник ресторана");

  console.log("\n🎉 Заполнение базы данных завершено!");
  console.log("\n📋 Тестовые пользователи (пароль для всех: password123):");
  console.log("  👤 Администратор: admin@foodapp.com");
  console.log("  👤 Редактор: editor@foodapp.com");
  console.log("  👤 Владелец ресторана: owner@restaurant.com");
  console.log("  👤 Сотрудник ресторана: employee@restaurant.com");
  console.log("  👤 Курьер: driver@foodapp.com");
  console.log("  👤 Клиент: client@example.com");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при заполнении базы данных:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

