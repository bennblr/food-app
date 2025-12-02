import { makeAutoObservable, runInAction } from "mobx";
import { httpService } from "./HttpService";

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

export class RestaurantStore {
  restaurants: Restaurant[] = [];
  currentRestaurant: Restaurant | null = null;
  isLoading = false;
  error: string | null = null;
  filters: {
    cuisineId?: number;
    minRating?: number;
    search?: string;
  } = {};
  private fetchPromise: Promise<void> | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 30000; // 30 секунд кэш

  constructor() {
    makeAutoObservable(this);
  }

  async fetchRestaurants(force = false) {
    // Если уже загружается, возвращаем существующий промис
    if (this.fetchPromise && !force) {
      return this.fetchPromise;
    }

    // Проверяем кэш
    const now = Date.now();
    if (!force && this.restaurants.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      // Если данные в кэше, не устанавливаем isLoading
      return Promise.resolve();
    }

    this.isLoading = true;
    this.error = null;

    this.fetchPromise = (async () => {
      try {
        const params = new URLSearchParams();
        if (this.filters.cuisineId) {
          params.append("cuisineId", this.filters.cuisineId.toString());
        }
        if (this.filters.minRating) {
          params.append("minRating", this.filters.minRating.toString());
        }
        if (this.filters.search) {
          params.append("search", this.filters.search);
        }

        const data = await httpService.get<any[]>(`/api/restaurants?${params.toString()}`);
        // Нормализуем данные - преобразуем rating в число
        const normalizedData = data.map((r: any) => ({
          ...r,
          rating: typeof r.rating === 'number' ? r.rating : parseFloat(r.rating) || 0,
          deliveryFee: typeof r.deliveryFee === 'number' ? r.deliveryFee : parseFloat(r.deliveryFee) || 0,
        }));
        runInAction(() => {
          this.restaurants = normalizedData as Restaurant[];
          this.lastFetchTime = now;
        });
      } catch (error: any) {
        runInAction(() => {
          this.error = error.response?.data?.message || "Ошибка загрузки ресторанов";
        });
      } finally {
        runInAction(() => {
          this.isLoading = false;
          this.fetchPromise = null;
        });
      }
    })();

    return this.fetchPromise;
  }

  async fetchRestaurant(id: number) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await httpService.get<any>(`/api/restaurants/${id}`);
      // Нормализуем данные - преобразуем rating в число
      const normalizedData = {
        ...data,
        rating: typeof data.rating === 'number' ? data.rating : parseFloat(data.rating) || 0,
        deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : parseFloat(data.deliveryFee) || 0,
      };
      runInAction(() => {
        this.currentRestaurant = normalizedData as Restaurant;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Ошибка загрузки ресторана";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  setFilters(filters: Partial<typeof this.filters>) {
    this.filters = { ...this.filters, ...filters };
  }

  clearFilters() {
    this.filters = {};
  }
}

export const restaurantStore = new RestaurantStore();

