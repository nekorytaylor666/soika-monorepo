import { db } from 'db/connection';
import { lots, recommendedProducts } from 'db/schema/schema';
import { eq } from 'drizzle-orm';
import { evaluateProductCompliance } from '../../lib/compliance';
import { findSimilarGuides } from '../handlers/newIngestContracts';
import axios from 'axios';
import { JSDOM } from 'jsdom';

async function extractTechnicalSpecification(contractId: string, contractUnit: string) {
	const url = `https://goszakup.gov.kz/ru/egzcontract/cpublic/loadunit`;
	const response = await axios.post(url, `pid=${contractId}&unit_id=${contractUnit}`, {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			// Add other necessary headers here
		},
	});

	const dom = new JSDOM(response.data);
	const document = dom.window.document;
	const techSpecLink = document.querySelector('a[href*="techspec"]')?.getAttribute('href');

	if (techSpecLink) {
		// You might want to download and parse the PDF here
		// For now, we'll just return the link
		return techSpecLink;
	}

	return null;
}

export async function handleContractRecommendation(body: { lotId: string }) {
	console.log('Starting handleContractRecommendation for lotId:', body.lotId);
	const lotId = Number.parseInt(body.lotId);

	const lot = await db.query.lots.findFirst({
		where: eq(lots.id, lotId),
	});

	if (!lot) {
		console.log(`Lot ${lotId} not found`);
		return;
	}

	console.log('Lot found:', lot);

	const similarContracts = await findSimilarGuides(lot.lotName || '');
	console.log('Similar contracts found:', similarContracts);

	if (similarContracts.length === 0) {
		console.log(`No similar contracts found for lot ${lotId}`);
		return;
	}

	const bestMatch = similarContracts[0];

	// Extract technical specification
	const techSpecLink = await extractTechnicalSpecification(bestMatch?.id?.toString(), bestMatch.contractUnit?.id?.toString() || '');
	console.log('Technical specification link:', techSpecLink);

	// console.log('Evaluating product compliance');
	// const compliance = await evaluateProductCompliance(bestMatch.contractUnit || '', lot.lotSpecifications || '');
	// console.log('Compliance evaluation result:', compliance);

	// const result = await db
	// 	.insert(recommendedProducts)
	// 	.values({
	// 		lotId: lotId,
	// 		productName: bestMatch.lotNameRu || '',
	// 		productDescription: bestMatch.lot || '',
	// 		productSpecifications: bestMatch.contractUnit || '',
	// 		sourceUrl: techSpecLink || '', // Use the extracted tech spec link
	// 		price: 0, // Price information might not be available
	// 		unitOfMeasure: '', // Unit of measure might not be available
	// 		currency: '', // Currency might not be available
	// 		complianceScore: compliance.compliance_score,
	// 		complianceDetails: compliance.compliance_details,
	// 	})
	// 	.returning();

	// console.log('Inserted recommended product:', result);
	// return result;
}
