import { Hono } from "hono";
import { extractTenderInfo } from "../lib/extractSpecs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { lots, tenders } from "db/schema";
import { db } from "db/connection";
import { initiatePlagiarismCheck } from "../lib/plagiarism";
import { extractText, getDocumentProxy } from "unpdf";
const tenderRoutes = new Hono<HonoEnv>().basePath("/tenders");

tenderRoutes.post("/:id/extract-specs", async (c) => {
  const body = await c.req.parseBody<{ file: File; budget: string }>();

  if (!body.file) {
    return c.json({ error: "No file provided" }, { status: 400 });
  }
  const file = body.file;
  const budget = Number.parseInt(body.budget);
  const buffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // Extract text from PDF
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const lotId = c.req.param("id");

  const specs = await extractTenderInfo(text as string);
  const lot = await db
    .insert(lots)
    .values({
      ...specs,
      budget,
    })
    .returning();

  await initiatePlagiarismCheck(lot[0]);

  return c.json({ lot });
});

tenderRoutes.post("/:id/extract-specs-table", async (c) => {
  // const tenderId = c.req.param('id');
  // const tenderIdNumber = parseInt(tenderId);
  // const tender = await db.query.tenders.findFirst({
  // 	where: eq(tenders.id, tenderIdNumber),
  // });
  const body = await c.req.parseBody<{ file: File }>();

  if (!body["file"]) {
    return c.json({ error: "No file provided" }, { status: 400 });
  }
  const file = body["file"];
  const buffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // Extract text from PDF
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const specs = await extractTenderInfo(text as string);
  return c.json(specs);
  // if (!tender) {
  // 	return c.json({ error: 'Tender not found' }, { status: 404 });
  // }
});

tenderRoutes.get("/", async (c) => {
  const tenderKeys = await c.env.tenders.list();
  const tenders = await Promise.all(
    tenderKeys.keys.map(
      async ({ name }) => (await c.env.tenders.get(name)) as string,
    ),
  );
  const parsedTenders = tenders.map((tender) => JSON.parse(tender));
  return c.json(parsedTenders);
});

tenderRoutes
  .get("/:id", async (c) => {
    const tender = await c.env.tenders.get(c.req.param("id"));
    if (!tender) {
      return c.json({ error: "Tender not found" }, { status: 404 });
    }
    return c.json(JSON.parse(tender));
  })
  .delete("/:id", async (c) => {
    await c.env.tenders.delete(c.req.param("id"));
    return c.json({ message: "Tender deleted" });
  });

export default tenderRoutes;
