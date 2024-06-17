import { TRPCError, initTRPC } from "@trpc/server";
import { z } from "zod";
import { db as dbConnection } from "../db/connection";
import {
  type Lot,
  boards,
  boardsStatuses,
  dealBoard,
  deals,
  lots,
  recommendedProducts,
  tenders,
  type RecommendedProduct,
} from "../db/schema/schema";
import {
  and,
  cosineDistance,
  count,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import type * as trpcExpress from "@trpc/server/adapters/express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import Session from "supertokens-node/recipe/session";
import { OpenAIEmbeddings } from "@langchain/openai";
import { embeddings } from "../lib/ai";
import superjson from "superjson";

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
type Context = Awaited<ReturnType<typeof createContext>>;

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

const authenticatedProcedure = t.procedure.use(isAuthenticated);

export const publicProcedure = t.procedure;
export const router = t.router;

export const appRouter = router({
  tenders: publicProcedure
    .input(z.string().nullish())
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.select().from(dealBoard);
      return data;
    }),
  board: router({
    getAllByUser: authenticatedProcedure
      .input(z.string().nullish())
      .query(async ({ input, ctx }) => {
        const data = await ctx.db
          .select()
          .from(boards)
          .where(eq(boards.boardOwner, ctx.session.userId));
        return data;
      }),
    getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
      const data = await ctx.db.query.dealBoard.findMany({
        where: eq(dealBoard.board, input),
        with: {
          deal: {
            with: {
              lot: true,
            },
          },
          status: true,
        },
      });
      const statuses = await ctx.db.query.boardsStatuses.findMany({
        where: eq(boardsStatuses.board, input),
      });
      return {
        deals: data,
        statuses,
      };
    }),
    create: authenticatedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { name } = input;

        const board = await ctx.db
          .insert(boards)
          .values({ name, boardOwner: ctx.session.userId })
          .returning();
        const boardStatus = await ctx.db
          .insert(boardsStatuses)
          .values({ board: board[0].id, status: "Входящие", order: 0 })
          .returning();
        return board[0].id;
      }),
  }),
  deal: router({
    getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
      const res = await ctx.db.query.dealBoard.findFirst({
        where: eq(dealBoard.id, input),
        with: {
          deal: {
            with: {
              lot: true,
            },
          },
          board: true,
          status: true,
        },
      });
      return {
        deal: res?.deal,
        lot: res?.deal?.lot,
        board: res?.board,
        status: res?.status,
      };
    }),
  }),
  lot: router({
    getAllWithRecommendations: publicProcedure
      .input(
        z.object({
          page: z.number().min(1),
          limit: z.number().min(1).max(100),
          search: z.string().nullish(),
          withRecommendations: z.boolean().nullish(),
          minBudget: z.number().nullish(),
          maxBudget: z.number().nullish(),
        })
      )
      .query(async ({ input, ctx }) => {
        const offset = (input.page - 1) * input.limit;
        const embedding = await embeddings.embedQuery(input.search || "");
        const similarity = sql<number>`1 - (${cosineDistance(lots.embedding, embedding)})`;
        const data = await ctx.db.query.lots.findMany({
          where: (table, { inArray, gt, lt }) =>
            and(
              input.withRecommendations
                ? inArray(
                    table.id,
                    ctx.db
                      .select({ lotId: recommendedProducts.lotId })
                      .from(recommendedProducts)
                  )
                : undefined,
              gt(similarity, 0.5),
              input.minBudget ? gt(table.budget, input.minBudget) : undefined,
              input.maxBudget ? lt(table.budget, input.maxBudget) : undefined
            ),
          with: {
            recommendedProducts: {
              columns: {
                id: true,
              },
            },
          },
          limit: input.limit,
          orderBy: desc(similarity),
          offset: offset,
        });
        const hasMore = data.length === input.limit;

        return {
          lots: data,
          hasMore,
        };
      }),
    addToDealBoard: authenticatedProcedure
      .input(z.object({ lotId: z.number(), boardId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { lotId, boardId } = input;
        const statuses = await ctx.db
          .select()
          .from(boardsStatuses)
          .where(
            and(eq(boardsStatuses.board, boardId), eq(boardsStatuses.order, 0))
          );

        const deal = await ctx.db
          .insert(deals)
          .values({ lot: lotId, createdBy: ctx.session.userId })
          .returning();
        await ctx.db
          .insert(dealBoard)
          .values({ deal: deal[0].id, board: boardId, status: statuses[0].id });
        return deal[0].id;
      }),
    getById: publicProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const data = await ctx.db.query.lots.findFirst({
        where: eq(lots.id, input),
        with: {
          recommendedProducts: true,
        },
      });
      return data;
    }),
  }),
  recommendedProducts: router({
    getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
      const data = await ctx.db.query.recommendedProducts.findFirst({
        where: eq(recommendedProducts.id, Number.parseInt(input)),
      });
      return data;
    }),
  }),
});

export type AppRouter = typeof appRouter;
