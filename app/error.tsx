"use client";

import { useEffect } from "react";
import { Result, Button } from "antd";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Result
      status="500"
      title="500"
      subTitle="Произошла ошибка"
      extra={
        <>
          <Button type="primary" onClick={() => reset()}>
            Попробовать снова
          </Button>
          <Button onClick={() => router.push("/")}>Вернуться на главную</Button>
        </>
      }
    />
  );
}

