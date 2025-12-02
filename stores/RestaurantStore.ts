import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";

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

  constructor() {
    makeAutoObservable(this);
  }

  async fetchRestaurants() {
    this.isLoading = true;
    this.error = null;

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

      const response = await axios.get(`/api/restaurants?${params.toString()}`);
      runInAction(() => {
        this.restaurants = response.data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Ошибка загрузки ресторанов";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async fetchRestaurant(id: number) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await axios.get(`/api/restaurants/${id}`);
      runInAction(() => {
        this.currentRestaurant = response.data;
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

