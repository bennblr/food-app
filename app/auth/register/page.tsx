"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Card, Form, Input, Button, Typography, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { httpService } from "@/stores";
import Link from "next/link";
import styles from "../login/page.module.css";

const { Content } = Layout;
const { Title } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      await httpService.post("/api/auth/register", values);
      message.success("Регистрация успешна! Войдите в систему");
      router.push("/auth/login");
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Ошибка регистрации"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <Card className={styles.card}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
            Регистрация
          </Title>
          <Form
            name="register"
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
                prefix={<MailOutlined />}
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item
              name="name"
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Имя (необязательно)"
              />
            </Form.Item>

            <Form.Item
              name="phone"
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Телефон (необязательно)"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Введите пароль" },
                { min: 6, message: "Пароль должен быть не менее 6 символов" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Пароль"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Подтвердите пароль" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Пароли не совпадают"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Подтвердите пароль"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Зарегистрироваться
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            Уже есть аккаунт? <Link href="/auth/login">Войти</Link>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}

