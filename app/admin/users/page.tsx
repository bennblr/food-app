"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";

const { Option } = Select;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await httpService.get<any[]>("/api/admin/users");
      setUsers(data);
    } catch (error) {
      message.error("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await httpService.put(`/api/admin/users/${editingUser.id}`, values);
        message.success("Пользователь обновлен");
      } else {
        await httpService.post("/api/admin/users", values);
        message.success("Пользователь создан");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await httpService.delete(`/api/admin/users/${id}`);
      message.success("Пользователь удален");
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка удаления");
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      APP_OWNER: "red",
      APP_EDITOR: "orange",
      RESTAURANT_OWNER: "blue",
      RESTAURANT_EMPLOYEE: "cyan",
      DRIVER: "green",
      CLIENT: "default",
    };
    return colors[role] || "default";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      APP_OWNER: "Владелец приложения",
      APP_EDITOR: "Редактор",
      RESTAURANT_OWNER: "Владелец ресторана",
      RESTAURANT_EMPLOYEE: "Сотрудник ресторана",
      DRIVER: "Курьер",
      CLIENT: "Клиент",
    };
    return labels[role] || role;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Имя",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Телефон",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Роль",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag>
      ),
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Да" : "Нет"}
        </Tag>
      ),
    },
    {
      title: "Дата создания",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("ru-RU"),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue({
                ...record,
                password: undefined, // Не показываем пароль при редактировании
              });
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить пользователя?"
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
        <h1>Пользователи</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingUser(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Добавить пользователя
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingUser ? "Редактировать пользователя" : "Добавить пользователя"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Неверный формат email" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="name" label="Имя">
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Телефон">
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
            rules={editingUser ? [] : [{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: "Выберите роль" }]}
          >
            <Select>
              <Option value="CLIENT">Клиент</Option>
              <Option value="RESTAURANT_OWNER">Владелец ресторана</Option>
              <Option value="RESTAURANT_EMPLOYEE">Сотрудник ресторана</Option>
              <Option value="DRIVER">Курьер</Option>
              <Option value="APP_EDITOR">Редактор</Option>
              <Option value="APP_OWNER">Владелец приложения</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Активен" valuePropName="checked">
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

