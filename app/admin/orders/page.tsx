"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Tag,
  Space,
  message,
  Button,
  Modal,
  Descriptions,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";

const { Option } = Select;

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = selectedStatus
        ? `/api/admin/orders?status=${selectedStatus}`
        : "/api/admin/orders";
      const data = await httpService.get<any[]>(url);
      setOrders(data);
    } catch (error) {
      message.error("Ошибка загрузки заказов");
    } finally {
      setLoading(false);
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
      render: (_: any, record: any) =>
        record.user?.name || record.user?.email || "Неизвестно",
    },
    {
      title: "Ресторан",
      key: "restaurant",
      render: (_: any, record: any) => record.restaurant?.name || "Неизвестно",
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
      render: (_: any, record: any) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedOrder(record);
            setDetailModalVisible(true);
          }}
        >
          Подробнее
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h1>Заказы</h1>
        <Select
          placeholder="Фильтр по статусу"
          allowClear
          style={{ width: 200 }}
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value)}
        >
          <Option value="PENDING">Ожидает подтверждения</Option>
          <Option value="ACCEPTED">Принят</Option>
          <Option value="PREPARING">Готовится</Option>
          <Option value="READY">Готов</Option>
          <Option value="ON_THE_WAY">В пути</Option>
          <Option value="DELIVERED">Доставлен</Option>
          <Option value="CANCELLED">Отменен</Option>
          <Option value="REFUNDED">Возвращен</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
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
                <div style={{ marginTop: 8 }}>
                  <strong>Примечания:</strong> {record.notes}
                </div>
              )}
            </div>
          ),
        }}
      />

      <Modal
        title={`Заказ #${selectedOrder?.orderNumber}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Клиент">
              {selectedOrder.user?.name || selectedOrder.user?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Телефон">
              {selectedOrder.user?.phone || "Не указан"}
            </Descriptions.Item>
            <Descriptions.Item label="Ресторан">
              {selectedOrder.restaurant?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={statusColors[selectedOrder.status]}>
                {statusLabels[selectedOrder.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Адрес доставки" span={2}>
              {selectedOrder.address?.address}
            </Descriptions.Item>
            <Descriptions.Item label="Способ оплаты">
              {selectedOrder.paymentMethod === "CASH"
                ? "Наличными"
                : selectedOrder.paymentMethod === "CARD_ONLINE"
                ? "Картой онлайн"
                : "Картой курьеру"}
            </Descriptions.Item>
            <Descriptions.Item label="Статус оплаты">
              {selectedOrder.paymentStatus === "PAID"
                ? "Оплачено"
                : selectedOrder.paymentStatus === "FAILED"
                ? "Ошибка"
                : selectedOrder.paymentStatus === "REFUNDED"
                ? "Возвращено"
                : "Ожидает оплаты"}
            </Descriptions.Item>
            <Descriptions.Item label="Сумма заказа">
              {selectedOrder.subtotalAmount} ₽
            </Descriptions.Item>
            <Descriptions.Item label="Доставка">
              {selectedOrder.deliveryFee || 0} ₽
            </Descriptions.Item>
            <Descriptions.Item label="Итого" span={2}>
              <strong>{selectedOrder.finalAmount} ₽</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Блюда" span={2}>
              <ul>
                {selectedOrder.items?.map((item: any) => (
                  <li key={item.id}>
                    {item.dishName} × {item.quantity} = {item.totalPrice} ₽
                  </li>
                ))}
              </ul>
            </Descriptions.Item>
            {selectedOrder.notes && (
              <Descriptions.Item label="Примечания" span={2}>
                {selectedOrder.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Дата создания">
              {new Date(selectedOrder.createdAt).toLocaleString("ru-RU")}
            </Descriptions.Item>
            {selectedOrder.driver && (
              <Descriptions.Item label="Курьер">
                {selectedOrder.driver.name || selectedOrder.driver.phone}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

