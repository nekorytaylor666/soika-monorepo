import { TRPCError, initTRPC } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import superjson from "superjson";
import Session from "supertokens-node/recipe/session";
import { db as dbConnection } from "db/connection";
import { auth } from "src/lib/auth";
import { fromNodeHeaders } from "better-auth/node";

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
  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: fromNodeHeaders(ctx.req.headers), // pass the headers
  });

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: {
        userId: session.user.id,
      },
    },
  });
});

export const router = t.router;

export const authenticatedProcedure = t.procedure.use(isAuthenticated);

export const publicProcedure = t.procedure;
