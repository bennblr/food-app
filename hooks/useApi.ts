import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import axios, { AxiosRequestConfig, AxiosError } from "axios";

// Создаем axios instance для React Query
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// Типы для запросов
type QueryKey = readonly unknown[];

// Хук для GET запросов
export function useApiQuery<TData = unknown, TError = AxiosError>(
  queryKey: QueryKey,
  url: string,
  config?: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<TData>(url, config);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
    gcTime: 5 * 60 * 1000, // 5 минут - время хранения в кэше (в v5 это gcTime, в v3 было cacheTime)
    ...options,
  });
}

// Хук для POST запросов
export function useApiMutation<TData = unknown, TVariables = unknown, TError = AxiosError>(
  url: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await apiClient.post<TData>(url, data);
      return response.data;
    },
    onSuccess: () => {
      // Инвалидируем связанные запросы после успешной мутации
      queryClient.invalidateQueries();
    },
    ...options,
  });
}

// Хук для PUT запросов
export function useApiPut<TData = unknown, TVariables = unknown, TError = AxiosError>(
  url: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response = await apiClient.put<TData>(url, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    ...options,
  });
}

// Хук для DELETE запросов
export function useApiDelete<TData = unknown, TError = AxiosError>(
  url: string,
  options?: Omit<UseMutationOptions<TData, TError, void>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, void>({
    mutationFn: async () => {
      const response = await apiClient.delete<TData>(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    ...options,
  });
}

// Экспортируем apiClient для прямого использования в stores
export { apiClient };

