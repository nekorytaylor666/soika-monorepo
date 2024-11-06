import { TRPCError, initTRPC } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import superjson from "superjson";
import Session from "supertokens-node/recipe/session";
import { db as dbConnection } from "db/connection";

export const createContext = async ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  return {
    db: dbConnection,
    req,
    res,
  };
};
type Context = Awaited<ReturnType<typeof createContext>> & {
  session: {
    userId: string;
  };
};

export const t = initTRPC.context<Context>().create({ transformer: superjson });
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const session = await Session.getSession(ctx.req, ctx.res);
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: {
        userId: session.getUserId(),
      },
    },
  });
});

export const router = t.router;

export const authenticatedProcedure = t.procedure.use(isAuthenticated);

export const publicProcedure = t.procedure;
