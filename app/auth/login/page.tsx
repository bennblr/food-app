"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Card, Form, Input, Button, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { authStore } from "@/stores";
import Link from "next/link";
import styles from "./page.module.css";

const { Content } = Layout;
const { Title } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const success = await authStore.login(values.email, values.password);
    setLoading(false);

    if (success) {
      message.success("Успешный вход");
      router.push("/");
    } else {
      message.error(authStore.error || "Ошибка входа");
    }
  };

  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <Card className={styles.card}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
            Вход
          </Title>
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Введите email" },
                { type: "email", message: "Неверный формат email" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Введите пароль" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Пароль"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Войти
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            Нет аккаунта? <Link href="/auth/register">Зарегистрироваться</Link>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}

