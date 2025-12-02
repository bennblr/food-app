"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Button,
  Spin,
  Tabs,
  Rate,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { restaurantStore, cartStore } from "@/stores";
import axios from "axios";
import styles from "./page.module.css";

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      await restaurantStore.fetchRestaurant(Number(params.id));
      const response = await axios.get(`/api/restaurants/${params.id}/menu`);
      setMenu(response.data);
      setLoading(false);
    };
    fetchData();
  }, [params.id]);

  const handleAddToCart = async (dish: any) => {
    await cartStore.addItem(
      dish.id,
      Number(params.id),
      1
    );
  };

  const categories = Array.from(
    new Set(menu.map((dish) => dish.restaurantCategory?.name || "Без категории"))
  );

  const filteredMenu = selectedCategory
    ? menu.filter(
        (dish) =>
          (dish.restaurantCategory?.name || "Без категории") === selectedCategory
      )
    : menu;

  if (loading || !restaurantStore.currentRestaurant) {
    return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
  }

  const restaurant = restaurantStore.currentRestaurant;

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginRight: 16 }}
        >
          Назад
        </Button>
        <Title level={4} style={{ color: "white", margin: 0 }}>
          {restaurant.name}
        </Title>
      </Header>
      <Content className={styles.content}>
        <Card>
          <Row gutter={16}>
            <Col span={8}>
              {restaurant.coverUrl && (
                <Image
                  src={restaurant.coverUrl}
                  alt={restaurant.name}
                  style={{ width: "100%", borderRadius: 8 }}
                />
              )}
            </Col>
            <Col span={16}>
              <Title level={2}>{restaurant.name}</Title>
              <Paragraph>{restaurant.description}</Paragraph>
              <div className={styles.info}>
                <div>
                  <StarOutlined /> Рейтинг: {restaurant.rating.toFixed(1)} (
                  {restaurant.totalReviews} отзывов)
                </div>
                <div>⏱ Время доставки: {restaurant.deliveryTime} мин</div>
                <div>💰 Стоимость доставки: {restaurant.deliveryFee} ₽</div>
                <div>📍 {restaurant.address}</div>
                {restaurant.phone && <div>📞 {restaurant.phone}</div>}
              </div>
            </Col>
          </Row>
        </Card>

        <Tabs
          activeKey={selectedCategory || "all"}
          onChange={(key) => setSelectedCategory(key === "all" ? null : key)}
          items={[
            { key: "all", label: "Все" },
            ...categories.map((cat) => ({ key: cat, label: cat })),
          ]}
        />

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {filteredMenu.map((dish) => (
            <Col xs={24} sm={12} md={8} key={dish.id}>
              <Card
                hoverable
                cover={
                  dish.imageUrl && dish.imageUrl.length > 0 ? (
                    <img
                      alt={dish.name}
                      src={dish.imageUrl[0]}
                      style={{ height: 200, objectFit: "cover" }}
                    />
                  ) : null
                }
                actions={[
                  <Button
                    key="add-to-cart"
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCart(dish)}
                    disabled={!dish.isAvailable}
                  >
                    В корзину
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={dish.name}
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }}>
                        {dish.description}
                      </Paragraph>
                      <div style={{ marginTop: 8 }}>
                        <Text strong>{dish.price} ₽</Text>
                        {dish.discountPrice && (
                          <Text delete style={{ marginLeft: 8, color: "red" }}>
                            {dish.discountPrice} ₽
                          </Text>
                        )}
                      </div>
                      {dish.weight && <div>Вес: {dish.weight}</div>}
                      {dish.rating > 0 && (
                        <div>
                          <Rate disabled defaultValue={dish.rating} /> (
                          {dish.totalReviews})
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
    </Layout>
  );
}

