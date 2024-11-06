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
    })
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
      })
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

      // Генерируем эмбеддинг для поискового запроса
      const embeddingPromise = embeddings.embedQuery(query);

      // Выполняем поиск по ключевым словам
      const keywordResultsPromise = ctx.db.query.lots.findMany({
        where: (table, { inArray, gt, lt }) =>
          and(
            input.withRecommendations
              ? inArray(
                  table.id,
                  ctx.db
                    .select({ lotId: recommendedProducts.lotId })
                    .from(recommendedProducts)
                )
              : undefined,
            sql`to_tsvector('russian', ${lots.lotName} || ' ' || ${lots.lotDescription} || ' ' || ${lots.lotAdditionalDescription}) @@ plainto_tsquery('russian', ${query})`,
            input.minBudget ? gt(table.budget, input.minBudget) : undefined,
            input.maxBudget ? lt(table.budget, input.maxBudget) : undefined,
            input.tradeMethod
              ? sql`ref_trade_methods ->> 'id' = ${input.tradeMethod}`
              : undefined
          ),
        with: {
          recommendedProducts: {
            columns: {
              id: true,
            },
          },
        },
        limit: 25,
        orderBy: desc(
          sql`ts_rank_cd(to_tsvector('russian', ${lots.lotName} || ' ' || ${lots.lotDescription} || ' ' || ${lots.lotAdditionalDescription}), plainto_tsquery('russian', ${query}))`
        ),
      });

      // Ожидаем завершения обоих запросов
      const [embedding, keywordResults] = await Promise.all([
        embeddingPromise,
        keywordResultsPromise,
      ]);

      // Выполняем семантический поиск
      const semanticResults = await ctx.db.query.lots.findMany({
        where: (table, { inArray, gt, lt }) =>
          and(
            input.withRecommendations
              ? inArray(
                  table.id,
                  ctx.db
                    .select({ lotId: recommendedProducts.lotId })
                    .from(recommendedProducts)
                )
              : undefined,
            sql`${cosineDistance(lots.embedding, embedding)} < 0.8`,
            input.minBudget ? gt(table.budget, input.minBudget) : undefined,
            input.maxBudget ? lt(table.budget, input.maxBudget) : undefined,
            input.tradeMethod
              ? sql`ref_trade_methods ->> 'id' = ${input.tradeMethod}`
              : undefined
          ),
        with: {
          recommendedProducts: {
            columns: {
              id: true,
            },
          },
        },
        limit: 25,
        orderBy: asc(cosineDistance(lots.embedding, embedding)),
      });

      // Объединяем и удаляем дубликаты результатов
      const combinedResults = Array.from(
        new Set([...semanticResults, ...keywordResults])
      );

      // Подготавливаем документы для переранжирования
      const documents = combinedResults.map((lot) => ({
        pageContent: `${lot.lotName} ${lot.lotDescription} ${lot.lotAdditionalDescription}`,
        metadata: lot,
      }));

      // Переранжируем с использованием Jina AI
      let rerankedResults = documents;
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
            documents: documents.map((doc) => ({
              text: doc.pageContent,
              ...doc,
            })),
            top_n: limit,
          }),
        });

        if (!jinaResponse.ok) {
          throw new Error(
            `Запрос к API Jina не удался со статусом ${jinaResponse.status}`
          );
        }

        const jinaData = await jinaResponse.json();
        rerankedResults = jinaData.results.map((result: any) => ({
          ...documents[result.index].metadata,
          score: result.score,
        }));
      } catch (error) {
        console.error("Ошибка при переранжировании Jina:", error);
        rerankedResults = documents.map((doc) => doc.metadata);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Длительность поиска: ${duration.toFixed(2)} мс`);

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
          and(eq(boardsStatuses.board, boardId), eq(boardsStatuses.order, 0))
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
});
