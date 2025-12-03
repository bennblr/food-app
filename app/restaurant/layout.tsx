"use client";

// Layout для страниц ресторана - только для владельцев ресторанов и сотрудников
// Админы используют страницы в /admin/restaurant/*
export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

