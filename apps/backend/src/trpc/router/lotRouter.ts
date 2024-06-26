import { CohereRerank } from "@langchain/cohere";
import { CohereClient } from "cohere-ai";
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
const cohereRerank = new CohereRerank({
  apiKey: process.env.COHERE_API_KEY, // Default
  topN: 100, // Default
  model: "rerank-multilingual-v3.0", // Default
});

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
      if (!input.search) {
        return {
          lots: [],
          rerank: [],
          hasMore: false,
        };
      }
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
            gt(similarity, 0.8),
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
        limit: 100,
        orderBy: desc(similarity),
        offset: offset,
      });
      const documents = data.map((lot) => ({
        pageContent: `${lot.lotName} ${lot.lotDescription} ${lot.lotAdditionalDescription}`,
        metadata: lot,
      }));

      const hasMore = data.length === input.limit;

      const rerank = await cohereRerank.compressDocuments(
        documents,
        input.search || ""
      );

      console.log(rerank);

      return {
        lots: rerank.map((el) => el.metadata),
        rerank: rerank.map((el) => el.metadata),
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
