# Инструкция по деплою на Render.com

## Настройка переменных окружения

В настройках сервиса на Render.com добавьте следующие переменные:

```
DATABASE_URL=<ваш PostgreSQL connection string>
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=<сгенерируйте случайную строку>
NODE_ENV=production
```

## Важные моменты

1. **База данных**: Убедитесь, что PostgreSQL база данных создана и доступна
2. **NEXTAUTH_SECRET**: Сгенерируйте безопасный секретный ключ (можно использовать `openssl rand -base64 32`)
3. **Build Command**: `npm install && npm run db:generate && npm run build`
4. **Start Command**: `npm start`

## После деплоя

1. Примените миграции базы данных:
   ```bash
   npm run db:push
   ```

2. Заполните тестовыми данными (опционально):
   ```bash
   npm run db:seed
   ```

## Решение проблем

Если билд падает с ошибками:
- Убедитесь, что `DATABASE_URL` правильно настроен
- Проверьте, что база данных доступна с Render.com
- Убедитесь, что все зависимости установлены


