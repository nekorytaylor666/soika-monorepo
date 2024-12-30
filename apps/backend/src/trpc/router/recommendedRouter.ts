import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "..";
import { recommendedProducts } from "db/schema";

export const recommendedProductsRouter = router({
  getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const data = await ctx.db.query.recommendedProducts.findFirst({
      where: eq(recommendedProducts.id, Number.parseInt(input)),
    });
    return data;
  }),
});
