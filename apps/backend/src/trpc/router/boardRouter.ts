import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure, router } from "..";
import { boards, boardsStatuses, dealBoard } from "db/schema";

export const boardRouter = router({
  getAllByUser: authenticatedProcedure
    .input(z.string().nullish())
    .query(async ({ input, ctx }) => {
      // const data = await ctx.db.query.boards.findMany({
      //   where: eq(boards.boardOwner, ctx.session.userId),
      //   with: {
      //     deals: true,
      //   },
      // });
      const data = await ctx.db.query.boards.findMany({
        where: eq(boards.boardOwner, ctx.session.userId),
        with: {
          deals: true,
        },
      });
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
      where: and(
        eq(boardsStatuses.board, input),
        eq(boardsStatuses.isArchived, false),
      ),
    });
    return {
      deals: data,
      statuses,
    };
  }),
  getAllBoards: publicProcedure.query(async ({ ctx }) => {
    const data = await ctx.db.query.boards.findMany();
    return data;
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
  createBoardColumn: authenticatedProcedure
    .input(z.object({ boardId: z.string(), columnName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { boardId, columnName } = input;

      console.log(boardId);
      const board = await ctx.db.query.boards.findFirst({
        where: eq(boards.id, boardId),
        with: {
          statuses: true,
        },
      });
      console.log(board);
      if (!board) {
        throw new Error("Board not found");
      }
      const column = await ctx.db
        .insert(boardsStatuses)
        .values({
          board: boardId,
          status: columnName,
          order: board.statuses.length,
        })
        .returning();
      return column;
    }),
  updateColumnOrder: authenticatedProcedure
    .input(
      z.object({
        boardId: z.string(),
        columnOrders: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { boardId, columnOrders } = input;
      console.log(boardId, columnOrders);

      // Update the order of columns in a single transaction
      await ctx.db.transaction(async (tx) => {
        for (const { id, order } of columnOrders) {
          await tx
            .update(boardsStatuses)
            .set({ order })
            .where(
              sql`${boardsStatuses.id} = ${id} AND ${boardsStatuses.board} = ${boardId}`,
            );
        }
      });

      return { success: true };
    }),
  archiveBoardStatus: authenticatedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(boardsStatuses)
        .set({ isArchived: true })
        .where(eq(boardsStatuses.id, input));
    }),
});
