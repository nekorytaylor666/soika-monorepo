import { z } from "zod";
import { publicProcedure, router } from "..";
import { dealBoard } from "../../db/schema/schema";

export const tendersRouter = router({
  getAll: publicProcedure
    .input(z.string().nullish())
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.select().from(dealBoard);
      return data;
    }),
});
