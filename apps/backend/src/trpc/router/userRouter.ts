import { eq } from "drizzle-orm";
import { authenticatedProcedure, router } from "..";
import { profile } from "../../db/schema/schema";

export const userRouter = router({
  getUser: authenticatedProcedure.query(async ({ ctx }) => {
    const data = await ctx.db
      .select()
      .from(profile)
      .where(eq(profile.id, ctx.session.userId));
    return data;
  }),
});
