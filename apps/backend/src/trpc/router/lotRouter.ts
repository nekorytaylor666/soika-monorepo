import { and, cosineDistance, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure, router } from "..";
import {
  boardsStatuses,
  dealBoard,
  deals,
  lots,
  recommendedProducts,
  tradeMethods,
} from "../../db/schema/schema";
import { embeddings } from "../../lib/ai";

export const lotRouter = router({
  getTradeMethods: publicProcedure.query(async ({ ctx }) => {
    const data = await ctx.db.select().from(tradeMethods);
    return data;
  }),
  getAllWithRecommendations: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
        limit: z.number().min(1).max(100),
        search: z.string().nullish(),
        withRecommendations: z.boolean().nullish(),
        minBudget: z.number().nullish(),
        maxBudget: z.number().nullish(),
        tradeMethod: z.number().nullish(),
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
            input.maxBudget ? lt(table.budget, input.maxBudget) : undefined,
            input.tradeMethod
              ? sql`ref_trade_methods ->> 'id' = ${input.tradeMethod}`
              : undefined
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
});
