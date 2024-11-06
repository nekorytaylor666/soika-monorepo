import { z } from 'zod';
import { createJobRouter, defineJob } from 'jobs/jobRouter.new';
import { handleLotCreation } from './handlers/lotCreation';
import { initiatePlagiarismCheck } from '../lib/plagiarism';
import { handleTextRuProductParsing } from './handlers/lotTextRuProducts';
import { fetchAllLots } from '../lib/goszakupSource';
import { lots, scheduleFrequencyEnumSchema } from 'db/schema/schema';
import { performScheduledSearch, scheduledSearch } from './handlers/scheduledSearch';
import { processContractBatch } from './handlers/newIngestContracts';
import { db } from 'db/connection';
import { eq } from 'drizzle-orm';
import { handleContractRecommendation } from './handlers/handleContractRecommendation';
import { handleCompanyIndex } from './handlers/companyIndex';

// RabbitMQ connection configuration
const connectionString = process.env.RABBITMQ_URL || 'amqp://localhost';

// Create job router
const jobRouter = await createJobRouter('mainQueue', connectionString, {
	// createLot: defineJob(z.object({ lot: z.any() })).handler(async (input) => {
	// 	console.log('Creating lot:', input.lot);
	// 	await handleLotCreation({ lot: input.lot });
	// }),
	// initiatePlagiarismCheck: defineJob(z.object({ lot: z.any() })).handler(async (input) => {
	// 	console.log('Initiating plagiarism check:', input.lot);
	// 	await initiatePlagiarismCheck(input.lot);
	// }),
	// handleTextRuProductParsing: defineJob(z.object({ lotId: z.string() })).handler(async (input) => {
	// 	console.log('Handling text.ru product parsing:', input.lotId);
	// 	await handleTextRuProductParsing({ lotId: input.lotId });
	// }),
	// fetchLots: defineJob(z.object({})).handler(async () => {
	// 	console.log('Fetching lots');
	// 	await fetchAllLots({
	// 		async onPage(page) {
	// 			await jobRouter.router.createLot.emit({ lot: page[0] });
	// 		},
	// 	});
	// }),
	// handleContractsRecommendations: defineJob(z.object({ lotId: z.number() })).handler(async (input) => {
	// 	console.log('Handling contracts recommendations:', input.lotId);
	// 	const lot = await db.query.lots.findFirst({
	// 		where: eq(lots.id, input.lotId),
	// 	});
	// 	console.log('Lot:', lot);
	// 	if (!lot) {
	// 		console.error('Lot not found:', input.lotId);
	// 		return;
	// 	}

	// 	console.log('Handling contracts recommendations');
	// 	// console.log('Similar guides:', similarGuides);
	// 	await handleContractRecommendation({ lotId: input.lotId.toString() });
	// }),
	// handleCompanyIndex: defineJob(z.object({ bin: z.string(), organizationId: z.string() })).handler(async (input) => {
	// 	console.log('Handling company index:', input);
	// 	await handleCompanyIndex({ type: 'companyIndex', bin: input.bin, organizationId: input.organizationId });
	// }),
	// scheduledSearch: defineJob(z.object({ frequency: scheduleFrequencyEnumSchema })).handler(async (input) => {
	// 	console.log('Scheduled search');
	// 	await scheduledSearch(input.frequency);
	// }),
	// performScheduledSearch: defineJob(z.object({ scheduleId: z.string() })).handler(async (input) => {
	// 	console.log('Performing scheduled search:', input.scheduleId);
	// 	await performScheduledSearch(input.scheduleId);
	// }),
	// processContractBatch: defineJob(z.object({ batch: z.array(z.any()) })).handler(async (input) => {
	// 	await processContractBatch(input.batch);
	// }),
	// sendScheduledSearchResults: defineJob(z.object({ scheduleId: z.string() })).handler(async (input) => {
	// 	console.log('Sending scheduled search results:', input.scheduleId);
	// 	await sendScheduledSearchResults(input.scheduleId);
	// }),
	test: defineJob(z.object({})).handler(async (_, { router }) => {
		console.log('test');
		for (let i = 0; i < 100; i++) {
			await router.test2.emit({});
		}
	}),
	test2: defineJob(z.object({})).handler(async (_, { router }) => {
		console.log('test2');
		// Simulating an error condition
		if (Math.random() < 0.5) {
			throw new Error('Test error in test2 job');
		}
		// Example of emitting another job from within a handler
		await router.test3.emit({ message: 'Hello from test2!' });
	}),
	test3: defineJob(z.object({ message: z.string() })).handler(async (input, { router }) => {
		console.log('test3 received message:', input.message);
		// You can emit more jobs here if needed
	}),
});
// await jobRouter.startConsumers().catch(console.error);
async function testJobRouter() {
	try {
		// Emit a test job
		await jobRouter.router.test.emit({});
		console.log('Test job emitted');
	} catch (error) {
		console.error('Error in testJobRouter:', error);
	}
}

// Run the test
await testJobRouter();

// Export the router for use in other files
export const router = jobRouter.router;

// Build workers
