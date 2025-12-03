"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Select,
  message,
  Alert,
  Form,
  Input,
  InputNumber,
  Switch,
  Modal,
  Popconfirm,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  HistoryOutlined,
  MenuOutlined,
  AppstoreOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { httpService } from "@/stores";
import Image from "next/image";

const { Option } = Select;

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

export default function AdminRestaurantManagementPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const data = await httpService.get<any[]>("/api/admin/restaurants");
      setRestaurants(data);
      if (data.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(data[0].id);
      }
    } catch (error) {
      message.error("Ошибка загрузки ресторанов");
    }
  };

  if (restaurants.length === 0) {
    return (
      <div>
        <Alert
          message="Нет ресторанов"
          description="Создайте ресторан в разделе 'Рестораны'"
          type="info"
        />
      </div>
    );
  }

  return (
    <div>
      <h1>Управление рестораном</h1>
      <Alert
        message="Режим администратора"
        description="Вы управляете ресторанами от имени администратора"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Выберите ресторан"
          style={{ width: 300 }}
          value={selectedRestaurantId}
          onChange={(value) => setSelectedRestaurantId(value)}
        >
          {restaurants.map((restaurant) => (
            <Option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </Option>
          ))}
        </Select>
      </div>

      {selectedRestaurantId && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "orders",
              label: (
                <span>
                  <FileTextOutlined />
                  Заказы
                </span>
              ),
              children: <OrdersTab restaurantId={selectedRestaurantId} />,
            },
            {
              key: "history",
              label: (
                <span>
                  <HistoryOutlined />
                  История заказов
                </span>
              ),
              children: <OrderHistoryTab restaurantId={selectedRestaurantId} />,
            },
            {
              key: "menu",
              label: (
                <span>
                  <MenuOutlined />
                  Меню
                </span>
              ),
              children: <MenuTab restaurantId={selectedRestaurantId} />,
            },
            {
              key: "categories",
              label: (
                <span>
                  <AppstoreOutlined />
                  Категории ресторана
                </span>
              ),
              children: <RestaurantCategoriesTab restaurantId={selectedRestaurantId} />,
            },
          ]}
        />
      )}
    </div>
  );
}

// Компонент для таба "Заказы" (активные заказы)
function OrdersTab({ restaurantId }: { restaurantId: number }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/restaurant/orders?restaurantId=${restaurantId}`;
      const data = await httpService.get<any[]>(url);
      // Фильтруем только активные заказы (не DELIVERED и не CANCELLED)
      const activeOrders = data.filter(
        (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED"
      );
      setOrders(activeOrders);
    } catch (error) {
      message.error("Ошибка загрузки заказов");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await httpService.put(`/api/restaurant/orders/${orderId}/status`, { status });
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
  );
}

// Компонент для таба "История заказов"
function OrderHistoryTab({ restaurantId }: { restaurantId: number }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/restaurant/orders?restaurantId=${restaurantId}`;
      const data = await httpService.get<any[]>(url);
      // Фильтруем только завершенные заказы
      const completedOrders = data.filter(
        (order) => order.status === "DELIVERED" || order.status === "CANCELLED"
      );
      setOrders(completedOrders);
    } catch (error) {
      message.error("Ошибка загрузки истории заказов");
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
  ];

  return (
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
  );
}

