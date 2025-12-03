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
  Switch,
  message,
  Popconfirm,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";

export default function AdminCuisinesPage() {
  const [cuisines, setCuisines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCuisines();
  }, []);

  const fetchCuisines = async () => {
    setLoading(true);
    try {
      const data = await httpService.get<any[]>("/api/admin/cuisines");
      setCuisines(data);
    } catch (error) {
      message.error("Ошибка загрузки кухонь");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCuisine) {
        await httpService.put(`/api/admin/cuisines/${editingCuisine.id}`, values);
        message.success("Кухня обновлена");
      } else {
        await httpService.post("/api/admin/cuisines", values);
        message.success("Кухня создана");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingCuisine(null);
      fetchCuisines();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await httpService.delete(`/api/admin/cuisines/${id}`);
      message.success("Кухня удалена");
      fetchCuisines();
    } catch (error) {
      message.error("Ошибка удаления");
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
      title: "Активна",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Да" : "Нет"}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCuisine(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить кухню?"
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
        <h1>Кухни</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCuisine(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Добавить кухню
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={cuisines}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingCuisine ? "Редактировать кухню" : "Добавить кухню"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingCuisine(null);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: "Введите slug" }]}
          >
            <Input placeholder="например: italian" />
          </Form.Item>

          <Form.Item name="iconUrl" label="URL иконки">
            <Input placeholder="https://example.com/icon.png" />
          </Form.Item>

          <Form.Item
            name="orderIndex"
            label="Порядок сортировки"
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Активна"
            valuePropName="checked"
            initialValue={true}
          >
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

