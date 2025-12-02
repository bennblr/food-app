"use client";

export const dynamic = 'force-dynamic';

import { Layout, Menu, Typography, Button } from "antd";
import {
  ShopOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./layout.module.css";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    {
      key: "/admin/restaurants",
      icon: <ShopOutlined />,
      label: <Link href="/admin/restaurants">Рестораны</Link>,
    },
    {
      key: "/admin/users",
      icon: <UserOutlined />,
      label: <Link href="/admin/users">Пользователи</Link>,
    },
    {
      key: "/admin/cuisines",
      icon: <AppstoreOutlined />,
      label: <Link href="/admin/cuisines">Кухни</Link>,
    },
    {
      key: "/admin/categories",
      icon: <AppstoreOutlined />,
      label: <Link href="/admin/categories">Категории</Link>,
    },
    {
      key: "/admin/orders",
      icon: <FileTextOutlined />,
      label: <Link href="/admin/orders">Заказы</Link>,
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Sider width={200} className={styles.sider}>
        <div className={styles.logo}>
          <Title level={4} style={{ color: "white", margin: 0 }}>
            Админ-панель
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          className={styles.menu}
        />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <div style={{ flex: 1 }} />
          <Button
            icon={<LogoutOutlined />}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Выход
          </Button>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}

