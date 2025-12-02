"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
  Card,
  Form,
  Select,
  Button,
  Input,
  Typography,
  message,
  Spin,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { cartStore } from "@/stores";
import { observer } from "mobx-react-lite";
import styles from "./page.module.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const CheckoutPage = observer(() => {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get("/api/addresses");
      setAddresses(response.data);
      if (response.data.length > 0) {
        const primary = response.data.find((a: any) => a.isPrimary) || response.data[0];
        form.setFieldsValue({ addressId: primary.id });
      }
    } catch (error) {
      message.error("Ошибка загрузки адресов");
    }
  };

  const onFinish = async (values: any) => {
    if (cartStore.items.length === 0) {
      message.warning("Корзина пуста");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/orders", {
        addressId: values.addressId,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        promotionCode: values.promotionCode,
      });
      message.success("Заказ оформлен!");
      cartStore.clearCart();
      router.push(`/orders/${response.data.id}`);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка оформления заказа");
    } finally {
      setLoading(false);
    }
  };

  if (cartStore.items.length === 0) {
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
            Оформление заказа
          </Title>
        </Header>
        <Content className={styles.content}>
          <Card>
            <Text>Корзина пуста</Text>
          </Card>
        </Content>
      </Layout>
    );
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
          Оформление заказа
        </Title>
      </Header>
      <Content className={styles.content}>
        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Итого: {cartStore.totalPrice.toFixed(2)} ₽</Title>
          </div>

          <Form form={form} onFinish={onFinish} layout="vertical">
            <Form.Item
              name="addressId"
              label="Адрес доставки"
              rules={[{ required: true, message: "Выберите адрес" }]}
            >
              <Select placeholder="Выберите адрес">
                {addresses.map((address) => (
                  <Select.Option key={address.id} value={address.id}>
                    {address.address}
                    {address.isPrimary && " (Основной)"}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="paymentMethod"
              label="Способ оплаты"
              rules={[{ required: true, message: "Выберите способ оплаты" }]}
              initialValue="CASH"
            >
              <Select>
                <Select.Option value="CASH">Наличными курьеру</Select.Option>
                <Select.Option value="CARD_ONLINE">Картой онлайн</Select.Option>
                <Select.Option value="CARD_COURIER">Картой курьеру</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="promotionCode" label="Промокод (необязательно)">
              <Input placeholder="Введите промокод" />
            </Form.Item>

            <Form.Item name="notes" label="Примечания (необязательно)">
              <Input.TextArea rows={3} placeholder="Особые пожелания к заказу" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                Оформить заказ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
});

export default CheckoutPage;

