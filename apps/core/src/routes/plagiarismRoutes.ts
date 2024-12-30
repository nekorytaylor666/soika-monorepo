import { Hono } from "hono";
import { db } from "db/connection";
import { lots, plagiarismCheck, recommendedProducts, tenders } from "db/schema";
import { eq } from "drizzle-orm";
import { DATABASE_URL, EVENT_TYPE } from "../lib/config";
import { addTextRuProductParsingJob } from "../queue/manager";
import { router } from "../queue/jobRouter.old";

const plagiarismRoutes = new Hono<HonoEnv>();

plagiarismRoutes.post("/plagiarism/callback/:lotId", async (c) => {
  const req = await c.req.text();
  const params = new URLSearchParams(req);
  const lotIdString = c.req.param("lotId");
  const lotId = Number.parseInt(lotIdString);
  console.debug(`Received plagiarism check callback for lot ${lotId}`);

  const uid = params.get("uid");
  const textUnique = params.get("text_unique");
  const jsonResult = params.get("json_result");
  const { unique, urls } = JSON.parse(jsonResult || "{}");
  if (!uid || !textUnique || !jsonResult) {
    console.debug(`Invalid plagiarism check callback for lot ${lotId}`);
    return c.json(
      { error: "Invalid plagiarism check callback" },
      { status: 400 },
    );
  }

  const lot = await db.query.lots.findFirst({
    where: eq(lots.id, lotId),
  });

  if (!lot) {
    console.debug(`Lot ${lotId} not found for plagiarism check callback`);
    return c.json({ error: "Tender not found" }, { status: 404 });
  }

  console.debug(textUnique, urls);
  await db.insert(plagiarismCheck).values({ lotId, unique, urls });
  console.debug(`Saved plagiarism check result for lot ${lotId}`);

  if (!urls || urls.length === 0) {
    console.debug(`No URLs provided for lot ${lotId}`);
    return c.json({ error: "No URLs to process" }, { status: 400 });
  }
  await router.handleTextRuProductParsing.emit({ lotId: lotId.toString() });
  console.debug(`Sent parse-products task to queue for lot ${lotId}`);

  return c.text("ok");
});

export default plagiarismRoutes;
