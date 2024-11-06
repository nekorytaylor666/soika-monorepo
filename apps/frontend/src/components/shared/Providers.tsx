import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "../theme-provider";
import { useTrpc } from "@/hooks/useTrpc";
import { trpc } from "@/lib/trpc";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { Toaster } from "../ui/sonner";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const router = createRouter({ routeTree });
export const Providers = ({ children }: PropsWithChildren) => {
  const { trpcQueryClient, trpcClient } = useTrpc();

  return (
    <trpc.Provider client={trpcClient} queryClient={trpcQueryClient}>
      <QueryClientProvider client={trpcQueryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Toaster />
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
};
