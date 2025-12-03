import { useApiQuery } from "./useApi";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  orderIndex: number;
  isActive: boolean;
}

// Хук для получения списка категорий
export function useCategories() {
  const queryKey = ["categories"] as const;
  const url = "/api/categories";

  return useApiQuery<Category[]>(queryKey, url);
}

// Хук для получения блюд категории
export function useCategoryDishes(categoryId: number, cityId?: number | null) {
  const queryKey = ["category-dishes", categoryId, cityId] as const;
  const url = cityId 
    ? `/api/categories/${categoryId}/dishes?cityId=${cityId}`
    : `/api/categories/${categoryId}/dishes`;

  return useApiQuery(queryKey, url);
}

