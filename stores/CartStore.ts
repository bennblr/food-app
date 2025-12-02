import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";

export interface CartItem {
  id: number;
  dishId: number;
  restaurantId: number;
  quantity: number;
  notes?: string;
  dish?: {
    id: number;
    name: string;
    price: number;
    imageUrl: string[];
  };
}

export class CartStore {
  items: CartItem[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice() {
    return this.items.reduce(
      (sum, item) => sum + (item.dish?.price || 0) * item.quantity,
      0
    );
  }

  get restaurantId() {
    if (this.items.length === 0) return null;
    return this.items[0].restaurantId;
  }

  async fetchCart() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await axios.get("/api/cart");
      runInAction(() => {
        this.items = response.data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Ошибка загрузки корзины";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async addItem(dishId: number, restaurantId: number, quantity: number = 1, notes?: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await axios.post("/api/cart", {
        dishId,
        restaurantId,
        quantity,
        notes,
      });
      runInAction(() => {
        this.items = response.data;
      });
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Ошибка добавления в корзину";
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async updateQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    this.isLoading = true;

    try {
      const response = await axios.put(`/api/cart/${itemId}`, { quantity });
      runInAction(() => {
        this.items = response.data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Ошибка обновления корзины";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async removeItem(itemId: number) {
    this.isLoading = true;

    try {
      const response = await axios.delete(`/api/cart/${itemId}`);
      runInAction(() => {
        this.items = response.data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Ошибка удаления из корзины";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async clearCart() {
    this.items = [];
  }
}

export const cartStore = new CartStore();

