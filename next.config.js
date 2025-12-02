/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Убираем standalone для избежания проблем с экспортом
  // Для production деплоя можно использовать 'standalone' если нужен Docker
  // output: 'standalone',
}

module.exports = nextConfig

