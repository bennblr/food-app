"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Empty,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import axios from "axios";

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  READY: "Готов",
  ON_THE_WAY: "В пути",
  DELIVERED: "Доставлен",
};

export default function DriverOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/driver/available-orders");
      setOrders(response.data);
    } catch (error) {
      message.error("Ошибка загрузки заказов");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await axios.post(`/api/driver/orders/${orderId}/accept`);
      message.success("Заказ принят");
      fetchOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка принятия заказа");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Доступные заказы</h1>
      {orders.length === 0 ? (
        <Empty description="Нет доступных заказов" />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {orders.map((order) => (
            <Card key={order.id}>
              <div style={{ marginBottom: 16 }}>
                <h3>Заказ #{order.orderNumber}</h3>
                <Tag color="blue">{statusLabels[order.status]}</Tag>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div>
                  <strong>Ресторан:</strong> {order.restaurant?.name}
                </div>
                <div>
                  <strong>Адрес ресторана:</strong> {order.restaurant?.address}
                </div>
                <div>
                  <strong>Адрес доставки:</strong> {order.address?.address}
                </div>
                <div>
                  <strong>Сумма:</strong> {order.finalAmount} ₽
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Блюда:</strong>
                <ul>
                  {order.items?.map((item: any) => (
                    <li key={item.id}>
                      {item.dishName} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleAcceptOrder(order.id)}
                block
              >
                Принять заказ
              </Button>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}

