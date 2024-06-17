import type { AppRouter } from "backend/src/trpc/appRouter";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
