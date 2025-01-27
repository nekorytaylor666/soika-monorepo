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
import { ktruCodes } from "db/schema";
import { openai } from "@ai-sdk/openai";

export const chatRouter = new Hono();

const SIMILARITY_THRESHOLD = 0.4;

chatRouter.post("/agent", async (c) => {
  try {
    const input = await c.req.text();
    if (!input) {
      return [];
    }

    const embedding = await embeddings.embedQuery(input);
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
      .limit(50);

    console.log(similarKtruCodes);

    const relevanceChecks = similarKtruCodes.map(async (ktruCode) => {
      const relevanceCheck = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          isRelevant: z.boolean(),
        }),
        prompt: `Пользовательский запрос: "${input}"
        
        И этот код КТРУ:
        Код: ${ktruCode.code}
        Название: ${ktruCode.name}
        Описание: ${ktruCode.description}
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
        };
      }
      return null;
    });

    const relevantKtruCodes = (await Promise.all(relevanceChecks)).filter(
      Boolean,
    );

    return c.json({ selectedKtrus: relevantKtruCodes });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to process chat request" }, 500);
  }
});
