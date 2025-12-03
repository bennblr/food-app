import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function NotFound() {
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
      <Link 
        href="/"
        style={{
          display: 'inline-block',
          padding: '8px 24px',
          background: '#1890ff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 500
        }}
      >
        Вернуться на главную
      </Link>
    </div>
  );
}
