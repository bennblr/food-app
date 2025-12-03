"use client";

// Layout для страниц водителя - только для водителей
// Админы используют страницы в /admin/driver/*
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

