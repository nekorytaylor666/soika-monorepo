import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import supertokens from "supertokens-node";
import { middleware } from "supertokens-node/framework/express";
import { errorHandler } from "supertokens-node/framework/express";
import { supertokensConfig } from "./lib/supertokens";
import { createContext } from "./trpc";
import { appRouter } from "./trpc/appRouter";
import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { eq } from "drizzle-orm";
import { lots } from "db/schema";
import { db } from "db/connection";
import { createLotTools } from "./lib/tools";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app = express();

supertokens.init(supertokensConfig);

app.use(
  cors({
    origin: "https://soika-frontend.pages.dev",
    allowedHeaders: [
      "content-type",
      "authorization",
      "rid",
      "st-auth-mode",
      "api-key",
      "fdi-version",
    ],
    credentials: true,
    exposedHeaders: ["set-cookie"],
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
  }),
);

// Enable pre-flight requests for all routes
app.options(
  "*",
  cors({
    origin: "https://soika-frontend.pages.dev",
    credentials: true,
    allowedHeaders: [
      "content-type",
      "authorization",
      "rid",
      "st-auth-mode",
      "api-key",
      "fdi-version",
    ],
  }),
);

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(middleware());
app.use(errorHandler());

app.post("/generate", async (req, res) => {
  try {
    const messages = req.body.messages;
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: convertToCoreMessages(messages),
    });

    result.pipeDataStreamToResponse(res);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, lotId } = req.body;

    // Get lot details from database
    const lot = await db.query.lots.findFirst({
      where: eq(lots.id, lotId),
    });

    if (!lot) {
      return res.status(404).json({ error: "Lot not found" });
    }

    // Add system message with context
    const systemMessage = {
      role: "system",
      content: `Вы - полезный ИИ-ассистент для анализа деталей тендера в Казахстане. Вот контекст о тендере:
      Название тендера: ${lot.lotName}
      Описание: ${lot.lotDescription}
      Дополнительные детали: ${lot.lotAdditionalDescription}
      Бюджет: ${lot.budget} тенге
      Срок поставки: ${lot.deliveryTerm}
      Места поставки: ${lot.deliveryPlaces}
      Другая информация: ${JSON.stringify({ ...lot, embedding: [] })}
      
      Пожалуйста, помогите пользователям понять требования тендера и предоставьте актуальную информацию.
      Будьте лаконичны и профессиональны в своих ответах.`,
    };

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      // tools: createLotTools(lotId),
      // maxSteps: 3,
      messages: [systemMessage, ...convertToCoreMessages(messages)],
    });

    result.pipeDataStreamToResponse(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    // @ts-ignore
    createContext,
  }),
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
