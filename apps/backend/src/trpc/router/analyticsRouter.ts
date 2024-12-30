import { z } from "zod";
import { desc, eq, sql, cosineDistance, asc, gt, lt, and } from "drizzle-orm";
import { embeddings } from "../../lib/ai";
import { db } from "db/connection";
import { ktruCodes, ktruAnalytics, goszakupContracts } from "db/schema/schema";
import { router, publicProcedure } from "..";

interface KtruSearchResult {
  id: string;
  code: string;
  nameRu: string | null;
  descriptionRu: string | null;
  similarity: number;
}

const SIMILARITY_THRESHOLD = 0.4;

export const analyticsRouter = router({
  searchSimilarKtruCodes: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(10),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.query) {
        return [];
      }

      const embedding = await embeddings.embedQuery(input.query);
      const similarity = sql<number>`1 - (${cosineDistance(ktruCodes.embedding, embedding)})`;

      const similarKtruCodes = await db
        .select({
          id: ktruCodes.id,
          code: ktruCodes.code,
          name: ktruCodes.nameRu,
          description: ktruCodes.descriptionRu,
          similarity,
        })
        .from(ktruCodes)
        .where(sql`${similarity} >= ${SIMILARITY_THRESHOLD}`)
        .orderBy(desc(similarity))
        .limit(input.limit);

      return similarKtruCodes;
    }),

  getKtruCodeStats: publicProcedure
    .input(
      z.object({
        ktruCodeId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const stats = await db.query.ktruAnalytics.findFirst({
        where: eq(ktruAnalytics.id, input.ktruCodeId),
      });

      return stats;
    }),

  getTopKtruByContractSum: publicProcedure.query(async () => {
    const results = await db
      .select({
        id: ktruCodes.id,
        code: ktruCodes.code,
        nameRu: ktruCodes.nameRu,
        descriptionRu: ktruCodes.descriptionRu,
        totalContractSum: sql<number>`sum(cast(${goszakupContracts.contractSum} as float))`,
        contractCount: sql<number>`count(*)`,
        averageLocalShare: sql<number>`avg(${goszakupContracts.localContentProjectedShare})`,
      })
      .from(goszakupContracts)
      .innerJoin(ktruCodes, eq(goszakupContracts.ktruCodeId, ktruCodes.id))
      .where(lt(goszakupContracts.localContentProjectedShare, 50))
      .groupBy(
        ktruCodes.code,
        ktruCodes.nameRu,
        ktruCodes.descriptionRu,
        ktruCodes.id,
      )
      .orderBy(desc(sql`sum(cast(${goszakupContracts.contractSum} as float))`))
      .limit(500);

    return results;
  }),

  getKtruDetails: publicProcedure
    .input(
      z.object({
        ktruCode: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const ktruCode = await db.query.ktruCodes.findFirst({
        where: eq(ktruCodes.id, input.ktruCode),
      });

      if (!ktruCode) {
        throw new Error("KTRU code not found");
      }

      // Get all contracts for this KTRU code
      const contracts = await db
        .select({
          contractSum: sql<number>`COALESCE(NULLIF(${goszakupContracts.contractSum}, ''), '0')::float`,
          localShare: goszakupContracts.localContentProjectedShare,
          contractDate: goszakupContracts.createdAt,
        })
        .from(goszakupContracts)
        .where(
          and(
            eq(goszakupContracts.ktruCodeId, ktruCode.id),
            sql`${goszakupContracts.createdAt} IS NOT NULL`,
          ),
        )
        .orderBy(goszakupContracts.createdAt);

      // Calculate total stats
      const totalStats = {
        contractCount: contracts.length,
        totalSum: contracts.reduce((sum, c) => sum + (c.contractSum || 0), 0),
        averageLocalShare:
          contracts.length > 0
            ? contracts.reduce((sum, c) => sum + (c.localShare || 0), 0) /
              contracts.length
            : 0,
      };

      // Group by month
      const monthlyStats = contracts.reduce(
        (acc, contract) => {
          if (!contract.contractDate) return acc;

          const month = new Date(contract.contractDate)
            .toISOString()
            .slice(0, 7);
          const existing = acc.find((m) => m.month === month);

          if (existing) {
            existing.contractCount += 1;
            existing.totalSum += contract.contractSum || 0;
            existing.averageLocalShare =
              (existing.averageLocalShare * (existing.contractCount - 1) +
                (contract.localShare || 0)) /
              existing.contractCount;
          } else {
            acc.push({
              month,
              contractCount: 1,
              totalSum: contract.contractSum || 0,
              averageLocalShare: contract.localShare || 0,
            });
          }

          return acc;
        },
        [] as Array<{
          month: string;
          contractCount: number;
          totalSum: number;
          averageLocalShare: number;
        }>,
      );

      // Group by year
      const yearlyStats = contracts.reduce(
        (acc, contract) => {
          if (!contract.contractDate) return acc;

          const year = new Date(contract.contractDate).getFullYear().toString();
          const existing = acc.find((y) => y.year === year);

          if (existing) {
            existing.contractCount += 1;
            existing.totalSum += contract.contractSum || 0;
            existing.averageLocalShare =
              (existing.averageLocalShare * (existing.contractCount - 1) +
                (contract.localShare || 0)) /
              existing.contractCount;
          } else {
            acc.push({
              year,
              contractCount: 1,
              totalSum: contract.contractSum || 0,
              averageLocalShare: contract.localShare || 0,
            });
          }

          return acc;
        },
        [] as Array<{
          year: string;
          contractCount: number;
          totalSum: number;
          averageLocalShare: number;
        }>,
      );

      // Log for debugging
      console.log("Contracts found:", contracts.length);
      console.log("Sample contract:", contracts[0]);
      console.log("Monthly stats:", monthlyStats.length);
      console.log("Yearly stats:", yearlyStats.length);

      return {
        code: ktruCode.code,
        name: ktruCode.nameRu,
        description: ktruCode.descriptionRu,
        totalStats,
        monthlyStats: monthlyStats.sort((a, b) =>
          a.month.localeCompare(b.month),
        ),
        yearlyStats: yearlyStats.sort((a, b) => a.year.localeCompare(b.year)),
      };
    }),

  getSimilarKtruGroupAnalytics: publicProcedure
    .input(
      z.object({
        query: z.string(),
        ktruIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.query || input.ktruIds.length === 0) {
        return null;
      }

      // Get KTRU details first
      const ktruDetails = await db
        .select({
          id: ktruCodes.id,
          code: ktruCodes.code,
          name: ktruCodes.nameRu,
          description: ktruCodes.descriptionRu,
        })
        .from(ktruCodes)
        .where(
          sql`${ktruCodes.id} = ANY(ARRAY[${sql.join(
            input.ktruIds.map((id) => sql`${id}::uuid`),
            sql`, `,
          )}])`,
        );

      // Get contracts for selected KTRU codes
      const contracts = await db
        .select({
          contractSum: sql<number>`COALESCE(NULLIF(${goszakupContracts.contractSum}, ''), '0')::float`,
          localShare: goszakupContracts.localContentProjectedShare,
          contractDate: goszakupContracts.createdAt,
          ktruCodeId: goszakupContracts.ktruCodeId,
        })
        .from(goszakupContracts)
        .where(
          and(
            sql`${goszakupContracts.ktruCodeId} = ANY(ARRAY[${sql.join(
              input.ktruIds.map((id) => sql`${id}::uuid`),
              sql`, `,
            )}])`,
            sql`${goszakupContracts.createdAt} IS NOT NULL`,
          ),
        )
        .orderBy(goszakupContracts.createdAt);

      // Calculate per-KTRU stats
      const ktruStats = ktruDetails.map((ktru) => {
        const ktruContracts = contracts.filter((c) => c.ktruCodeId === ktru.id);
        return {
          ...ktru,
          contractCount: ktruContracts.length,
          totalSum: ktruContracts.reduce(
            (sum, c) => sum + (c.contractSum || 0),
            0,
          ),
          averageLocalShare:
            ktruContracts.length > 0
              ? ktruContracts.reduce((sum, c) => sum + (c.localShare || 0), 0) /
                ktruContracts.length
              : 0,
        };
      });

      // Calculate aggregated stats
      const totalStats = {
        ktruCodesCount: input.ktruIds.length,
        contractCount: contracts.length,
        totalSum: contracts.reduce((sum, c) => sum + (c.contractSum || 0), 0),
        averageLocalShare:
          contracts.length > 0
            ? contracts.reduce((sum, c) => sum + (c.localShare || 0), 0) /
              contracts.length
            : 0,
      };

      // Calculate monthly stats
      const monthlyStats = contracts.reduce(
        (acc, contract) => {
          if (!contract.contractDate) return acc;

          const month = new Date(contract.contractDate)
            .toISOString()
            .slice(0, 7);
          const existing = acc.find((m) => m.month === month);

          if (existing) {
            existing.contractCount += 1;
            existing.totalSum += contract.contractSum || 0;
            existing.averageLocalShare =
              (existing.averageLocalShare * (existing.contractCount - 1) +
                (contract.localShare || 0)) /
              existing.contractCount;
          } else {
            acc.push({
              month,
              contractCount: 1,
              totalSum: contract.contractSum || 0,
              averageLocalShare: contract.localShare || 0,
            });
          }

          return acc;
        },
        [] as Array<{
          month: string;
          contractCount: number;
          totalSum: number;
          averageLocalShare: number;
        }>,
      );

      // Calculate yearly stats
      const yearlyStats = contracts.reduce(
        (acc, contract) => {
          if (!contract.contractDate) return acc;

          const year = new Date(contract.contractDate).getFullYear().toString();
          const existing = acc.find((y) => y.year === year);

          if (existing) {
            existing.contractCount += 1;
            existing.totalSum += contract.contractSum || 0;
            existing.averageLocalShare =
              (existing.averageLocalShare * (existing.contractCount - 1) +
                (contract.localShare || 0)) /
              existing.contractCount;
          } else {
            acc.push({
              year,
              contractCount: 1,
              totalSum: contract.contractSum || 0,
              averageLocalShare: contract.localShare || 0,
            });
          }

          return acc;
        },
        [] as Array<{
          year: string;
          contractCount: number;
          totalSum: number;
          averageLocalShare: number;
        }>,
      );

      return {
        similarKtruCodes: input.ktruIds,
        totalStats,
        monthlyStats: monthlyStats.sort((a, b) =>
          a.month.localeCompare(b.month),
        ),
        yearlyStats: yearlyStats.sort((a, b) => a.year.localeCompare(b.year)),
        ktruStats,
      };
    }),
});