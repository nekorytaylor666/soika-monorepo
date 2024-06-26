import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "..";
import { dealBoard } from "../../db/schema/schema";

export const dealRouter = router({
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
});
