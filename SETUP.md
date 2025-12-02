# Инструкция по настройке проекта

## Требования

- Node.js 18+ 
- PostgreSQL 12+
- npm или yarn

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Настройте базу данных PostgreSQL и создайте файл `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/food_app?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NODE_ENV="development"
```

3. Сгенерируйте Prisma клиент:
```bash
npm run db:generate
```

4. Примените схему базы данных:
```bash
npm run db:push
```

Или создайте миграцию:
```bash
npm run db:migrate
```

5. Запустите приложение:
```bash
npm run dev
```

Приложение будет доступно по адресу http://localhost:3000

## Создание первого пользователя

Для создания первого администратора можно использовать Prisma Studio:
```bash
npm run db:studio
```

Или создать через SQL:
```sql
INSERT INTO users (email, password_hash, role, "isActive")
VALUES ('admin@example.com', '$2a$10$...', 'APP_OWNER', true);
```

Пароль должен быть захеширован с помощью bcrypt.

## Структура проекта

- `/app` - Next.js App Router страницы
- `/app/api` - API routes
- `/components` - React компоненты
- `/stores` - MobX stores
- `/lib` - Утилиты и конфигурация
- `/prisma` - Prisma схема
- `/types` - TypeScript типы

## Роли пользователей

- **CLIENT** - Клиент приложения
- **RESTAURANT_OWNER** - Владелец ресторана
- **RESTAURANT_EMPLOYEE** - Сотрудник ресторана
- **DRIVER** - Курьер
- **APP_EDITOR** - Редактор приложения
- **APP_OWNER** - Владелец приложения

## Основные маршруты

### Клиентские
- `/` - Главная страница
- `/restaurants/:id` - Страница ресторана
- `/cart` - Корзина
- `/checkout` - Оформление заказа
- `/orders` - Мои заказы
- `/auth/login` - Вход
- `/auth/register` - Регистрация

### Админ-панель
- `/admin/restaurants` - Управление ресторанами
- `/admin/users` - Управление пользователями
- `/admin/orders` - Все заказы

### Ресторан
- `/restaurant/orders` - Заказы ресторана

### Курьер
- `/driver/orders` - Доступные заказы

