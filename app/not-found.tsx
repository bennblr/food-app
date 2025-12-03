"use client";

import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

// Предотвращаем статическую генерацию
export function generateStaticParams() {
  return [];
}

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '72px', margin: 0, color: '#1890ff' }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '16px 0' }}>Страница не найдена</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Запрашиваемая страница не существует
      </p>
      <button
        onClick={() => router.push("/")}
        style={{
          display: 'inline-block',
          padding: '8px 24px',
          background: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Вернуться на главную
      </button>
    </div>
  );
}
