"use client";

import { NowProvider } from "@/context/now-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SWRConfig } from "swr";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <SWRConfig
      value={{
        onError: (error: { status?: number }) => {
          if (error?.status === 401) {
            router.push("/login");
          } else {
            toast.error("Something went wrong. Please try again.");
          }
        },
      }}
    >
      <NowProvider>{children}</NowProvider>
    </SWRConfig>
  );
}