// Компонент для таба "Меню"
function MenuTab({ restaurantId }: { restaurantId: number }) {
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDishes();
    fetchCategories();
  }, [restaurantId]);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const data = await httpService.get<any[]>(`/api/admin/restaurants/${restaurantId}/menu`);
      setDishes(data);
    } catch (error) {
      message.error("Ошибка загрузки меню");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await httpService.get<any[]>(`/api/admin/restaurants/${restaurantId}/categories`);
      setCategories(data);
    } catch (error) {
      message.error("Ошибка загрузки категорий");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Обрабатываем imageUrl - если это строка, разделяем по запятой
      let imageUrlArray: string[] = [];
      if (values.imageUrl) {
        if (typeof values.imageUrl === 'string') {
          imageUrlArray = values.imageUrl
            .split(',')
            .map((url: string) => url.trim())
            .filter((url: string) => url.length > 0);
        } else if (Array.isArray(values.imageUrl)) {
          imageUrlArray = values.imageUrl;
        }
      }

      // Очищаем пустые значения категорий
      const cleanedValues = {
        ...values,
        restaurantCategoryId: values.restaurantCategoryId || null,
        categoryId: values.categoryId || null,
        imageUrl: imageUrlArray,
      };

      if (editingDish) {
        await httpService.put(
          `/api/admin/restaurants/${restaurantId}/menu/${editingDish.id}`,
          cleanedValues
        );
        message.success("Блюдо обновлено");
      } else {
        await httpService.post(`/api/admin/restaurants/${restaurantId}/menu`, cleanedValues);
        message.success("Блюдо создано");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDish(null);
      fetchDishes();
    } catch (error: any) {
      console.error("Ошибка сохранения блюда:", error);
      message.error(error.response?.data?.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await httpService.delete(`/api/admin/restaurants/${restaurantId}/menu/${id}`);
      message.success("Блюдо удалено");
      fetchDishes();
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
      title: "Изображение",
      key: "image",
      width: 100,
      render: (_: any, record: any) =>
        record.imageUrl && record.imageUrl.length > 0 ? (
          <Image
            src={record.imageUrl[0]}
            alt={record.name}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <div style={{ width: 60, height: 60, background: "#f0f0f0", borderRadius: 4 }} />
        ),
    },
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Категория",
      key: "category",
      render: (_: any, record: any) =>
        record.restaurantCategory?.name || record.category?.name || "Без категории",
    },
    {
      title: "Цена",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `${price} ₽`,
    },
    {
      title: "Доступно",
      dataIndex: "isAvailable",
      key: "isAvailable",
      render: (isAvailable: boolean) => (
        <Tag color={isAvailable ? "green" : "red"}>{isAvailable ? "Да" : "Нет"}</Tag>
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
              setEditingDish(record);
              form.setFieldsValue({
                ...record,
                price: parseFloat(record.price.toString()),
                discountPrice: record.discountPrice ? parseFloat(record.discountPrice.toString()) : undefined,
                restaurantCategoryId: record.restaurantCategoryId || undefined,
                categoryId: record.categoryId || undefined,
                imageUrl: Array.isArray(record.imageUrl) ? record.imageUrl.join(', ') : record.imageUrl || '',
              });
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить блюдо?"
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
        <h3>Меню ресторана</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingDish(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Добавить блюдо
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={dishes}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingDish ? "Редактировать блюдо" : "Добавить блюдо"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDish(null);
        }}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="Цена" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountPrice" label="Цена со скидкой">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="restaurantCategoryId" label="Категория ресторана">
            <Select placeholder="Выберите категорию" allowClear>
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item 
            name="imageUrl" 
            label="URL изображения (можно несколько через запятую)"
            tooltip="Ссылки на изображения блюда, разделенные запятой"
          >
            <Input.TextArea 
              rows={2} 
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="weight" label="Вес">
                <Input placeholder="например: 300г" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="calories" label="Калории">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cookingTime" label="Время готовки (мин)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isAvailable" label="Доступно" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="isVegetarian" label="Вегетарианское" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isSpicy" label="Острое" valuePropName="checked">
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

// Компонент для таба "Категории ресторана"
function RestaurantCategoriesTab({ restaurantId }: { restaurantId: number }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
    fetchGlobalCategories();
  }, [restaurantId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await httpService.get<any[]>(`/api/admin/restaurants/${restaurantId}/categories`);
      setCategories(data);
    } catch (error) {
      message.error("Ошибка загрузки категорий");
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalCategories = async () => {
    try {
      const data = await httpService.get<any[]>("/api/admin/categories");
      setGlobalCategories(data);
    } catch (error) {
      message.error("Ошибка загрузки общих категорий");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        await httpService.put(
          `/api/admin/restaurants/${restaurantId}/categories/${editingCategory.id}`,
          values
        );
        message.success("Категория обновлена");
      } else {
        await httpService.post(`/api/admin/restaurants/${restaurantId}/categories`, values);
        message.success("Категория создана");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await httpService.delete(`/api/admin/restaurants/${restaurantId}/categories/${id}`);
      message.success("Категория удалена");
      fetchCategories();
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
      title: "Описание",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Общая категория",
      key: "globalCategory",
      render: (_: any, record: any) => record.category?.name || "Не выбрана",
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
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Да" : "Нет"}</Tag>
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
              setEditingCategory(record);
              form.setFieldsValue({
                ...record,
                categoryId: record.categoryId || undefined,
              });
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Удалить категорию?"
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
        <h3>Категории ресторана</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCategory(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Добавить категорию
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingCategory ? "Редактировать категорию" : "Добавить категорию"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingCategory(null);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item 
            name="categoryId" 
            label="Общая категория"
            tooltip="Выберите общую категорию, в которую будут попадать товары на общих страницах. Для ресторана они будут в его категории, для остальных страниц - в общей."
          >
            <Select placeholder="Выберите общую категорию" allowClear>
              {globalCategories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="orderIndex" label="Порядок сортировки" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isActive" label="Активна" valuePropName="checked" initialValue={true}>
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
