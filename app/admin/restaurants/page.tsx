"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [form] = Form.useForm();
  const [restaurantOwners, setRestaurantOwners] = useState<Array<{ id: number; name: string; email: string }>>([]);

  useEffect(() => {
    fetchRestaurants();
    fetchRestaurantOwners();
  }, []);

  const fetchRestaurantOwners = async () => {
    try {
      // Загружаем всех пользователей - владельцем ресторана может быть любой пользователь
      const users = await httpService.get<any[]>("/api/admin/users");
      setRestaurantOwners(users);
    } catch (error) {
      message.error("Ошибка загрузки пользователей");
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const data = await httpService.get<any[]>("/api/restaurants");
      setRestaurants(data);
    } catch (error) {
      message.error("Ошибка загрузки ресторанов");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Преобразуем числовые поля в числа
      const cleanedValues = {
        ...values,
        deliveryFee: values.deliveryFee ? Number(values.deliveryFee) : 0,
        deliveryTime: values.deliveryTime ? Number(values.deliveryTime) : null,
        minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : null,
        ownerId: values.ownerId ? Number(values.ownerId) : undefined,
      };

      if (editingRestaurant) {
        await httpService.put(`/api/admin/restaurants/${editingRestaurant.id}`, cleanedValues);
        message.success("Ресторан обновлен");
      } else {
        await httpService.post("/api/admin/restaurants", cleanedValues);
        message.success("Ресторан создан");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingRestaurant(null);
      fetchRestaurants();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await httpService.delete(`/api/admin/restaurants/${id}`);
      message.success("Ресторан удален");
      fetchRestaurants();
    } catch (error) {
      message.error("Ошибка удаления");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Логотип",
      key: "logo",
      width: 100,
      render: (_: any, record: any) =>
        record.logoUrl ? (
          <img
            src={record.logoUrl}
            alt={record.name}
            style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div style={{ width: 50, height: 50, background: "#f0f0f0", borderRadius: 4 }} />
        ),
    },
    {
      title: "Адрес",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Рейтинг",
      dataIndex: "rating",
      key: "rating",
    },
    {
      title: "Владелец",
      key: "owner",
      render: (_: any, record: any) => 
        record.owner ? `${record.owner.name || record.owner.email}` : "Не указан",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRestaurant(record);
              form.setFieldsValue({
                ...record,
                deliveryFee: record.deliveryFee ? Number(record.deliveryFee) : 0,
                deliveryTime: record.deliveryTime ? Number(record.deliveryTime) : undefined,
                minOrderAmount: record.minOrderAmount ? Number(record.minOrderAmount) : undefined,
                ownerId: record.ownerId || record.owner?.id,
              });
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить ресторан?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h1>Рестораны</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRestaurant(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Добавить ресторан
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={restaurants}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingRestaurant ? "Редактировать ресторан" : "Добавить ресторан"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingRestaurant(null);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea />
          </Form.Item>
          <Form.Item 
            name="logoUrl" 
            label="URL логотипа"
            tooltip="Ссылка на изображение логотипа ресторана"
          >
            <Input placeholder="https://example.com/logo.png" />
          </Form.Item>
          <Form.Item 
            name="coverUrl" 
            label="URL обложки"
            tooltip="Ссылка на изображение обложки ресторана"
          >
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>
          <Form.Item name="address" label="Адрес" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Телефон">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="deliveryFee" label="Стоимость доставки" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="deliveryTime" label="Время доставки (мин)">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="minOrderAmount" label="Минимальная сумма заказа">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item 
            name="ownerId" 
            label="Владелец ресторана" 
            rules={[{ required: true, message: "Необходимо выбрать владельца ресторана" }]}
          >
            <Select
              placeholder="Выберите владельца ресторана"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={restaurantOwners.map((owner) => ({
                value: owner.id,
                label: `${owner.name || owner.email} (${owner.email})`,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Сохранить
              </Button>
              <Button onClick={() => setModalVisible(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

