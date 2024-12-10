import { and, asc, cosineDistance, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure, router } from "..";
import { ChatGroq } from "@langchain/groq";

import {
  boardsStatuses,
  dealBoard,
  deals,
  lots,
  recommendedProducts,
  tradeMethods,
} from "db/schema/schema";
import { embeddings } from "../../lib/ai";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "langchain/output_parsers";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const whereClauseSchema = z.object({
  conditions: z.array(
    z.object({
      column: z.string(),
      operator: z.enum(["=", ">", "<", ">=", "<=", "LIKE", "IN"]),
      value: z.union([
        z.string(),
        z.number(),
        z.array(z.string()),
        z.array(z.number()),
      ]),
    }),
  ),
});

const extractionSchema = z.object({
  whereConditions: whereClauseSchema,
  searchQuery: z.string(),
});

const metadataFields = {
  budget: {
    type: "number",
    sqlColumn: "budget",
    description: "The budget allocated for the lot",
  },
  indexDate: {
    type: "string",
    sqlColumn: "index_date",
    description: "The index date of the lot",
  },
  deliveryTerm: {
    type: "string",
    sqlColumn: "delivery_term",
    description: "The delivery term for the lot",
  },
  createdAt: {
    type: "date",
    sqlColumn: "created_at",
    description: "The timestamp when the lot was created",
  },
};
export const lotRouter = router({
  getTradeMethods: publicProcedure.query(async ({ ctx }) => {
    const data = await ctx.db.select().from(tradeMethods);
    return data;
  }),
  searchLots: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        minBudget: z.number().nullish(),
        maxBudget: z.number().nullish(),
        tradeMethod: z.number().nullish(),
        withRecommendations: z.boolean().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query, limit, offset } = input;

      if (query === "") {
        return {
          results: [],
          totalCount: 0,
        };
      }
      const startTime = performance.now();

      // Generate embedding for the search query
      const embeddingPromise = embeddings.embedQuery(query);

      // Perform search using keywords
      const keywordResultsPromise = ctx.db.query.lots.findMany({
        where: (table, { inArray, gt, lt }) =>
          and(
            input.withRecommendations
              ? inArray(
                  table.id,
                  ctx.db
                    .select({ lotId: recommendedProducts.lotId })
                    .from(recommendedProducts),
                )
              : undefined,
            sql`to_tsvector('russian', ${lots.lotName} || ' ' || ${lots.lotDescription} || ' ' || ${lots.lotAdditionalDescription}) @@ plainto_tsquery('russian', ${query})`,
            input.minBudget ? gt(table.budget, input.minBudget) : undefined,
            input.maxBudget ? lt(table.budget, input.maxBudget) : undefined,
            input.tradeMethod
              ? sql`ref_trade_methods ->> 'id' = ${input.tradeMethod}`
              : undefined,
          ),
        with: {
          recommendedProducts: {
            columns: {
              id: true,
            },
          },
        },
        limit: 10,
        orderBy: desc(
          sql`ts_rank_cd(to_tsvector('russian', ${lots.lotName} || ' ' || ${lots.lotDescription} || ' ' || ${lots.lotAdditionalDescription}), plainto_tsquery('russian', ${query}))`,
        ),
      });

      // Wait for both queries to complete
      const [embedding, keywordResults] = await Promise.all([
        embeddingPromise,
        keywordResultsPromise,
      ]);

      // Perform semantic search
      const semanticResults = await ctx.db.query.lots.findMany({
        where: (table, { inArray, gt, lt }) =>
          and(
            input.withRecommendations
              ? inArray(
                  table.id,
                  ctx.db
                    .select({ lotId: recommendedProducts.lotId })
                    .from(recommendedProducts),
                )
              : undefined,
            sql`${cosineDistance(lots.embedding, embedding)} < 0.8`,
            input.minBudget ? gt(table.budget, input.minBudget) : undefined,
            input.maxBudget ? lt(table.budget, input.maxBudget) : undefined,
            input.tradeMethod
              ? sql`ref_trade_methods ->> 'id' = ${input.tradeMethod}`
              : undefined,
          ),
        with: {
          recommendedProducts: {
            columns: {
              id: true,
            },
          },
        },
        limit: 10,
        orderBy: asc(cosineDistance(lots.embedding, embedding)),
      });

      // Combine and remove duplicates
      const combinedResults = Array.from(
        new Set([...semanticResults, ...keywordResults]),
      );

      // Prepare documents for reranking - now only sending text
      const textsForReranking = combinedResults.map((lot) => ({
        text: `${lot.lotName} ${lot.lotDescription} ${lot.lotAdditionalDescription}`,
        metadata: {
          ...lot,
          embedding: [],
        },
      }));

      // Rerank using Jina AI
      let rerankedResults = textsForReranking;
      try {
        const jinaResponse = await fetch("https://api.jina.ai/v1/rerank", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer jina_28f45e828a1b46abafbbd62c742c743250elOwPyd9l7AInOLT2AdGj40XNj",
          },
          body: JSON.stringify({
            model: "jina-reranker-v2-base-multilingual",
            query: query,
            documents: textsForReranking.map((doc) => doc.text),
            top_n: limit,
          }),
        });

        if (!jinaResponse.ok) {
          throw new Error(
            `Jina API request failed with status ${jinaResponse.status}`,
          );
        }

        const jinaData = await jinaResponse.json();
        // Reattach metadata using the returned indices
        rerankedResults = jinaData.results.map((result: any) => ({
          ...textsForReranking[result.index].metadata,
          score: result.relevance_score,
        }));
      } catch (error) {
        console.error("Error during Jina reranking:", error);
        rerankedResults = textsForReranking.map((doc) => doc.metadata);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Search duration: ${duration.toFixed(2)} ms`);

      return {
        results: rerankedResults.slice(offset, offset + limit),
        totalCount: rerankedResults.length,
      };
    }),

  addToDealBoard: authenticatedProcedure
    .input(z.object({ lotId: z.number(), boardId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { lotId, boardId } = input;
      const statuses = await ctx.db
        .select()
        .from(boardsStatuses)
        .where(
          and(eq(boardsStatuses.board, boardId), eq(boardsStatuses.order, 0)),
        );

      const deal = await ctx.db
        .insert(deals)
        .values({ lot: lotId, createdBy: ctx.session.userId })
        .returning();
      await ctx.db
        .insert(dealBoard)
        .values({ deal: deal[0].id, board: boardId, status: statuses[0].id });
      return deal[0].id;
    }),
  getById: publicProcedure.input(z.number()).query(async ({ input, ctx }) => {
    const data = await ctx.db.query.lots.findFirst({
      where: eq(lots.id, input),
      with: {
        recommendedProducts: true,
      },
    });
    return data;
  }),
  chat: publicProcedure
    .input(
      z.object({
        lotId: z.number(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { lotId, messages } = input;

      // Get lot details to provide context
      const lot = await ctx.db.query.lots.findFirst({
        where: eq(lots.id, lotId),
      });

      if (!lot) {
        throw new Error("Lot not found");
      }

      // Create system message with lot context
      const systemMessage = {
        role: "system",
        content: `You are a helpful AI assistant for analyzing tender details. Here is the context about the tender:
        Tender Name: ${lot.lotName}
        Description: ${lot.lotDescription}
        Additional Details: ${lot.lotAdditionalDescription}
        Budget: ${lot.budget}
        Delivery Term: ${lot.deliveryTerm}
        Delivery Places: ${lot.deliveryPlaces}
        
        Please help users understand the tender requirements and provide relevant information.
        Be concise and professional in your responses.`,
      };

      const result = await streamText({
        model: openai("gpt-4-turbo"),
        messages: [systemMessage, ...messages],
      });

      return result.toDataStreamResponse();
    }),
});
