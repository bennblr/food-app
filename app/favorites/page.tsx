"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Empty, Spin, message } from "antd";
import { HeartOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";
import AppHeader from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const { Content } = Layout;

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await httpService.get<any[]>("/api/favorites");
      setFavorites(data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        message.error("Ошибка загрузки избранного");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className={styles.layout}>
      <AppHeader />
      <Content className={styles.content}>
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ marginBottom: 24 }}>
            <HeartOutlined /> Избранное
          </h1>
          {loading ? (
            <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
          ) : favorites.length === 0 ? (
            <Empty
              description="У вас пока нет избранных блюд"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {favorites.map((favorite) => (
                <Col xs={24} sm={12} md={8} lg={6} key={favorite.id}>
                  <Link href={`/restaurants/${favorite.dish?.restaurantId}`} prefetch={true}>
                    <Card
                      hoverable
                      cover={
                        favorite.dish?.imageUrl?.[0] ? (
                          <Image
                            alt={favorite.dish.name}
                            src={favorite.dish.imageUrl[0]}
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
                            Нет изображения
                          </div>
                        )
                      }
                    >
                      <Card.Meta
                        title={favorite.dish?.name}
                        description={
                          <div>
                            <div>💰 {favorite.dish?.price} ₽</div>
                            {favorite.dish?.restaurant?.name && (
                              <div>📍 {favorite.dish.restaurant.name}</div>
                            )}
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


