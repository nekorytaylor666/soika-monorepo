import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@tender-track/backend/src/trpc/router";

export const trpc = createTRPCReact<AppRouter>();