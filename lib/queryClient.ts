import { QueryClient } from "@tanstack/react-query";

// Создаем QueryClient с настройками кэша
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Кэш на 5 минут (300000 мс)
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      gcTime: 5 * 60 * 1000, // 5 минут - время хранения в кэше (в v5 это gcTime, в v3 было cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

