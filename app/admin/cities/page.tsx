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
  Switch,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";

interface City {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  orderIndex: number;
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const data = await httpService.get<City[]>("/api/admin/cities");
      setCities(data);
    } catch (error: unknown) {
      message.error("Ошибка загрузки городов");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: unknown) => {
    try {
      const cityData = values as City;
      if (editingCity) {
        await httpService.put(`/api/admin/cities/${editingCity.id}`, cityData);
        message.success("Город обновлен");
      } else {
        await httpService.post("/api/admin/cities", cityData);
        message.success("Город создан");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingCity(null);
      fetchCities();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await httpService.delete(`/api/admin/cities/${id}`);
      message.success("Город удален");
      fetchCities();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка удаления");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
    },
    {
      title: "Порядок",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 100,
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (isActive ? "Да" : "Нет"),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: unknown, record: City) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCity(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить город?"
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
        <h2>Управление городами</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCity(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Добавить город
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={cities}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingCity ? "Редактировать город" : "Добавить город"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingCity(null);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input placeholder="moscow" />
          </Form.Item>
          <Form.Item name="orderIndex" label="Порядок сортировки" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isActive" label="Активен" valuePropName="checked" initialValue={true}>
            <Switch />
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

