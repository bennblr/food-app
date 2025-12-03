"use client";

import { useEffect, useState } from "react";
import { Layout, Row, Col, Card, Typography, Spin, Button, Tag } from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cartStore, httpService, cityStore } from "@/stores";
import { observer } from "mobx-react-lite";
import AppHeader from "@/components/Header";
import styles from "./page.module.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const CategoryPage = observer(() => {
  const params = useParams();
  const router = useRouter();
  const [dishes, setDishes] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  // Реакция на изменение города - обновляем данные
  useEffect(() => {
    const unsubscribe = cityStore.onCityChange(() => {
      fetchData();
    });
    return unsubscribe;
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Загружаем категорию
      const categories = await httpService.get<any[]>("/api/categories");
      const foundCategory = categories.find((cat) => cat.id === parseInt(params.id as string));
      setCategory(foundCategory);

      // Загружаем блюда категории с учетом выбранного города
      const cityId = cityStore.selectedCityId;
      const url = cityId 
        ? `/api/categories/${params.id}/dishes?cityId=${cityId}`
        : `/api/categories/${params.id}/dishes`;
      const dishesData = await httpService.get<any[]>(url);
      console.log("Загружено блюд:", dishesData.length);
      setDishes(dishesData);
    } catch (error: any) {
      console.error("Ошибка загрузки данных:", error);
      console.error("Детали ошибки:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (dish: any) => {
    await cartStore.addItem(dish.id, dish.restaurantId, 1);
  };

  if (loading) {
    return (
      <Layout className={styles.layout}>
        <AppHeader />
        <Content className={styles.content}>
          <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
        </Content>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout className={styles.layout}>
        <AppHeader />
        <Content className={styles.content}>
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Title level={3}>Категория не найдена</Title>
            <Button onClick={() => router.push("/")}>Вернуться на главную</Button>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className={styles.layout}>
      <AppHeader />
      <Content className={styles.content}>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/")}
            style={{ marginBottom: 16 }}
          >
            Назад
          </Button>
          <Title level={2}>{category.name}</Title>
          {category.description && <Text type="secondary">{category.description}</Text>}
        </div>

        {dishes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Text type="secondary">В этой категории пока нет блюд</Text>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {dishes.map((dish) => (
              <Col xs={24} sm={12} md={8} lg={6} key={dish.id}>
                <Card
                  hoverable
                  cover={
                    dish.imageUrl && dish.imageUrl.length > 0 ? (
                      <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
                        <img
                          alt={dish.name}
                          src={dish.imageUrl[0]}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
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
                  actions={[
                    <Button
                      key="add-to-cart"
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleAddToCart(dish)}
                      disabled={!dish.isAvailable}
                      block
                    >
                      В корзину
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={dish.name}
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <Link href={`/restaurants/${dish.restaurant.id}`} prefetch={true}>
                            <Text type="secondary">{dish.restaurant.name}</Text>
                          </Link>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <Text strong style={{ fontSize: 18 }}>
                            {dish.discountPrice ? (
                              <>
                                <Text delete style={{ color: "#999", fontSize: 14 }}>
                                  {dish.price} ₽
                                </Text>{" "}
                                {dish.discountPrice} ₽
                              </>
                            ) : (
                              `${dish.price} ₽`
                            )}
                          </Text>
                        </div>
                        {dish.description && (
                          <Text type="secondary" ellipsis style={{ display: "block", marginBottom: 8 }}>
                            {dish.description}
                          </Text>
                        )}
                        <div>
                          {dish.isVegetarian && <Tag color="green">Вегетарианское</Tag>}
                          {dish.isSpicy && <Tag color="red">Острое</Tag>}
                          {!dish.isAvailable && <Tag color="default">Недоступно</Tag>}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>
    </Layout>
  );
});

export default CategoryPage;

