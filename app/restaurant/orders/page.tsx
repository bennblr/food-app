"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  message,
} from "antd";
import axios from "axios";

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  READY: "Готов",
  ON_THE_WAY: "В пути",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменен",
};

const statusColors: Record<string, string> = {
  PENDING: "orange",
  ACCEPTED: "blue",
  PREPARING: "processing",
  READY: "cyan",
  ON_THE_WAY: "purple",
  DELIVERED: "success",
  CANCELLED: "error",
};

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/restaurant/orders");
      setOrders(response.data);
    } catch (error) {
      message.error("Ошибка загрузки заказов");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await axios.put(`/api/restaurant/orders/${orderId}/status`, { status });
      message.success("Статус обновлен");
      fetchOrders();
    } catch (error) {
      message.error("Ошибка обновления статуса");
    }
  };

  const columns = [
    {
      title: "Номер заказа",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "Клиент",
      key: "client",
      render: (_: any, record: any) => record.user?.name || record.user?.email,
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: "Сумма",
      dataIndex: "finalAmount",
      key: "finalAmount",
      render: (amount: number) => `${amount} ₽`,
    },
    {
      title: "Дата",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("ru-RU"),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: any, record: any) => {
        if (["DELIVERED", "CANCELLED"].includes(record.status)) {
          return null;
        }

        const nextStatuses: Record<string, string[]> = {
          PENDING: ["ACCEPTED", "CANCELLED"],
          ACCEPTED: ["PREPARING", "CANCELLED"],
          PREPARING: ["READY", "CANCELLED"],
          READY: ["ON_THE_WAY"],
          ON_THE_WAY: ["DELIVERED"],
        };

        const availableStatuses = nextStatuses[record.status] || [];

        return (
          <Space>
            {availableStatuses.map((status) => (
              <Button
                key={status}
                size="small"
                onClick={() => handleStatusChange(record.id, status)}
              >
                {statusLabels[status]}
              </Button>
            ))}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <h1>Заказы ресторана</h1>
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
        expandable={{
          expandedRowRender: (record) => (
            <div>
              <h4>Блюда:</h4>
              <ul>
                {record.items?.map((item: any) => (
                  <li key={item.id}>
                    {item.dishName} × {item.quantity} = {item.totalPrice} ₽
                  </li>
                ))}
              </ul>
              {record.notes && (
                <div>
                  <strong>Примечания:</strong> {record.notes}
                </div>
              )}
            </div>
          ),
        }}
      />
    </div>
  );
}

