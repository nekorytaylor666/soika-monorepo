import { lots, recommendedProducts } from "db/schema";
import { db } from "db/connection";
import { eq } from "drizzle-orm";
import { evaluateProductCompliance } from "../lib/compliance";
import { EVENT_TYPE, type MessageType } from "../lib/config";
import { getDocumentProxy, extractText } from "unpdf";
import { extractTenderInfo } from "../lib/extractSpecs";
import { initiatePlagiarismCheck } from "../lib/plagiarism";
import { scrapeUrl } from "../lib/extractProductSpecs";

const queue = async (
  batch: MessageBatch<
    MessageType<typeof EVENT_TYPE.parseProducts | typeof EVENT_TYPE.lotCreation>
  >,
  env: HonoEnv["Bindings"],
) => {
  const messages = batch.messages;
  console.log("Processing batch of messages:", messages.length);
  for (const message of messages) {
    console.log("Processing message:", message);
    try {
      switch (message.body.type) {
        case EVENT_TYPE.parseProducts:
          console.log("Handling product parsing for message:", message);
          await handleRecommendation(message.body, env, message);
          break;
        case EVENT_TYPE.lotCreation:
          console.log("Handling lot creation for message:", message);
          await handleLotCreation(message.body, env, message);
          break;
      }
      console.log("Message processed successfully:", message);
      message.ack();
    } catch (error) {
      console.error("Error processing message:", message, "Error:", error);
      message.retry({ delaySeconds: 60 });
    }
  }
};

const handleRecommendation = async (
  body: MessageType<typeof EVENT_TYPE.parseProducts>,
  env: HonoEnv["Bindings"],
  message: Message,
) => {
  console.log("Starting handleRecommendation for lotId:", body.lotId);
  const lotId = Number.parseInt(body.lotId);
  const lot = await db.query.lots.findFirst({
    where: eq(lots.id, lotId),
    with: {
      plagiarismCheck: true,
    },
  });
  if (!lot) {
    console.log(`Lot ${lotId} not found`);
    return;
  }
  console.log("Lot found:", lot);
  const { plagiarismCheck } = lot;
  const urls = plagiarismCheck?.urls;
  if (!urls) {
    console.log(`No URLs found for lot ${lotId}`);
    return;
  }
  const url = urls[0].url;
  console.log("Scraping URL:", url);
  const extraction = await scrapeUrl(url);
  console.log("Extraction result:", extraction);
  if (!extraction.isTender) {
    console.log("Evaluating product compliance");
    const compliance = await evaluateProductCompliance(
      extraction.specifications,
      lot.lotSpecifications ?? "",
    );
    console.log("Compliance evaluation result:", compliance);
    const result = await db
      .insert(recommendedProducts)
      .values({
        lotId: lotId,
        productName: extraction.name,
        productDescription: extraction.description,
        productSpecifications: extraction.specifications,
        sourceUrl: url,
        price: extraction.price,
        unitOfMeasure: extraction.unitOfMeasure,
        currency: extraction.currency,
        complianceScore: compliance.compliance_score,
        complianceDetails: compliance.compliance_details,
      })
      .returning();
    console.log("Inserted recommended product:", result);
    return result;
  }
};

const handleLotCreation = async (
  body: MessageType<typeof EVENT_TYPE.lotCreation>,
  env: HonoEnv["Bindings"],
  message: Message,
) => {
  console.log("Starting handleLotCreation for lot:", body.lot);
  const { lot } = body;
  if (lot.nameRu.includes("услуги") || lot.nameRu.includes("работы")) {
    console.log(
      "Skipping lot due to inclusion of услуги or работы in the name",
    );
    return;
  }
  const technicalSpecFile = body.lot.Files.find((file) =>
    file.nameRu.includes("Техническая спецификация"),
  );
  if (!technicalSpecFile) {
    console.log("Technical specification file not found");
    return;
  }
  console.log("Technical specification file found:", technicalSpecFile.nameRu);

  const buffer = await fetch(body.lot.Files[0].filePath).then((res) =>
    res.arrayBuffer(),
  );
  console.log("PDF fetched and buffer created");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  console.log("PDF loaded");
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  console.log(`Extracted text from PDF, total pages: ${totalPages}`);
  const specs = await extractTenderInfo(text as string);
  console.log("Tender specifications extracted:", specs);
  const createdLot = await db
    .insert(lots)
    .values({
      ...specs,
      id: lot.id,
      lotNumber: lot.lotNumber,
      budget: lot.amount,
      consultingServices: lot.consultingServices,
      count: lot.count,
      customerBin: lot.customerBin,
      customerId: lot.customerId,
      customerNameRu: lot.customerNameRu,
      enstruList: lot.enstruList,
      files: lot.Files,
      refLotsStatus: lot.RefLotsStatus,
      refTradeMethods: lot.RefTradeMethods,
      tenderId: lot.trdBuyId,
      trdBuyNumberAnno: lot.trdBuyNumberAnno,
      plnPointKatoList: lot.plnPointKatoList,
      indexDate: lot.indexDate,
      lotName: lot.nameRu,
    })
    .returning();
  console.log("Lot created in database:", createdLot);
  await initiatePlagiarismCheck(createdLot[0]);
  console.log("Plagiarism check initiated for:", createdLot[0]);
};

//get all buys that are related to this lot
//get if they have a contract
// parse contract and get factory
// add this factory to recommendation
