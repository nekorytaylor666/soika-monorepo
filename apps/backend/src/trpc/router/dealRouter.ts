import { eq } from "drizzle-orm";
import { addTaskSchema } from "frontend/src/components/tasks/AddTaskForm";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure, router } from "..";
import {
  type TaskStatus,
  boards,
  dealBoard,
  dealTasks,
  deals,
} from "db/schema/schema";

export const dealRouter = router({
  getByDealBoardId: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const res = await ctx.db.query.dealBoard.findFirst({
        where: eq(dealBoard.id, input),
        with: {
          deal: {
            with: {
              lot: {
                with: {
                  recommendedProducts: true,
                },
              },
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
  getById: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const res = await ctx.db.query.deals.findFirst({
      where: eq(deals.id, input),
      with: {
        lot: true,
        tasks: true,
      },
    });
    return res;
  }),
  moveDealToStatus: authenticatedProcedure
    .input(z.object({ dealId: z.string(), newStatus: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { dealId, newStatus } = input;
      const deal = await ctx.db
        .update(dealBoard)
        .set({ status: newStatus })
        .where(eq(dealBoard.deal, dealId));
      return { message: deal };
    }),
  getTasks: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const res = await ctx.db.query.dealTasks.findMany({
      where: eq(dealTasks.deal, input),
    });
    return res;
  }),
  createTask: authenticatedProcedure
    .input(z.object({ dealId: z.string(), data: addTaskSchema }))
    .mutation(async ({ input, ctx }) => {
      console.log(ctx.session);
      const { dealId, data } = input;
      const res = await ctx.db.insert(dealTasks).values({
        ...data,
        // TODO: add organization system for good assigned proccess
        assignedTo: ctx.session.userId,
        assignedAt: new Date(),
        assignedBy: ctx.session.userId,
        name: data.title,
        deal: dealId,
        createdBy: ctx.session.userId,
      });
      return res;
    }),
  getTasksAssignedToMe: authenticatedProcedure.query(async ({ ctx }) => {
    const res = await ctx.db.query.dealTasks.findMany({
      where: eq(dealTasks.assignedTo, ctx.session.userId),
    });
    return res;
  }),
  updateTaskStatus: authenticatedProcedure
    .input(z.object({ taskId: z.string(), status: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { taskId, status } = input;
      const res = await ctx.db
        .update(dealTasks)
        .set({ status: status as TaskStatus })
        .where(eq(dealTasks.id, taskId));
      return res;
    }),
  getBoardData: publicProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ input, ctx }) => {
      const boardData = await ctx.db.query.boards.findFirst({
        where: eq(boards.id, input.boardId),
        with: {
          statuses: true,
          deals: {
            with: {
              deal: {
                with: {
                  lot: {
                    columns: {
                      budget: true,
                      lotName: true,
                      lotDescription: true,
                      lotAdditionalDescription: true,
                      lotNumber: true,
                      lotSpecifications: true,
                      deliveryTerm: true,
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!boardData) {
        throw new Error("Board not found");
      }

      return {
        statuses: boardData.statuses,
        deals: boardData.deals,
      };
    }),
  getTaskById: authenticatedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const task = await ctx.db.query.dealTasks.findFirst({
        where: eq(dealTasks.id, input),
        with: {
          deal: true,
        },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      return task;
    }),
  editTaskById: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const updatedTask = await ctx.db
        .update(dealTasks)
        .set(updateData)
        .where(eq(dealTasks.id, id))
        .returning();

      if (updatedTask.length === 0) {
        throw new Error("Task not found or update failed");
      }

      return updatedTask[0];
    }),
});
