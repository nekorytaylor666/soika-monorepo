import { trpc } from "@/lib/trpc";
import { isDev } from "@/lib/utils";
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { getPlatformProxy } from "wrangler";
import superjson from "superjson";

export const useTrpc = () => {
  const [trpcQueryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Number.POSITIVE_INFINITY,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  console.log(process.env.NODE_ENV);

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          // url: "https://soika.gefest.agency:3000/trpc",
          url: "http://localhost:3000/trpc",
        }),
      ],
    })
  );

  return {
    trpcQueryClient,
    trpcClient,
  };
};
