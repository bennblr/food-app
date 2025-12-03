import { makeAutoObservable } from "mobx";
import { signIn, signOut, useSession } from "next-auth/react";

export class AuthStore {
  user: any = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async login(email: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        this.error = "Неверный email или пароль";
        return false;
      }

      return true;
    } catch (error: any) {
      this.error = error.message || "Ошибка входа";
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    await signOut({ redirect: true, callbackUrl: "/" });
  }

  setUser(user: any) {
    this.user = user;
  }

  clearError() {
    this.error = null;
  }
}

export const authStore = new AuthStore();


