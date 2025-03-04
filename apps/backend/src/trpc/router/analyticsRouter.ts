import { z } from "zod";
import { desc, eq, sql, cosineDistance, asc, gt, lt, and } from "drizzle-orm";
import { embeddings } from "../../lib/ai";
import { db } from "db/connection";
import {
  ktruCodes,
  ktruAnalytics,
  goszakupContracts,
  samrukContracts,
} from "db/schema";
import { router, publicProcedure } from "..";
import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

interface KtruSearchResult {
  id: string;
  code: string;
  nameRu: string | null;
  descriptionRu: string | null;
  source: string | null;
  similarity: number;
}

interface SamrukContractSearchResult {
  id: string;
  systemNumber: string | null;
  advertNumber: string | null;
  descriptionRu: string | null;
  contractSum: string | null;
  contractCardStatus: string | null;
  similarity: number;
}

const SIMILARITY_THRESHOLD = 0.4;

const analyzeKtruRelevance = async (
  query: string,
  ktruCodes: KtruSearchResult[],
) => {
  const prompt = `Given a user query: "${query}"
  
And these KTRU codes:
${ktruCodes
  .map(
    (code) => `- Code: ${code.code}
  Name: ${code.nameRu}
  Description: ${code.descriptionRu}
  Similarity: ${(code.similarity * 100).toFixed(1)}%`,
  )
  .join("\n")}

Analyze which KTRU codes are most relevant to the user's query. Return a JSON object with:
1. selectedIds: array of IDs of relevant KTRU codes
2. explanation: brief explanation of why these codes were selected

Only select codes that are truly relevant to the query. Consider both semantic similarity and business logic.`;

  const result = await generateText({
    model: deepseek("deepseek-coder-33b-instruct"),
    prompt,
    temperature: 0.1,
    maxTokens: 1000,
  });

  try {
    // Parse the result as JSON
    const parsedResult = JSON.parse(result.toString());
    return parsedResult;
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return {
      selectedIds: ktruCodes.slice(0, 5).map((k) => k.id),
      explanation: "Fallback: Selected top 5 most similar codes",
    };
  }
};

const analyzeSamrukContractRelevance = async (
  query: string,
  contracts: SamrukContractSearchResult[],
) => {
  const prompt = `Given a user query: "${query}"
  
And these Samruk contracts:
${contracts
  .map(
    (contract) => `- ID: ${contract.id}
  Number: ${contract.systemNumber || contract.advertNumber || "Not specified"}
  Description: ${contract.descriptionRu || "Not specified"}
  Sum: ${contract.contractSum || "Not specified"}
  Status: ${contract.contractCardStatus || "Not specified"}
  Similarity: ${(contract.similarity * 100).toFixed(1)}%`,
  )
  .join("\n")}

Analyze which Samruk contracts are most relevant to the user's query. Return a JSON object with:
1. selectedIds: array of IDs of relevant contracts
2. explanation: brief explanation of why these contracts were selected

Only select contracts that are truly relevant to the query. Consider both semantic similarity and business logic.`;

  const result = await generateText({
    model: deepseek("deepseek-coder-33b-instruct"),
    prompt,
    temperature: 0.1,
    maxTokens: 1000,
  });

  try {
    // Parse the result as JSON
    const parsedResult = JSON.parse(result.toString());
    return parsedResult;
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return {
      selectedIds: contracts.slice(0, 5).map((c) => c.id),
      explanation: "Fallback: Selected top 5 most similar contracts",
    };
  }
};

