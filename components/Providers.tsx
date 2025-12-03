"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { httpService } from "@/stores";

// Компонент для инициализации queryClient в HttpService
function QueryClientInitializer({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Передаем queryClient в HttpService для кэширования
    httpService.setQueryClient(queryClient);
  }, [queryClient]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryClientInitializer>
        <SessionProvider 
          refetchInterval={0} 
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          {children}
        </SessionProvider>
      </QueryClientInitializer>
    </QueryClientProvider>
  );
}

