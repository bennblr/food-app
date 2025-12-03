import { useApiQuery } from "./useApi";
import { useMemo } from "react";

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  address: string;
  phone?: string;
  rating: number;
  totalReviews: number;
  deliveryTime?: number;
  minOrderAmount?: number;
  deliveryFee: number;
}

// Хук для получения списка ресторанов
export function useRestaurants(
  filters?: {
    cuisineId?: number;
    minRating?: number;
    search?: string;
  },
  cityId?: number | null
) {
  const { queryKey, url } = useMemo(() => {
    const params = new URLSearchParams();
    if (cityId) {
      params.append("cityId", cityId.toString());
    }
    if (filters?.cuisineId) {
      params.append("cuisineId", filters.cuisineId.toString());
    }
    if (filters?.minRating) {
      params.append("minRating", filters.minRating.toString());
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const key = ["restaurants", cityId, filters] as const;
    const queryUrl = `/api/restaurants?${params.toString()}`;
    
    return { queryKey: key, url: queryUrl };
  }, [cityId, filters?.cuisineId, filters?.minRating, filters?.search]);

  return useApiQuery<Restaurant[]>(queryKey, url);
}

// Хук для получения одного ресторана
export function useRestaurant(id: number) {
  const queryKey = ["restaurant", id] as const;
  const url = `/api/restaurants/${id}`;

  return useApiQuery<Restaurant>(queryKey, url);
}

// Хук для получения меню ресторана
export function useRestaurantMenu(restaurantId: number) {
  const queryKey = ["restaurant-menu", restaurantId] as const;
  const url = `/api/restaurants/${restaurantId}/menu`;

  return useApiQuery(queryKey, url);
}