export const analyticsRouter = router({
  searchSimilarKtruCodes: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(50),
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
          nameRu: ktruCodes.nameRu,
          descriptionRu: ktruCodes.descriptionRu,
          source: ktruCodes.source,
          similarity,
        })
        .from(ktruCodes)
        .where(sql`${similarity} >= ${SIMILARITY_THRESHOLD}`)
        .orderBy(desc(similarity))
        .limit(input.limit);

      // Use AI to analyze and select relevant codes
      const analysis = await analyzeKtruRelevance(
        input.query,
        similarKtruCodes,
      );

      // Filter and return only the selected codes
      return similarKtruCodes.filter((code) =>
        analysis.selectedIds.includes(code.id),
      );
    }),

  // New procedure for searching similar Samruk contracts
  searchSimilarSamrukContracts: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(50),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.query) {
        return [];
      }

      const embedding = await embeddings.embedQuery(input.query);
      const similarity = sql<number>`1 - (${cosineDistance(samrukContracts.embedding, embedding)})`;

      const similarSamrukContracts = await db
        .select({
          id: samrukContracts.id,
          systemNumber: samrukContracts.systemNumber,
          advertNumber: samrukContracts.advertNumber,
          descriptionRu: samrukContracts.descriptionRu,
          contractSum: samrukContracts.contractSum,
          contractCardStatus: samrukContracts.contractCardStatus,
          similarity,
        })
        .from(samrukContracts)
        .where(sql`${similarity} >= ${SIMILARITY_THRESHOLD}`)
        .orderBy(desc(similarity))
        .limit(input.limit);

      // Use AI to analyze and select relevant contracts
      const analysis = await analyzeSamrukContractRelevance(
        input.query,
        similarSamrukContracts,
      );

      // Filter and return only the selected contracts
      return similarSamrukContracts.filter((contract) =>
        analysis.selectedIds.includes(contract.id),
      );
    }),

  searchExactKtruCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.code) {
        return [];
      }

      // Remove any whitespace from the input
      const cleanCode = input.code.replace(/\s+/g, "");

      // If the input is just numbers (6 or more digits), use LIKE query
      if (/^\d{6,}$/.test(cleanCode)) {
        const exactKtruCode = await db
          .select({
            id: ktruCodes.id,
            code: ktruCodes.code,
            name: ktruCodes.nameRu,
            description: ktruCodes.descriptionRu,
            source: ktruCodes.source,
          })
          .from(ktruCodes)
          .where(sql`${ktruCodes.code} LIKE ${`%${cleanCode}%`}`)
          .limit(10);

        return exactKtruCode;
      }

      // For formatted codes, try exact match first
      const exactKtruCode = await db
        .select({
          id: ktruCodes.id,
          code: ktruCodes.code,
          name: ktruCodes.nameRu,
          description: ktruCodes.descriptionRu,
          source: ktruCodes.source,
        })
        .from(ktruCodes)
        .where(eq(ktruCodes.code, cleanCode))
        .limit(1);

      // If no exact match found, try partial match
      if (exactKtruCode.length === 0) {
        const partialMatches = await db
          .select({
            id: ktruCodes.id,
            code: ktruCodes.code,
            name: ktruCodes.nameRu,
            description: ktruCodes.descriptionRu,
            source: ktruCodes.source,
          })
          .from(ktruCodes)
          .where(sql`${ktruCodes.code} LIKE ${`%${cleanCode}%`}`)
          .limit(10);

        return partialMatches;
      }

      return exactKtruCode;
    }),

  // New procedure for searching exact Samruk contract by number
  searchExactSamrukContract: publicProcedure
    .input(
      z.object({
        number: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.number) {
        return [];
      }

      // Remove any whitespace from the input
      const cleanNumber = input.number.replace(/\s+/g, "");

      // Try to find by system number first
      const exactSystemNumberMatch = await db
        .select({
          id: samrukContracts.id,
          systemNumber: samrukContracts.systemNumber,
          advertNumber: samrukContracts.advertNumber,
          descriptionRu: samrukContracts.descriptionRu,
          contractSum: samrukContracts.contractSum,
          contractCardStatus: samrukContracts.contractCardStatus,
        })
        .from(samrukContracts)
        .where(eq(samrukContracts.systemNumber, cleanNumber))
        .limit(1);

      if (exactSystemNumberMatch.length > 0) {
        return exactSystemNumberMatch;
      }

      // Then try by advert number
      const exactAdvertNumberMatch = await db
        .select({
          id: samrukContracts.id,
          systemNumber: samrukContracts.systemNumber,
          advertNumber: samrukContracts.advertNumber,
          descriptionRu: samrukContracts.descriptionRu,
          contractSum: samrukContracts.contractSum,
          contractCardStatus: samrukContracts.contractCardStatus,
        })
        .from(samrukContracts)
        .where(eq(samrukContracts.advertNumber, cleanNumber))
        .limit(1);

      if (exactAdvertNumberMatch.length > 0) {
        return exactAdvertNumberMatch;
      }

      // If no exact match found, try partial match on both fields
      const partialMatches = await db
        .select({
          id: samrukContracts.id,
          systemNumber: samrukContracts.systemNumber,
          advertNumber: samrukContracts.advertNumber,
          descriptionRu: samrukContracts.descriptionRu,
          contractSum: samrukContracts.contractSum,
          contractCardStatus: samrukContracts.contractCardStatus,
        })
        .from(samrukContracts)
        .where(
          sql`${samrukContracts.systemNumber} LIKE ${`%${cleanNumber}%`} OR ${samrukContracts.advertNumber} LIKE ${`%${cleanNumber}%`}`,
        )
        .limit(10);

      return partialMatches;
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

  // New procedure for getting Samruk contract details
  getSamrukContractDetails: publicProcedure
    .input(
      z.object({
        contractId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const contract = await db
        .select()
        .from(samrukContracts)
        .where(eq(samrukContracts.id, input.contractId))
        .limit(1);

      if (contract.length === 0) {
        throw new Error("Samruk contract not found");
      }

      return contract[0];
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

  // New procedure for getting top Samruk contracts by sum
  getTopSamrukContractsBySum: publicProcedure.query(async () => {
    const results = await db
      .select({
        id: samrukContracts.id,
        systemNumber: samrukContracts.systemNumber,
        advertNumber: samrukContracts.advertNumber,
        descriptionRu: samrukContracts.descriptionRu,
        contractSum: samrukContracts.contractSum,
        contractCardStatus: samrukContracts.contractCardStatus,
        localContentProjectedShare: samrukContracts.localContentProjectedShare,
      })
      .from(samrukContracts)
      .where(lt(samrukContracts.localContentProjectedShare, 50))
      .orderBy(desc(sql`cast(${samrukContracts.contractSum} as float)`))
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

  // New procedure for getting Samruk contract analytics
  getSamrukContractAnalytics: publicProcedure
    .input(
      z.object({
        contractIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.contractIds.length === 0) {
        return null;
      }

      // Get contract details first
      const contractDetails = await db
        .select()
        .from(samrukContracts)
        .where(
          sql`${samrukContracts.id} = ANY(ARRAY[${sql.join(
            input.contractIds.map((id) => sql`${id}`),
            sql`, `,
          )}])`,
        );

      // Calculate aggregated stats
      const totalStats = {
        contractCount: contractDetails.length,
        totalSum: contractDetails.reduce(
          (sum, c) => sum + (parseFloat(c.contractSum) || 0),
          0,
        ),
        averageLocalShare:
          contractDetails.length > 0
            ? contractDetails.reduce(
                (sum, c) => sum + (c.localContentProjectedShare || 0),
                0,
              ) / contractDetails.length
            : 0,
      };

      // Group by month
      const monthlyStats = contractDetails.reduce(
        (acc, contract) => {
          if (!contract.contractDate) return acc;

          const month = new Date(contract.contractDate)
            .toISOString()
            .slice(0, 7);
          const existing = acc.find((m) => m.month === month);
          const contractSum = parseFloat(contract.contractSum) || 0;

          if (existing) {
            existing.contractCount += 1;
            existing.totalSum += contractSum;
            existing.averageLocalShare =
              (existing.averageLocalShare * (existing.contractCount - 1) +
                (contract.localContentProjectedShare || 0)) /
              existing.contractCount;
          } else {
            acc.push({
              month,
              contractCount: 1,
              totalSum: contractSum,
              averageLocalShare: contract.localContentProjectedShare || 0,
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
      const yearlyStats = contractDetails.reduce(
        (acc, contract) => {
          if (!contract.contractDate) return acc;

          const year = new Date(contract.contractDate).getFullYear().toString();
          const existing = acc.find((y) => y.year === year);
          const contractSum = parseFloat(contract.contractSum) || 0;

          if (existing) {
            existing.contractCount += 1;
            existing.totalSum += contractSum;
            existing.averageLocalShare =
              (existing.averageLocalShare * (existing.contractCount - 1) +
                (contract.localContentProjectedShare || 0)) /
              existing.contractCount;
          } else {
            acc.push({
              year,
              contractCount: 1,
              totalSum: contractSum,
              averageLocalShare: contract.localContentProjectedShare || 0,
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
        selectedContracts: contractDetails.map((c) => ({
          id: c.id,
          number: c.systemNumber || c.advertNumber,
          description: c.descriptionRu,
          sum: c.contractSum,
          status: c.contractCardStatus,
        })),
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
