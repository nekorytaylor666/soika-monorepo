import { getDocumentProxy, extractText } from 'unpdf';
import { db } from 'db/connection';
import { lots } from 'db/schema/schema';
import type { EVENT_TYPE, MessageType } from '../../lib/config';
import { extractTenderInfo } from '../../lib/extractSpecs';
import { initiatePlagiarismCheck } from '../../lib/plagiarism';
import { router } from '../jobRouter';

export const handleLotCreation = async (body: { lot: GosZakupLot }) => {
	// console.log('Starting handleLotCreation for lot:', body.lot);
	// const { lot } = body;
	// if (lot.nameRu.includes('услуги') || lot.nameRu.includes('работы') || lot.nameRu.includes('Услуги') || lot.nameRu.includes('Работы')) {
	// 	console.log('Skipping lot due to inclusion of услуги or работы in the name');
	// 	return;
	// }
	// const technicalSpecFile = body.lot.Files.find((file) => file.nameRu.includes('Техническая спецификация'));
	// if (!technicalSpecFile) {
	// 	console.log('Technical specification file not found');
	// 	return;
	// }
	// console.log('Technical specification file found:', technicalSpecFile.nameRu);
	// const buffer = await fetch(body.lot.Files[0].filePath).then((res) => res.arrayBuffer());
	// console.log('PDF fetched and buffer created');
	// const pdf = await getDocumentProxy(new Uint8Array(buffer));
	// console.log('PDF loaded');
	// const { totalPages, text } = await extractText(pdf, { mergePages: true });
	// console.log(`Extracted text from PDF, total pages: ${totalPages}`);
	// try {
	// 	const specs = await extractTenderInfo(text as string);
	// 	console.log('Tender specifications extracted:', specs);
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
	// 			refLotsStatus: lot.RefLotsStatus,
	// 			refTradeMethods: lot.RefTradeMethods,
	// 			tenderId: lot.trdBuyId,
	// 			trdBuyNumberAnno: lot.trdBuyNumberAnno,
	// 			plnPointKatoList: lot.plnPointKatoList,
	// 			indexDate: lot.indexDate,
	// 			lotName: lot.nameRu,
	// 		})
	// 		.returning();
	// 	console.log('Lot created in database:', createdLot);
	// 	await router.initiatePlagiarismCheck.emit({ lot: createdLot[0] });
	// } catch (err) {
	// 	console.error('Error extracting tender specifications:', err);
	// }
};
