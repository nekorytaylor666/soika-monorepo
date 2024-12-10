import type { GosZakupLot } from "../../lib/goszakupSource";
import openai from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { extractTenderInfo } from "../../lib/extractSpecs";
const embedding = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
  batchSize: 512, // Default value if omitted is 512. Max is 2048
  model: "text-embedding-3-small",
  // dimensions: 1536,
});

export const handleLotCreation = async (body: { lot: GosZakupLot }) => {
  console.log("Starting handleLotCreation for lot:", body.lot);
  const { lot } = body;
  setTimeout(() => {
    console.log("test");
  }, 1000);
  if (
    lot.nameRu.includes("услуги") ||
    lot.nameRu.includes("работы") ||
    lot.nameRu.includes("Услуги") ||
    lot.nameRu.includes("Работы")
  ) {
    console.log(
      "Skipping lot due to inclusion of услуги or работы in the name",
    );
    return;
  }
  // const technicalSpecFile = body.lot.Files.find((file) => file.nameRu.includes('Техническая спецификация'));
  // if (!technicalSpecFile) {
  // 	console.log('Technical specification file not found');
  // 	return;
  // }
  // console.log('Technical specification file found:', technicalSpecFile.nameRu);
  // const buffer = await fetch(body.lot.Files[0].filePath).then((res) => res.arrayBuffer());
  // console.log('PDF fetched and buffer created');
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // console.log('PDF loaded');
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  // console.log(`Extracted text from PDF, total pages: ${totalPages}`);
  // try {
  const specs = await extractTenderInfo(text as string);
  // 	const res = await embedding.embedQuery(`${specs.lotName} ${specs.lotDescription} ${specs.lotAdditionalDescription}`);
  // 	console.log('Tender specifications extracted:', specs);

  // 	// Parse and extract text from all files
  // 	const filesWithText = await Promise.all(
  // 		lot.Files.map(async (file) => {
  // 			const fileBuffer = await fetch(file.filePath).then((res) => res.arrayBuffer());
  // 			const filePdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  // 			const { text: fileText } = await extractText(filePdf, { mergePages: true });
  // 			return { ...file, text: fileText };
  // 		}),
  // 	);

  // 	const createdLot = await db
  // 		.insert(lots)
  // 		.values({
  // 			...specs,
  // 			id: lot.id,
  // 			lotNumber: lot.lotNumber,
  // 			budget: lot.amount,
  // 			consultingServices: lot.consultingServices,
  // 			count: lot.count,
  // 			customerBin: lot.customerBin,
  // 			customerId: lot.customerId,
  // 			customerNameRu: lot.customerNameRu,
  // 			enstruList: lot.enstruList,
  // 			files: lot.Files,
  // 			filesWithText: filesWithText, // Updated to include text content
  // 			refLotsStatus: lot.RefLotsStatus,
  // 			refTradeMethods: lot.RefTradeMethods,
  // 			tenderId: lot.trdBuyId,
  // 			trdBuyNumberAnno: lot.trdBuyNumberAnno,
  // 			plnPointKatoList: lot.plnPointKatoList,
  // 			indexDate: lot.indexDate,
  // 			lotName: lot.nameRu,
  // 			embedding: res,
  // 		})
  // 		.returning();
  // 	console.log('Lot created in database:', createdLot);
  // 	await router.handleContractsRecommendations.emit({ lotId: createdLot[0].id });
  // 	// await router.initiatePlagiarismCheck.emit({ lot: createdLot[0] });
  // } catch (err) {
  // 	console.error('Error extracting tender specifications:', err);
  // }
};
