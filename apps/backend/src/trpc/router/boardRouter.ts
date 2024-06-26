import { eq } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure, router } from "..";
import { boards, boardsStatuses, dealBoard } from "../../db/schema/schema";

export const boardRouter = router({
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
});
