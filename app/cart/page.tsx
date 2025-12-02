"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
  Typography,
  Card,
  Button,
  InputNumber,
  Space,
  Divider,
  Spin,
  Empty,
} from "antd";
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { cartStore } from "@/stores";
import { observer } from "mobx-react-lite";
import AppHeader from "@/components/Header";
import styles from "./page.module.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const CartPage = observer(() => {
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      cartStore.fetchCart();
      setInitialized(true);
    }
  }, [initialized]);

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (cartStore.isLoading) {
    return (
      <Layout className={styles.layout}>
        <AppHeader />
        <Content className={styles.content}>
          <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
            <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
          </div>
        </Content>
      </Layout>
    );
  }

  if (cartStore.items.length === 0) {
    return (
      <Layout className={styles.layout}>
        <AppHeader />
        <Content className={styles.content}>
          <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
            <Title level={2} style={{ marginBottom: 24 }}>
              <ShoppingCartOutlined /> Корзина
            </Title>
            <Empty description="Корзина пуста" />
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
            <ShoppingCartOutlined /> Корзина
          </Title>
        <Card>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {cartStore.items.map((item) => (
              <div key={item.id}>
                <Card>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <Title level={5}>{item.dish?.name}</Title>
                      <Text>
                        {item.dish?.price} ₽ × {item.quantity} ={" "}
                        {(item.dish?.price || 0) * item.quantity} ₽
                      </Text>
                    </div>
                    <Space>
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        onChange={(value) =>
                          cartStore.updateQuantity(item.id, value || 1)
                        }
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => cartStore.removeItem(item.id)}
                      />
                    </Space>
                  </Space>
                </Card>
              </div>
            ))}
          </Space>

          <Divider />

          <div className={styles.total}>
            <Text strong>Итого: {cartStore.totalPrice.toFixed(2)} ₽</Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={handleCheckout}
            style={{ width: "100%", marginTop: 16 }}
          >
            Оформить заказ
          </Button>
        </Card>
        </div>
      </Content>
    </Layout>
  );
});

export default CartPage;

