"use client";

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
import { cartStore, httpService } from "@/stores";
import { observer } from "mobx-react-lite";
import AppHeader from "@/components/Header";
import styles from "./page.module.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const CheckoutPage = observer(() => {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchAddresses = async () => {
    try {
      const data = await httpService.get<any[]>("/api/addresses");
      setAddresses(data);
      if (data.length > 0) {
        const primary = data.find((a: any) => a.isPrimary) || data[0];
        form.setFieldsValue({ addressId: primary.id });
      }
    } catch (error) {
      message.error("Ошибка загрузки адресов");
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values: any) => {
    if (cartStore.items.length === 0) {
      message.warning("Корзина пуста");
      return;
    }

    setLoading(true);
    try {
      const data = await httpService.post<any>("/api/orders", {
        addressId: values.addressId,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        promotionCode: values.promotionCode,
      });
      message.success("Заказ оформлен!");
      cartStore.clearCart();
      router.push(`/orders/${data.id}`);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Ошибка оформления заказа");
    } finally {
      setLoading(false);
    }
  };

  if (cartStore.items.length === 0) {
    return (
      <Layout className={styles.layout}>
        <AppHeader />
        <Content className={styles.content}>
          <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <Card>
            <Text>Корзина пуста</Text>
          </Card>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className={styles.layout}>
      <AppHeader />
      <Content className={styles.content}>
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <Title level={2} style={{ marginBottom: 24 }}>
            Оформление заказа
          </Title>
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
        </div>
      </Content>
    </Layout>
  );
});

export default CheckoutPage;

