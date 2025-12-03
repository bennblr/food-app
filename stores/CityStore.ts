import { makeAutoObservable, reaction } from "mobx";

export interface City {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

class CityStore {
  selectedCityId: number | null = null;
  cities: City[] = [];
  isLoading = false;
  error: string | null = null;
  private onCityChangeCallbacks: Array<() => void> = [];

  constructor() {
    makeAutoObservable(this);
    // Загружаем выбранный город из localStorage при инициализации
    if (typeof window !== "undefined") {
      const savedCityId = localStorage.getItem("selectedCityId");
      if (savedCityId) {
        this.selectedCityId = parseInt(savedCityId, 10);
      }
    }

    // Реакция на изменение города - обновляем данные
    reaction(
      () => this.selectedCityId,
      () => {
        this.notifyCityChange();
      }
    );
  }

  setCity(cityId: number) {
    this.selectedCityId = cityId;
    // Сохраняем в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCityId", cityId.toString());
    }
  }

  // Метод для подписки на изменение города
  onCityChange(callback: () => void) {
    this.onCityChangeCallbacks.push(callback);
    return () => {
      const index = this.onCityChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onCityChangeCallbacks.splice(index, 1);
      }
    };
  }

  // Уведомляем всех подписчиков об изменении города
  private notifyCityChange() {
    this.onCityChangeCallbacks.forEach(callback => callback());
  }

  clearCity() {
    this.selectedCityId = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedCityId");
    }
  }

  get selectedCity(): City | null {
    if (!this.selectedCityId) return null;
    return this.cities.find(c => c.id === this.selectedCityId) || null;
  }

  get hasCity() {
    return this.selectedCityId !== null;
  }

  async fetchCities() {
    this.isLoading = true;
    this.error = null;
    try {
      const { httpService } = await import("./HttpService");
      // HttpService теперь использует React Query для кэширования
      const data = await httpService.get<City[]>("/api/cities");
      this.cities = data;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : "Ошибка загрузки городов";
    } finally {
      this.isLoading = false;
    }
  }
}

export const cityStore = new CityStore();

