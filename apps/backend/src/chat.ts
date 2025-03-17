import { Hono } from "hono";
import { stream, streamSSE } from "hono/streaming";
import {
  convertToCoreMessages,
  generateObject,
  streamObject,
  streamText,
} from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import { db } from "db/connection";
import { cosineDistance, desc, sql } from "drizzle-orm/sql";
import { embeddings } from "./lib/ai";
import { ktruCodes, samrukContracts } from "db/schema";
import { openai } from "@ai-sdk/openai";
import { and, eq, or } from "drizzle-orm";

export const chatRouter = new Hono();

const SIMILARITY_THRESHOLD = 0.4;

chatRouter.post("/agent", async (c) => {
  try {
    const input = await c.req.json();
    if (!input) {
      return c.json({ selectedKtrus: [] });
    }

    const embedding = await embeddings.embedQuery(input.query);
    const similarity = sql<number>`1 - (${cosineDistance(ktruCodes.embedding, embedding)})`;

    // Build the query with optional source filter
    const similarKtruCodes = await db
      .select({
        id: ktruCodes.id,
        code: ktruCodes.code,
        name: ktruCodes.nameRu,
        description: ktruCodes.descriptionRu,
        source: ktruCodes.source,
        similarity,
      })
      .from(ktruCodes)
      .where(
        and(
          sql`${similarity} >= ${SIMILARITY_THRESHOLD}`,
          input.source !== "all"
            ? or(
                eq(ktruCodes.source, input.source),
                eq(ktruCodes.source, "any"),
              )
            : undefined,
        ),
      )
      .orderBy(desc(similarity))
      .limit(500);

    const relevanceChecks = await Promise.all(
      similarKtruCodes.map(async (ktruCode) => {
        try {
          const relevanceCheck = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
              isRelevant: z.boolean(),
            }),
            prompt: `Пользовательский запрос: "${input.query}"
            
            И этот код КТРУ:
            Код: ${ktruCode.code}
            Название: ${ktruCode.name}
            Описание: ${ktruCode.description}
            Источник: ${ktruCode.source || "goszakup"}
            Схожесть: ${(ktruCode.similarity * 100).toFixed(1)}%

            Определите, действительно ли этот код КТРУ соответствует запросу пользователя.
            Учитывайте как семантическое сходство, так и бизнес-логику.
            Верните JSON объект со следующим полем:
            1. isRelevant: boolean, указывающий, является ли код релевантным
          `,
          });

          const result = relevanceCheck.object;

          console.log(result);
          if (result.isRelevant) {
            return {
              id: ktruCode.id,
              name: ktruCode.name,
              description: ktruCode.description,
              code: ktruCode.code,
              source: ktruCode.source || "goszakup",
            };
          }
        } catch (error) {
          console.error(
            `Error checking relevance for KTRU code ${ktruCode.code}:`,
            error,
          );
        }
        return null;
      }),
    );

    const relevantKtruCodes = relevanceChecks.filter(Boolean);

    return c.json({ selectedKtrus: relevantKtruCodes });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to process chat request" }, 500);
  }
});

// New endpoint for Samruk contract search
chatRouter.post("/samruk-agent", async (c) => {
  try {
    const input = await c.req.text();
    if (!input) {
      return c.json({ selectedContracts: [] });
    }

    const embedding = await embeddings.embedQuery(input);
    const similarity = sql<number>`1 - (${cosineDistance(samrukContracts.embedding, embedding)})`;

    const similarSamrukContracts = await db
      .select({
        id: samrukContracts.id,
        truHistory: samrukContracts.truHistory,
        contractSum: samrukContracts.contractSum,
        descriptionRu: samrukContracts.descriptionRu,
        systemNumber: samrukContracts.systemNumber,
        advertNumber: samrukContracts.advertNumber,
        contractCardStatus: samrukContracts.contractCardStatus,
        similarity,
      })
      .from(samrukContracts)
      .where(sql`${similarity} >= ${SIMILARITY_THRESHOLD}`)
      .orderBy(desc(similarity))
      .limit(500);

    console.log(similarSamrukContracts);

    const relevanceChecks = similarSamrukContracts.map(async (contract) => {
      const relevanceCheck = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          isRelevant: z.boolean(),
        }),
        prompt: `Пользовательский запрос: "${input}"
        
        И этот контракт Самрук:
        Номер: ${contract.systemNumber || contract.advertNumber || "Не указан"}
        Название: ${contract.truHistory?.ru || "Не указано"}
        Описание: ${contract.descriptionRu || "Не указано"}
        Сумма: ${contract.contractSum || "Не указана"}
        Статус: ${contract.contractCardStatus || "Не указан"}
        Схожесть: ${(contract.similarity * 100).toFixed(1)}%

        Определите, действительно ли этот контракт соответствует запросу пользователя.
        Учитывайте как семантическое сходство, так и бизнес-логику.
        Верните JSON объект со следующим полем:
        1. isRelevant: boolean, указывающий, является ли контракт релевантным
      `,
      });

      const result = relevanceCheck.object;

      console.log(result);
      if (result.isRelevant) {
        return {
          id: contract.id,
          number: contract.systemNumber || contract.advertNumber,
          description: contract.descriptionRu,
          sum: contract.contractSum,
          status: contract.contractCardStatus,
        };
      }
      return null;
    });

    const relevantContracts = (await Promise.all(relevanceChecks)).filter(
      Boolean,
    );

    return c.json({ selectedContracts: relevantContracts });
  } catch (err) {
    console.error(err);
    return c.json(
      { error: "Failed to process Samruk contract search request" },
      500,
    );
  }
});
