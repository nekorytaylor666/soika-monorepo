import { eq } from "drizzle-orm";
import { authenticatedProcedure, router, t } from "..";
import {
  onboarding,
  profile,
  organizations,
  organizationMembers,
} from "db/schema/schema";
import { z } from "zod";

export const userRouter = router({
  getUser: authenticatedProcedure.query(async ({ ctx }) => {
    const data = await ctx.db.query.profile.findFirst({
      where: eq(profile.id, ctx.session.userId),
      with: {
        organizations: true,
      },
    });
    return data;
  }),
  isOnboarded: authenticatedProcedure.query(async ({ ctx }) => {
    const data = await ctx.db.query.onboarding.findFirst({
      where: eq(onboarding.userId, ctx.session.userId),
    });
    return data;
  }),
  postSignup: authenticatedProcedure.query(async ({ ctx }) => {
    const data = await ctx.db
      .insert(onboarding)
      .values({ userId: ctx.session.userId });
    return data;
  }),
  updateUser: authenticatedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.db
        .update(profile)
        .set(input)
        .where(eq(profile.id, ctx.session.userId));
      return data;
    }),

  createOrganizationAndCompleteOnboarding: authenticatedProcedure
    .input(
      z.object({
        name: z.string(),
        organizationName: z.string(),
        bin: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Start a transaction
      return await ctx.db.transaction(async (tx) => {
        // Update the user's name
        await tx
          .update(profile)
          .set({ name: input.name })
          .where(eq(profile.id, ctx.session.userId));

        // Create the organization
        const [newOrg] = await tx
          .insert(organizations)
          .values({
            name: input.organizationName,
            bin: input.bin,
            ownerId: ctx.session.userId,
          })
          .returning();

        // Add the user as a member of the organization
        await tx.insert(organizationMembers).values({
          organizationId: newOrg.id,
          profileId: ctx.session.userId,
          role: "owner", // Assuming the creator is the owner
        });

        // Update the onboarding status
        await tx.insert(onboarding).values({
          userId: ctx.session.userId,
          completed: true,
        });

        return { organization: newOrg };
      });
    }),
});
