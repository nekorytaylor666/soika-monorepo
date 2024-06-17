import { eq } from "drizzle-orm";
import { z } from "zod";
import { boards } from "../db/schema/schema";
import { publicProcedure, router } from "./appRouter";

export const boardRouter = router({
  getAllByUserId: publicProcedure
    .input(z.string().nullish())
    .query(async ({ input, ctx }) => {
      const data = await ctx.db
        .select()
        .from(boards)
        .where(eq(boards.boardOwner, ctx.user.sub));
      return data;
    }),
  getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    console.log(input);
    const data = await ctx.db.select().from(boards).where(eq(boards.id, input));
    return data;
  }),
});
