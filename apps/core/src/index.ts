import { type Env, Hono } from "hono";
import { cors } from "hono/cors";
import tenderRoutes from "./routes/tenderRoutes";
import * as schema from "db/schema";
import { db } from "db/connection";
import plagiarismRoutes from "./routes/plagiarismRoutes";

import { eq } from "drizzle-orm";
import { evaluateProductCompliance } from "./lib/compliance";
import { EVENT_TYPE } from "./lib/config";
import { queue } from "./queue/manager";
import companyIndexRoutes from "./queue/handlers/companyIndex";
import { router } from "./queue/jobRouter.old";
import { startTelegramBot, telegramRoutes } from "./routes/telegram";
import { scheduledSearches } from "./queue/scheduled/scheduledJobs";
import { scheduleRouter } from "./queue/handlers/scheduledSearch";
import { findSimilarGuides } from "./queue/handlers/newIngestContracts";

const app = new Hono<HonoEnv>();
app.use("*", async (c, next) => {
  console.log(`Received ${c.req.method} request to ${c.req.url}`);
  console.log("Headers:", c.req.header());
  await next();
});
// Update the CORS configuration
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowHeaders: ["Content-Type", "Authorization", "rid", "st-auth-mode"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/echo", async (c) => {
  return c.json({ message: "ok" });
});

app.get("/", async (c) => {
  // await c.env.soikaQueue.send({ lotId: 12, task: 'parse-products' });
  const result = await db(c).query.tenders.findMany({
    with: {
      lots: {
        with: {
          recommendedProducts: true,
        },
      },
    },
  });
  return c.json({ result });
});

app.get("/test-scrape", async (c) => {
  const apiKey = "fc-a5a2feafb5164972a9ff0510fd500ab5";
  const url = "https://api.firecrawl.dev/v0/scrape";

  const extractionSchema = {
    type: "object",
    properties: {
      productName: {
        type: "string",
      },
      productDescription: {
        type: "string",
      },
      price: {
        type: "number",
      },
      productSpecifications: {
        type: "string",
      },
    },
    required: ["productName", "productDescription", "productSpecifications"],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: "https://www.shop-kelet.kz/catalog/nasosy-pogruzhnye-kanalizatsionnye/nasos-65wq15-15-1-5/",
      extractorOptions: {
        mode: "llm-extraction",
        extractionPrompt:
          "Based on the information on the page, extract the information from the schema. ",
        extractionSchema,
      },
    }),
  });

  const extractResult = await response.json();
  console.log(extractResult);
  return c.json({ extractResult });
});

app.post("/post-parse-job", async (c) => {
  const { lotId } = await c.req.json<{ lotId: number }>();
  await c.env.soikaQueue.send({ lotId, task: "parse-products" });
  return c.json({ result: "ok" });
});

app.get("/get-lot/:id", async (c) => {
  const id = c.req.param("id");
  const lot = await db.query.lots.findFirst({
    where: eq(schema.lots.lotNumber, id),
  });
  return c.json({ lot });
});

app.post("/compliance/:productId", async (c) => {
  const productId = c.req.param("productId");
  const product = await db.query.recommendedProducts.findFirst({
    where: eq(schema.recommendedProducts.id, Number.parseInt(productId)),
    with: {
      lot: true,
    },
  });
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  if (!product?.productSpecifications || !product?.lot?.lotSpecifications) {
    return c.json({ error: "Product or lot specifications not found" }, 404);
  }
  const result = await evaluateProductCompliance(
    product.productSpecifications,
    product.lot.lotSpecifications,
  );
  return c.json({ result });
});

app.post("/clean_lot_backlog", async (c) => {
  const allLots = await db.query.plagiarismCheck.findMany();
  const urlLots = allLots.filter(
    (el) => el.urls?.length && el.unique !== null && el.unique < 70,
  );
  const limitedUrlLots = urlLots.slice(-50); // Changed to select the last 50 elements
  for (const lot of limitedUrlLots) {
    await c.env.soikaQueue.send({
      lotId: lot.id,
      type: EVENT_TYPE.parseProducts,
    });
  }
  return c.json({ count: limitedUrlLots.length, urlLots: limitedUrlLots });
});

app.onError((error, c) => {
  console.log(error);
  return c.json({ error }, 400);
});

app.route("/", tenderRoutes);
app.route("/", plagiarismRoutes);
app.route("/indexing", companyIndexRoutes);
app.route("/", telegramRoutes);
app.route("/", scheduleRouter);
app.post("/index-lots", async (c) => {
  // await router.fetchLots.emit({});
  await router.handleContractsRecommendations.emit({ lotId: 31297454 });
  // const lot = await db.query.lots.findFirst({
  return c.json({ result: "ok" });
  // 	where: eq(schema.lots.lotNumber, '31214727'),
  // });
  // console.log(lot);
  // if (!lot) {
  // 	return c.json({ error: 'Lot not found' }, 404);
  // }
  // const similarGuides = await findSimilarGuides(`${lot.lotName} ${lot.lotDescription}`);

  // return c.json({ result: similarGuides });
});

// await queue.add(
// 	EVENT_TYPE.fetchLots,
// 	{},
// 	{
// 		repeat: {
// 			pattern: '0 0 * * *',
// 		},
// 	}
// );
// router.createLot.emit({ lot: 'asdfasdf' });
// await router.fetchLots.emit({});
// scheduledSearches();

// startTelegramBot();

export default {
  port: 3001,
  fetch: app.fetch,
};
