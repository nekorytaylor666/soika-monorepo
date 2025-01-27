import { TRPCError, initTRPC } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import superjson from "superjson";
import { db as dbConnection } from "db/connection";
import { auth } from "src/lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const createContext = async ({ opts, c }) => {
  return {
    db: dbConnection,
    user: c.get("user"),
    session: c.get("session"),
  };
};
type Context = Awaited<ReturnType<typeof createContext>> & {
  session: {
    userId: string;
  };
};

export const t = initTRPC.context<Context>().create({ transformer: superjson });

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  return next({
    ctx: {
      session: {
        userId: ctx.session?.userId,
      },
    },
  });
});

export const router = t.router;

export const authenticatedProcedure = t.procedure.use(isAuthenticated);

export const publicProcedure = t.procedure;
