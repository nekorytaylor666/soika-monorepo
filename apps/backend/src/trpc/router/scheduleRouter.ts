import { z } from "zod";
import { authenticatedProcedure, publicProcedure, router } from "..";
import {
  scheduleFrequencyEnum,
  scheduleFrequencyEnumSchema,
  schedules,
} from "db/schema";
import { eq } from "drizzle-orm";

export const scheduleRouter = router({
  //TODO organisation management
  getAll: authenticatedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input, ctx }) => {
      const data = await ctx.db.query.schedules.findMany({
        where: (schedules) =>
          eq(schedules.organizationId, input.organizationId),
      });
      return data;
    }),
  create: authenticatedProcedure
    .input(
      z.object({
        query: z.string(),
        frequency: scheduleFrequencyEnumSchema,
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.db.insert(schedules).values({
        ...input,
        createdBy: ctx.session.userId,
        organizationId: input.organizationId,
      });
      return data;
    }),
  edit: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        query: z.string(),
        frequency: scheduleFrequencyEnumSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.db
        .update(schedules)
        .set({ query: input.query, frequency: input.frequency })
        .where(eq(schedules.id, input.id));
      return data;
    }),
  delete: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.db
        .delete(schedules)
        .where(eq(schedules.id, input.id));
      return data;
    }),
});
