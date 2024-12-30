import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "..";
import { recommendedLots, recommendedProducts } from "db/schema";

export const recommendedLotsRouter = router({
  getResults: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.query.recommendedLots.findMany({
        where: eq(recommendedLots.organizationId, input.organizationId),
      });
      return data;
    }),
  getFreshResults: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.query.recommendedLots.findMany({
        where: eq(recommendedLots.organizationId, input.organizationId),
        orderBy: [desc(recommendedLots.createdAt)],
        limit: 1,
      });
      return data[0];
    }),
  getResultById: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.query.recommendedLots.findFirst({
        where: eq(recommendedLots.id, input),
      });
      return data;
    }),
  getListById: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.query.recommendedLots.findFirst({
        where: eq(recommendedLots.id, input),
      });
      return data;
    }),
  getLotByResultAndLotId: publicProcedure
    .input(
      z.object({
        recommendedId: z.string(),
        lotId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.query.recommendedLots.findFirst({
        where: eq(recommendedLots.id, input.recommendedId),
      });
      if (!data) {
        return null;
      }
      const lot = data.results.find(
        (lot) => lot.original_lot.id == input.lotId,
      );
      return lot;
    }),
});
