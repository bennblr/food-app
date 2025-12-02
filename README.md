# Food App - Приложение доставки еды

Мобильное приложение для заказа еды из ресторанов с доставкой.

## Технологии

- **Frontend**: Next.js 14, React 18
- **State Management**: MobX
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI**: Ant Design
- **Styling**: CSS Modules

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Настройте переменные окружения:
```bash
cp .env.example .env
```

3. Настройте базу данных:
```bash
npm run db:generate
npm run db:push
```

4. Запустите приложение:
```bash
npm run dev
```

## Структура проекта

- `/app` - Next.js App Router страницы
- `/app/api` - API routes
- `/components` - React компоненты
- `/stores` - MobX stores
- `/lib` - Утилиты и конфигурация
- `/prisma` - Prisma схема и миграции
- `/types` - TypeScript типы

## Роли пользователей

- **CLIENT** - Клиент приложения
- **RESTAURANT_OWNER** - Владелец ресторана
- **RESTAURANT_EMPLOYEE** - Сотрудник ресторана
- **DRIVER** - Курьер
- **APP_EDITOR** - Редактор приложения
- **APP_OWNER** - Владелец приложения

