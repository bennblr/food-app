/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Отключаем статическую генерацию страниц, которые используют API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Оптимизация импортов для Ant Design и других библиотек
    optimizePackageImports: ['antd', '@ant-design/icons', 'mobx', 'mobx-react-lite'],
    missingSuspenseWithCSRBailout: false,
    disableStaticResults: true,
  },
  // Настройка webpack для создания единого общего бандла (SPA режим)
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Минимизируем code splitting - объединяем все в минимальное количество бандлов
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 2, // Минимум начальных запросов
          maxAsyncRequests: 2, // Минимум асинхронных запросов
          minSize: 0, // Убираем минимальный размер для объединения
          cacheGroups: {
            default: false,
            vendors: false,
            // Объединяем ВСЕ страницы и код приложения в один бандл
            app: {
              name: 'app',
              test: /[\\/](app|components|stores)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
              chunks: 'all',
              enforce: true,
              minChunks: 1,
            },
            // Объединяем все vendor библиотеки в один бандл
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 20,
              reuseExistingChunk: true,
              chunks: 'all',
              enforce: true,
              minChunks: 1,
            },
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig

