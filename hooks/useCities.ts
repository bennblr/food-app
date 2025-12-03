import { useApiQuery } from "./useApi";

export interface City {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

// Хук для получения списка городов (публичный)
export function useCities() {
  const queryKey = ["cities"] as const;
  const url = "/api/cities";

  return useApiQuery<City[]>(queryKey, url);
}

