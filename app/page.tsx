"use client";

import { useEffect, useState } from "react";
import { Layout, Row, Col, Card, Typography, Spin, Input, Button } from "antd";
import { SearchOutlined, FireOutlined, AppstoreOutlined } from "@ant-design/icons";
import { restaurantStore, httpService, cityStore } from "@/stores";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import AppHeader from "@/components/Header";
import styles from "./page.module.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const HomePage = observer(() => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (!initialized) {
      restaurantStore.fetchRestaurants();
      fetchCategories();
      setInitialized(true);
    }
  }, [initialized]);

  // Реакция на изменение города - обновляем данные
  useEffect(() => {
    const unsubscribe = cityStore.onCityChange(() => {
      restaurantStore.fetchRestaurants(true);
      fetchCategories();
    });
    return unsubscribe;
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await httpService.get<any[]>("/api/categories");
      setCategories(data);
    } catch (error) {
      console.error("Ошибка загрузки категорий:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSearch = () => {
    restaurantStore.setFilters({ search });
    restaurantStore.fetchRestaurants();
  };

  return (
    <Layout className={styles.layout}>
      <AppHeader />
      <Content className={styles.content}>
        <div className={styles.searchSection}>
          <Input
            size="large"
            placeholder="Поиск ресторанов..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            suffix={
              <Button type="primary" onClick={handleSearch}>
                Найти
              </Button>
            }
          />
        </div>

        <div className={styles.section}>
          <Title level={4}>
            <AppstoreOutlined /> Категории
          </Title>
          {categoriesLoading ? (
            <Spin size="large" />
          ) : (
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
              {categories.map((category) => (
                <Col xs={12} sm={8} md={6} lg={4} key={category.id}>
                  <Link href={`/categories/${category.id}`} prefetch={true}>
                    <Card
                      hoverable
                      style={{ textAlign: "center" }}
                      cover={
                        category.iconUrl ? (
                          <div style={{ padding: 20 }}>
                            <img
                              src={category.iconUrl}
                              alt={category.name}
                              style={{
                                width: "100%",
                                height: 80,
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: 80,
                              background: "#f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <AppstoreOutlined style={{ fontSize: 32, color: "#999" }} />
                          </div>
                        )
                      }
                    >
                      <Card.Meta title={category.name} />
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          )}
        </div>

        <div className={styles.section}>
          <Title level={4}>
            <FireOutlined /> Популярные рестораны
          </Title>
          {restaurantStore.isLoading ? (
            <Spin size="large" />
          ) : (
            <Row gutter={[16, 16]}>
              {restaurantStore.restaurants.map((restaurant) => (
                <Col xs={24} sm={12} md={8} lg={6} key={restaurant.id}>
                  <Link href={`/restaurants/${restaurant.id}`} prefetch={true}>
                    <Card
                      hoverable
                      cover={
                        (restaurant.coverUrl || restaurant.logoUrl) ? (
                          <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
                            <img
                              alt={restaurant.name}
                              src={restaurant.coverUrl || restaurant.logoUrl || ''}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;"><span style="color: #999;">Нет изображения</span></div>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: 200,
                              background: "#f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text type="secondary">Нет изображения</Text>
                          </div>
                        )
                      }
                    >
                      <Card.Meta
                        title={restaurant.name}
                        description={
                          <div>
                            <div>⭐ {typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : '0.0'}</div>
                            {restaurant.deliveryTime && <div>⏱ {restaurant.deliveryTime} мин</div>}
                            <div>💰 Доставка: {restaurant.deliveryFee || 0} ₽</div>
                          </div>
                        }
                      />
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Content>
    </Layout>
  );
});

export default HomePage;

