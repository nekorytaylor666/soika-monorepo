import {
  DATABASE_URL,
  type EVENT_TYPE,
  type MessageType,
} from "../../lib/config";
import { db } from "db/connection";
import { lots, recommendedProducts } from "db/schema";
import { eq } from "drizzle-orm";
import { evaluateProductCompliance } from "../../lib/compliance";
import { scrapeUrl } from "../../lib/extractProductSpecs";

export const handleTextRuProductParsing = async (body: { lotId: string }) => {
  // console.log('handleTextRuProductParsing', body);
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
