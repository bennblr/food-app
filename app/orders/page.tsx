"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
  Typography,
  Card,
  Button,
  Tag,
  Spin,
  Empty,
  Timeline,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { httpService } from "@/stores";
import styles from "./page.module.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  READY: "Готов",
  ON_THE_WAY: "В пути",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменен",
  REFUNDED: "Возвращен",
};

const statusColors: Record<string, string> = {
  PENDING: "orange",
  ACCEPTED: "blue",
  PREPARING: "processing",
  READY: "cyan",
  ON_THE_WAY: "purple",
  DELIVERED: "success",
  CANCELLED: "error",
  REFUNDED: "default",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await httpService.get<any[]>("/api/orders");
      setOrders(data);
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
  }

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
          Мои заказы
        </Title>
      </Header>
      <Content className={styles.content}>
        {orders.length === 0 ? (
          <Empty description="У вас пока нет заказов" />
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <Card key={order.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <Title level={5}>Заказ #{order.orderNumber}</Title>
                    <Text type="secondary">
                      {new Date(order.createdAt).toLocaleString("ru-RU")}
                    </Text>
                  </div>
                  <Tag color={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Tag>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text strong>Ресторан: </Text>
                  <Text>{order.restaurant?.name}</Text>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text strong>Блюда:</Text>
                  <ul style={{ marginTop: 8 }}>
                    {order.items?.map((item: any) => (
                      <li key={item.id}>
                        {item.dishName} × {item.quantity} = {item.totalPrice} ₽
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text strong>Итого: {order.finalAmount} ₽</Text>
                </div>

                {order.status === "PENDING" && (
                  <Button
                    danger
                    onClick={async () => {
                      try {
                        await httpService.post(`/api/orders/${order.id}/cancel`);
                        fetchOrders();
                      } catch (error) {
                        console.error("Ошибка отмены заказа:", error);
                      }
                    }}
                  >
                    Отменить заказ
                  </Button>
                )}

                <Button
                  type="link"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  Подробнее
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Content>
    </Layout>
  );
}

