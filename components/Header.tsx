"use client";

import { Layout, Menu, Badge, Avatar, Dropdown, Button, Select, Modal } from "antd";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  HomeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cartStore, cityStore } from "@/stores";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

const { Header: AntHeader } = Layout;

const AppHeader = observer(() => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => {
    if (session) {
      cartStore.fetchCart();
    }
    // Загружаем города при монтировании компонента
    cityStore.fetchCities();
    // Если город не выбран, показываем модальное окно
    if (!cityStore.hasCity && cityStore.cities.length > 0) {
      setCityModalVisible(true);
    }
  }, [session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    cartStore.clearCart();
    router.push("/");
  };

  const isAdmin = session?.user?.role === "APP_OWNER" || session?.user?.role === "APP_EDITOR";

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Профиль",
      onClick: () => router.push("/profile"),
    },
    {
      key: "orders",
      icon: <SettingOutlined />,
      label: "Мои заказы",
      onClick: () => router.push("/orders"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Выйти",
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link href="/" prefetch={true}>Главная</Link>,
    },
    {
      key: "cart",
      icon: (
        <Badge count={cartStore.totalItems} size="small">
          <ShoppingCartOutlined style={{ fontSize: 18 }} />
        </Badge>
      ),
      label: <Link href="/cart" prefetch={true}>Корзина</Link>,
    },
    {
      key: "favorites",
      icon: <HeartOutlined style={{ fontSize: 18 }} />,
      label: <Link href="/favorites" prefetch={true}>Избранное</Link>,
    },
    ...(session
      ? [
          {
            key: "user",
            icon: <Avatar size="small" icon={<UserOutlined />} />,
            label: (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <span style={{ cursor: "pointer" }}>
                  {session.user?.name || session.user?.email}
                </span>
              </Dropdown>
            ),
          },
        ]
      : [
          {
            key: "login",
            icon: <LoginOutlined />,
            label: <Link href="/auth/login" prefetch={true}>Войти</Link>,
          },
        ]),
    ...(isAdmin
      ? [
          {
            key: "admin",
            icon: <SettingOutlined />,
            label: <Link href="/admin/restaurants" prefetch={true}>Админка</Link>,
          },
        ]
      : []),
  ];

  return (
    <>
      <AntHeader
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#001529",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Link href="/" prefetch={true} style={{ color: "white", textDecoration: "none" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
            🍔 Food App
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Select
            value={cityStore.selectedCityId}
            onChange={async (cityId) => {
              // Очищаем корзину при смене города, так как ресторан может не работать в новом городе
              cartStore.clearCart();
              cityStore.setCity(cityId);
              // Обновляем данные на текущей странице
              const { restaurantStore } = await import("@/stores");
              await restaurantStore.fetchRestaurants(true);
              // Если мы на главной странице, обновляем категории тоже
              if (pathname === "/") {
                router.refresh();
              }
            }}
            placeholder="Выберите город"
            style={{ width: 150 }}
            suffixIcon={<EnvironmentOutlined style={{ color: "white" }} />}
            dropdownStyle={{ color: "#000" }}
            onClick={() => {
              if (cityStore.cities.length === 0) {
                cityStore.fetchCities();
              }
            }}
            options={cityStore.cities.map(city => ({
              value: city.id,
              label: city.name,
            }))}
          />
          <Menu
            theme="dark"
            mode="horizontal"
            items={menuItems}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              minWidth: 0,
              borderBottom: "none",
            }}
            selectedKeys={[pathname]}
          />
        </div>
      </AntHeader>
      <Modal
        title="Выберите город"
        open={cityModalVisible}
        closable={false}
        maskClosable={false}
        footer={null}
      >
        <Select
          placeholder="Выберите город для поиска ресторанов"
          style={{ width: "100%" }}
          onChange={async (cityId) => {
            // Очищаем корзину при смене города
            cartStore.clearCart();
            cityStore.setCity(cityId);
            setCityModalVisible(false);
            // Обновляем данные на текущей странице
            const { restaurantStore } = await import("@/stores");
            await restaurantStore.fetchRestaurants(true);
            router.refresh();
          }}
          options={cityStore.cities.map(city => ({
            value: city.id,
            label: city.name,
          }))}
        />
      </Modal>
    </>
  );
});

export default AppHeader;


