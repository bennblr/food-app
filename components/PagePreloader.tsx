"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Компонент для предзагрузки всех страниц приложения
 * Это обеспечивает мгновенные переходы без пауз
 */
export function PagePreloader() {
  const router = useRouter();

  useEffect(() => {
    // Предзагружаем все основные страницы приложения
    const pagesToPreload = [
      "/",
      "/cart",
      "/checkout",
      "/favorites",
      "/orders",
      "/auth/login",
      "/auth/register",
      "/admin/restaurants",
      "/admin/users",
      "/admin/cuisines",
      "/admin/categories",
      "/admin/orders",
      "/admin/restaurant/orders",
      "/admin/driver/orders",
    ];

    // Предзагружаем страницы с небольшой задержкой после загрузки основной страницы
    const timer = setTimeout(() => {
      pagesToPreload.forEach((page) => {
        // Используем router.prefetch для предзагрузки страниц
        router.prefetch(page);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return null; // Компонент не рендерит ничего
}

