import Link from "next/link";
import { Button, Result } from "antd";

export default function NotFound() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Страница не найдена"
      extra={
        <Link href="/">
          <Button type="primary">Вернуться на главную</Button>
        </Link>
      }
    />
  );
}
