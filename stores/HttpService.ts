import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

class HttpService {
  private client: AxiosInstance;
  private queryClient: any = null;

  constructor() {
    this.client = axios.create({
      // Для Next.js API routes baseURL не нужен, используем относительные пути
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Добавляем interceptor для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Можно добавить редирект на страницу входа
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Инициализация queryClient (вызывается из компонента)
  setQueryClient(queryClient: any) {
    this.queryClient = queryClient;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Если queryClient доступен, используем React Query для кэширования GET запросов
    if (this.queryClient && typeof window !== "undefined") {
      const queryKey = [url, config] as const;
      return this.queryClient.fetchQuery({
        queryKey,
        queryFn: async () => {
          const response: AxiosResponse<T> = await this.client.get(url, config);
          return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 минут
        gcTime: 5 * 60 * 1000, // 5 минут
      });
    }
    
    // Иначе используем обычный запрос
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    // Инвалидируем связанные запросы после мутации
    if (this.queryClient && typeof window !== "undefined") {
      this.queryClient.invalidateQueries();
    }
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    // Инвалидируем связанные запросы после мутации
    if (this.queryClient && typeof window !== "undefined") {
      this.queryClient.invalidateQueries();
    }
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    // Инвалидируем связанные запросы после мутации
    if (this.queryClient && typeof window !== "undefined") {
      this.queryClient.invalidateQueries();
    }
    return response.data;
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    // Инвалидируем связанные запросы после мутации
    if (this.queryClient && typeof window !== "undefined") {
      this.queryClient.invalidateQueries();
    }
    return response.data;
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.client.defaults.headers.common["Authorization"];
  }
}

export const httpService = new HttpService();

