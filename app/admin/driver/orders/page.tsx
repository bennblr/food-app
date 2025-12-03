"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Empty,
  Alert,
  Select,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  READY: "Готов",
  ON_THE_WAY: "В пути",
  DELIVERED: "Доставлен",
};

export default function AdminDriverOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  useEffect(() => {
    fetchDrivers();
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, [selectedDriverId]);

  const fetchDrivers = async () => {
    try {
      const users = await httpService.get<any[]>("/api/admin/users");
      const driverUsers = users.filter((u) => u.role === "DRIVER");
      setDrivers(driverUsers);
    } catch (error) {
      message.error("Ошибка загрузки водителей");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = "/api/driver/available-orders";
      if (selectedDriverId) {
        url += `?driverId=${selectedDriverId}`;
      }
      const data = await httpService.get<any[]>(url);
      setOrders(data);
    } catch (error) {
      message.error("Ошибка загрузки заказов");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Доступные заказы</h1>
      <Alert
        message="Режим администратора"
        description="Вы просматриваете все доступные заказы для водителей. Принятие заказов доступно только водителям."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Фильтр по водителю"
          allowClear
          style={{ width: 300 }}
          value={selectedDriverId}
          onChange={(value) => setSelectedDriverId(value)}
        >
          {drivers.map((driver) => (
            <Select.Option key={driver.id} value={driver.id}>
              {driver.name || driver.email}
            </Select.Option>
          ))}
        </Select>
      </div>
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
                {order.driver && (
                  <div>
                    <strong>Водитель:</strong> {order.driver?.name || order.driver?.email || "Неизвестно"}
                  </div>
                )}
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
              <Button disabled block>
                Только для водителей
              </Button>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}

