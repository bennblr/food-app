"use client";

import { useEffect, useState } from "react";
import { Layout, Row, Col, Card, Typography, Spin, Input, Button } from "antd";
import { SearchOutlined, FireOutlined } from "@ant-design/icons";
import { restaurantStore } from "@/stores";
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

  useEffect(() => {
    if (!initialized) {
      restaurantStore.fetchRestaurants();
      setInitialized(true);
    }
  }, [initialized]);

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
                          <Image
                            alt={restaurant.name}
                            src={restaurant.coverUrl}
                            width={400}
                            height={200}
                            style={{ objectFit: "cover" }}
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

