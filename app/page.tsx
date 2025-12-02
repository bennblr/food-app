"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Layout, Row, Col, Card, Typography, Spin, Input, Button } from "antd";
import { SearchOutlined, FireOutlined } from "@ant-design/icons";
import { restaurantStore } from "@/stores";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    restaurantStore.fetchRestaurants();
  }, []);

  const handleSearch = () => {
    restaurantStore.setFilters({ search });
    restaurantStore.fetchRestaurants();
  };

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <Title level={3} style={{ color: "white", margin: 0 }}>
          Food App
        </Title>
      </Header>
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
            <FireOutlined /> Популярные рестораны
          </Title>
          {restaurantStore.isLoading ? (
            <Spin size="large" />
          ) : (
            <Row gutter={[16, 16]}>
              {restaurantStore.restaurants.map((restaurant) => (
                <Col xs={24} sm={12} md={8} lg={6} key={restaurant.id}>
                  <Link href={`/restaurants/${restaurant.id}`}>
                    <Card
                      hoverable
                      cover={
                        restaurant.coverUrl ? (
                          <img
                            alt={restaurant.name}
                            src={restaurant.coverUrl}
                            style={{ height: 200, objectFit: "cover" }}
                          />
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
                            <div>⭐ {restaurant.rating.toFixed(1)}</div>
                            <div>⏱ {restaurant.deliveryTime} мин</div>
                            <div>💰 Доставка: {restaurant.deliveryFee} ₽</div>
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
}

