import { z } from "zod";
import {
  desc,
  eq,
  sql,
  cosineDistance,
  asc,
  gt,
  lt,
  and,
  inArray,
  count,
} from "drizzle-orm";
import { embeddings } from "../../lib/ai";
import { db } from "db/connection";
import {
  ktruCodes,
  ktruAnalytics,
  goszakupContracts,
  samrukContracts as samrukContractsTable,
  samrukContracts,
  ktruGroups,
  ktruSubgroups,
} from "db/schema";
import { router, publicProcedure } from "..";
import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse";
import xlsx from "node-xlsx";

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

interface GroupAnalytics {
  id: string;
  code: string;
  nameRu: string;
  totalSum: number;
  contractCount: number;
  averageLocalShare: number;
  subgroups: SubgroupAnalytics[];
}

interface SubgroupAnalytics {
  id: string;
  code: string;
  nameRu: string;
  totalSum: number;
  contractCount: number;
  averageLocalShare: number;
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
    model: openai("gpt-4o-mini"),
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
    model: openai("gpt-4o-mini"),
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
  searchKtruCodes: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(10),
        source: z.enum(["goszakup", "samruk"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.query) {
        return { selectedKtrus: [] };
      }

      const embedding = await embeddings.embedQuery(input.query);
      const similarity = sql<number>`1 - (${cosineDistance(ktruCodes.embedding, embedding)})`;

      // Build the query with optional source filter
      let query = db
        .select({
          id: ktruCodes.id,
          code: ktruCodes.code,
          nameRu: ktruCodes.nameRu,
          descriptionRu: ktruCodes.descriptionRu,
          source: ktruCodes.source,
          similarity,
        })
        .from(ktruCodes)
        .where(sql`${similarity} >= ${SIMILARITY_THRESHOLD}`);

      // Add source filter if specified
      if (input.source) {
        query = query.where(eq(ktruCodes.source, input.source));
      }

      const similarKtruCodes = await query
        .orderBy(desc(similarity))
        .limit(input.limit);

      if (similarKtruCodes.length === 0) {
        return { selectedKtrus: [] };
      }

      // Analyze relevance
      const relevantKtruCodes = await analyzeKtruRelevance(
        input.query,
        similarKtruCodes,
      );

      return {
        selectedKtrus: relevantKtruCodes.map((ktru) => ({
          id: ktru.id,
          name: ktru.nameRu,
          description: ktru.descriptionRu,
          code: ktru.code,
          source: ktru.source || "goszakup",
        })),
      };
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
      const similarity = sql<number>`1 - (${cosineDistance(samrukContractsTable.embedding, embedding)})`;

      const similarSamrukContracts = await db
        .select({
          id: samrukContractsTable.id,
          systemNumber: samrukContractsTable.systemNumber,
          advertNumber: samrukContractsTable.advertNumber,
          descriptionRu: samrukContractsTable.descriptionRu,
          contractSum: samrukContractsTable.contractSum,
          contractCardStatus: samrukContractsTable.contractCardStatus,
          similarity,
        })
        .from(samrukContractsTable)
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
        source: z.enum(["goszakup", "samruk"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.code) {
        return [];
      }

      // Remove any whitespace from the input
      const cleanCode = input.code.replace(/\s+/g, "");

      // Try to find exact match first
      let query = db
        .select({
          id: ktruCodes.id,
          code: ktruCodes.code,
          name: ktruCodes.nameRu,
          description: ktruCodes.descriptionRu,
          source: ktruCodes.source,
        })
        .from(ktruCodes)
        .where(eq(ktruCodes.code, cleanCode));

      // Add source filter if specified
      if (input.source) {
        query = query.where(eq(ktruCodes.source, input.source));
      }

      const exactKtruCode = await query.limit(1);

      // If no exact match found, try partial match
      if (exactKtruCode.length === 0) {
        let partialQuery = db
          .select({
            id: ktruCodes.id,
            code: ktruCodes.code,
            name: ktruCodes.nameRu,
            description: ktruCodes.descriptionRu,
            source: ktruCodes.source,
          })
          .from(ktruCodes)
          .where(sql`${ktruCodes.code} LIKE ${`%${cleanCode}%`}`);

        // Add source filter if specified
        if (input.source) {
          partialQuery = partialQuery.where(eq(ktruCodes.source, input.source));
        }

        const partialMatches = await partialQuery.limit(10);
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
          id: samrukContractsTable.id,
          systemNumber: samrukContractsTable.systemNumber,
          advertNumber: samrukContractsTable.advertNumber,
          descriptionRu: samrukContractsTable.descriptionRu,
          contractSum: samrukContractsTable.contractSum,
          contractCardStatus: samrukContractsTable.contractCardStatus,
        })
        .from(samrukContractsTable)
        .where(eq(samrukContractsTable.systemNumber, cleanNumber))
        .limit(1);

      if (exactSystemNumberMatch.length > 0) {
        return exactSystemNumberMatch;
      }

      // If not found by system number, try advert number
      const exactAdvertNumberMatch = await db
        .select({
          id: samrukContractsTable.id,
          systemNumber: samrukContractsTable.systemNumber,
          advertNumber: samrukContractsTable.advertNumber,
          descriptionRu: samrukContractsTable.descriptionRu,
          contractSum: samrukContractsTable.contractSum,
          contractCardStatus: samrukContractsTable.contractCardStatus,
        })
        .from(samrukContractsTable)
        .where(eq(samrukContractsTable.advertNumber, cleanNumber))
        .limit(1);

      if (exactAdvertNumberMatch.length > 0) {
        return exactAdvertNumberMatch;
      }

      // If still not found, try partial match
      const partialMatches = await db
        .select({
          id: samrukContractsTable.id,
          systemNumber: samrukContractsTable.systemNumber,
          advertNumber: samrukContractsTable.advertNumber,
          descriptionRu: samrukContractsTable.descriptionRu,
          contractSum: samrukContractsTable.contractSum,
          contractCardStatus: samrukContractsTable.contractCardStatus,
        })
        .from(samrukContractsTable)
        .where(
          sql`${samrukContractsTable.systemNumber} LIKE ${`%${cleanNumber}%`} OR ${samrukContractsTable.advertNumber} LIKE ${`%${cleanNumber}%`}`,
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
        .from(samrukContractsTable)
        .where(eq(samrukContractsTable.id, input.contractId))
        .limit(1);

      if (contract.length === 0) {
        throw new Error("Contract not found");
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
        id: samrukContractsTable.id,
        systemNumber: samrukContractsTable.systemNumber,
        advertNumber: samrukContractsTable.advertNumber,
        descriptionRu: samrukContractsTable.descriptionRu,
        contractSum: samrukContractsTable.contractSum,
        contractCardStatus: samrukContractsTable.contractCardStatus,
        localContentProjectedShare:
          samrukContractsTable.localContentProjectedShare,
      })
      .from(samrukContractsTable)
      .where(lt(samrukContractsTable.localContentProjectedShare, 50))
      .orderBy(desc(sql`cast(${samrukContractsTable.contractSum} as float)`))
      .limit(500);

    return results;
  }),

  getKtruDetails: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const ktruCode = await db.query.ktruCodes.findFirst({
        where: eq(ktruCodes.id, input.id),
      });

      if (!ktruCode) {
        throw new Error("KTRU code not found");
      }

      // Get all contracts for this KTRU code
      const goszakupContractsResult = await db
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

      const samrukContracts = await db
        .select({
          contractSum: sql<number>`COALESCE(NULLIF(${samrukContractsTable.contractSum}, ''), '0')::float`,
          localShare: samrukContractsTable.localContentProjectedShare,
          contractDate: samrukContractsTable.createdAt,
        })
        .from(samrukContractsTable)
        .where(eq(samrukContractsTable.truHistory.code, ktruCode.id))
        .orderBy(samrukContractsTable.createdAt);

      const contracts = [...goszakupContractsResult, ...samrukContracts];
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
          const existing = acc.find(
            (m: { month: string }) => m.month === month,
          );

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
          const existing = acc.find((y: { year: string }) => y.year === year);

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
        monthlyStats: monthlyStats.sort(
          (a: { month: string }, b: { month: string }) =>
            a.month.localeCompare(b.month),
        ),
        yearlyStats: yearlyStats.sort(
          (a: { year: string }, b: { year: string }) =>
            a.year.localeCompare(b.year),
        ),
      };
    }),
  getTopKtruGroupsBySum: publicProcedure.query(async () => {
    // Read CSV files
    const groupsData = await fs.readFile(
      path.join(__dirname, "../../data/groups_top.csv"),
      "utf-8",
    );
    const subgroupsData = await fs.readFile(
      path.join(__dirname, "../../data/subgroup_top.csv"),
      "utf-8",
    );

    // Read registry Excel file
    const registryWorkbook = xlsx.parse(
      path.join(__dirname, "../../data/registry.xls"),
    )[0];
    const registryData = registryWorkbook.data;

    // Create a map of code to name from registry
    const codeToNameMap = new Map<string, string>();
    for (let i = 1; i < registryData.length; i++) {
      const row = registryData[i];
      if (row[0] && row[2]) {
        const code = row[0].toString();
        codeToNameMap.set(code, row[2].toString());
        // If code ends with 000, also store it without the 000
        if (code.endsWith("000")) {
          const baseCode = code.slice(0, -3);
          codeToNameMap.set(baseCode, row[2].toString());
        }
      }
    }

    // Parse CSVs with proper typing
    interface GroupData {
      group_code: string;
      group_name: string;
      contract_count: string;
      total_contract_sum: string;
    }

    interface SubgroupData {
      subgroup_code: string;
      group_code: string;
      contract_count: string;
      total_contract_sum: string;
    }

    const groups = await new Promise<GroupData[]>((resolve, reject) => {
      parse(
        groupsData,
        {
          columns: true,
          skip_empty_lines: true,
          cast: true,
          delimiter: ",",
        },
        (err, data) => {
          if (err) reject(err);
          resolve(data);
        },
      );
    });

    const subgroups = await new Promise<SubgroupData[]>((resolve, reject) => {
      parse(
        subgroupsData,
        {
          columns: true,
          skip_empty_lines: true,
          cast: true,
          delimiter: ",",
        },
        (err, data) => {
          if (err) reject(err);
          resolve(data);
        },
      );
    });

    // Create hierarchical structure
    const hierarchicalData: GroupAnalytics[] = groups.map((group) => {
      const groupCode = group.group_code.toString();

      // Find subgroups by matching the group code
      const relatedSubgroups = subgroups
        .filter((subgroup) => {
          const subgroupCode = subgroup.subgroup_code.toString();
          return subgroupCode.startsWith(groupCode);
        })
        .map((subgroup) => {
          const subgroupCode = subgroup.subgroup_code.toString();
          // If code ends with 000, use the base code for lookup
          const lookupCode = subgroupCode.endsWith("000")
            ? subgroupCode.slice(0, -3)
            : subgroupCode;

          return {
            id: subgroupCode,
            code: subgroupCode,
            nameRu:
              codeToNameMap.get(lookupCode) ||
              codeToNameMap.get(subgroupCode) ||
              subgroupCode,
            totalSum: Number(subgroup.total_contract_sum),
            contractCount: Number(subgroup.contract_count),
            averageLocalShare: 0, // Not available in CSV, set default
          };
        });

      // For group code, also check without 000 if it ends with it
      const lookupGroupCode = groupCode.endsWith("000")
        ? groupCode.slice(0, -3)
        : groupCode;

      return {
        id: groupCode,
        code: groupCode,
        nameRu:
          codeToNameMap.get(lookupGroupCode) ||
          codeToNameMap.get(groupCode) ||
          group.group_name,
        totalSum: Number(group.total_contract_sum),
        contractCount: Number(group.contract_count),
        averageLocalShare: 0, // Not available in CSV, set default
        subgroups: relatedSubgroups,
      };
    });

    // Sort by total sum descending
    return hierarchicalData.sort((a, b) => b.totalSum - a.totalSum);
  }),

  // New procedure for getting Samruk contract analytics
  getSamrukContractAnalytics: publicProcedure
    .input(
      z.object({
        query: z.string(),
        contractIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.query || input.contractIds.length === 0) {
        return null;
      }

      // Get contract details
      const contractDetails = await db
        .select()
        .from(samrukContractsTable)
        .where(
          sql`${samrukContractsTable.id} = ANY(ARRAY[${sql.join(
            input.contractIds.map((id) => sql`${id}`),
            sql`, `,
          )}])`,
        );

      // Calculate total stats
      // Calculate aggregated stats
      const totalStats = {
        contractCount: contractDetails.length,
        totalSum: contractDetails.reduce(
          (sum, c) => sum + (Number.parseFloat(c.contractSum) || 0),
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
          const existing = acc.find(
            (m: { month: string }) => m.month === month,
          );
          const contractSum = Number.parseFloat(contract.contractSum) || 0;

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
          const existing = acc.find((y: { year: string }) => y.year === year);
          const contractSum = Number.parseFloat(contract.contractSum) || 0;

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
        monthlyStats: monthlyStats.sort(
          (a: { month: string }, b: { month: string }) =>
            a.month.localeCompare(b.month),
        ),
        yearlyStats: yearlyStats.sort(
          (a: { year: string }, b: { year: string }) =>
            a.year.localeCompare(b.year),
        ),
      };
    }),

  getSimilarKtruGroupAnalytics: publicProcedure
    .input(
      z.object({
        query: z.string(),
        ktruIds: z.array(z.string()),
        source: z.enum(["goszakup", "samruk", "all"]).default("all"),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.query || input.ktruIds.length === 0) {
        return null;
      }

      console.log(input);
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

      console.log(ktruDetails);
      console.log("fetching samruk contracts");

      const samrukContractsRes = await db
        .select({
          contractId: samrukContracts.id,
          contractSum: sql<number>`COALESCE(NULLIF(${samrukContracts.contractSum}, ''), '0')::float`,
          localShare: samrukContracts.localContentProjectedShare,
          contractDate: samrukContracts.contractDate,
          ktruCodeId: samrukContracts.ktruCodeId,
        })
        .from(samrukContracts)
        .where(
          and(
            sql`${samrukContracts.ktruCodeId} = ANY(ARRAY[${sql.join(
              input.ktruIds.map((id) => sql`${id}::uuid`),
              sql`, `,
            )}])`,
            sql`${samrukContracts.createdAt} IS NOT NULL`,
          ),
        )
        .orderBy(samrukContracts.createdAt);

      // Get contracts for selected KTRU codes
      const goszakupContractsResult = await db
        .select({
          contractId: goszakupContracts.id,
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

      let contracts = [];
      if (input.source === "samruk") {
        contracts = [...samrukContractsRes];
      } else if (input.source === "goszakup") {
        contracts = [...goszakupContractsResult];
      } else {
        contracts = [...goszakupContractsResult, ...samrukContractsRes];
      }
      console.log(contracts);

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
          const existing = acc.find(
            (m: { month: string }) => m.month === month,
          );

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
          const existing = acc.find((y: { year: string }) => y.year === year);

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
        monthlyStats: monthlyStats.sort(
          (a: { month: string }, b: { month: string }) =>
            a.month.localeCompare(b.month),
        ),
        yearlyStats: yearlyStats.sort(
          (a: { year: string }, b: { year: string }) =>
            a.year.localeCompare(b.year),
        ),
        ktruStats,
      };
    }),

  getKtruAnalytics: publicProcedure
    .input(
      z.object({
        query: z.string(),
        ktruIds: z.array(z.string()),
        source: z.enum(["goszakup", "samruk", "all"]).default("all"),
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
          source: ktruCodes.source,
        })
        .from(ktruCodes)
        .where(
          sql`${ktruCodes.id} = ANY(ARRAY[${sql.join(
            input.ktruIds.map((id) => sql`${id}::uuid`),
            sql`, `,
          )}])`,
        );

      // Initialize contracts array
      let contracts: Array<{
        contractSum: number;
        localShare: number | null;
        contractDate: Date | null;
        ktruCodeId?: string;
      }> = [];

      // Get Samruk contracts if source is "samruk" or "all"
      if (input.source === "samruk" || input.source === "all") {
        const samrukContractsResult = await db
          .select({
            contractSum: sql<number>`COALESCE(NULLIF(${samrukContractsTable.contractSum}, ''), '0')::float`,
            localShare: samrukContractsTable.localContentProjectedShare,
            contractDate: samrukContractsTable.createdAt,
            ktruCodeId: samrukContractsTable.truHistory.code,
          })
          .from(samrukContractsTable)
          .where(eq(samrukContractsTable.truHistory.code, ktruDetails[0].id));

        contracts = [...contracts, ...samrukContractsResult];
      }

      // Get Goszakup contracts if source is "goszakup" or "all"
      if (input.source === "goszakup" || input.source === "all") {
        const goszakupContractsResult = await db
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

        contracts = [...contracts, ...goszakupContractsResult];
      }

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
          const existing = acc.find(
            (m: { month: string }) => m.month === month,
          );

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
          const existing = acc.find((y: { year: string }) => y.year === year);

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
        selectedContracts: contracts.map((c) => ({
          id: c.id,
          number: c.systemNumber || c.advertNumber,
          description: c.descriptionRu,
          sum: c.contractSum,
          status: c.contractCardStatus,
        })),
        totalStats,
        monthlyStats: monthlyStats.sort(
          (a: { month: string }, b: { month: string }) =>
            a.month.localeCompare(b.month),
        ),
        yearlyStats: yearlyStats.sort(
          (a: { year: string }, b: { year: string }) =>
            a.year.localeCompare(b.year),
        ),
      };
    }),
});
