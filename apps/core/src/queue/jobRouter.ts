import { z } from 'zod';
import { createJobRouter, defineJob } from 'jobs/jobRouter';
import { handleLotCreation } from './handlers/lotCreation';
import { initiatePlagiarismCheck } from '../lib/plagiarism';
import { handleTextRuProductParsing } from './handlers/lotTextRuProducts';
import { fetchAllLots } from '../lib/goszakupSource';
import { lots, scheduleFrequencyEnumSchema } from 'db/schema/schema';
import { performScheduledSearch, scheduledSearch } from './handlers/scheduledSearch';
import { findSimilarGuides, ingestContracts, processContractBatch } from './handlers/newIngestContracts';
import { chunk } from 'lodash';
import { db } from 'db/connection';
import { eq } from 'drizzle-orm';

// Redis connection configuration
const connection = {
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT) || 6379,
};

// Create job router
const jobRouter = createJobRouter('mainQueue', connection, {
	createLot: defineJob(z.object({ lot: z.any() })).handler(async (input) => {
		console.log('Creating lot:', input.lot);
		handleLotCreation({ lot: input.lot });
		// Implement your lot creation logic here
	}),
	initiatePlagiarismCheck: defineJob(z.object({ lot: z.any() })).handler(async (input) => {
		console.log('Initiating plagiarism check:', input.lot);
		initiatePlagiarismCheck(input.lot);
	}),
	handleTextRuProductParsing: defineJob(z.object({ lotId: z.string() })).handler(async (input) => {
		console.log('Handling text.ru product parsing:', input.lotId);
		handleTextRuProductParsing({ lotId: input.lotId });
	}),
	fetchLots: defineJob(z.object({})).handler(async (input) => {
		console.log('Fetching lots');
		const lots = [];
		await fetchAllLots({
			async onPage(page) {
				if (page.length > 0) {
					const firstLot = page[0];
					lots.push(firstLot);
					await router.createLot.emit({ lot: firstLot });
				}
				// Push the rest of the lots without triggering create lot event
				for (let i = 1; i < page.length; i++) {
					lots.push(page[i]);
				}
			},
		});
		// await router.createLot.emit({ lot: lots[0] });
	}),
	handleContractsRecommendations: defineJob(z.object({ lotId: z.number() })).handler(async (input) => {
		const lot = await db.query.lots.findFirst({
			where: eq(lots.id, input.lotId),
		});
		if (!lot) {
			console.error('Lot not found:', input.lotId);
			return;
		}

		console.log('Handling contracts recommendations');
		// console.log('Similar guides:', similarGuides);
	}),
	handleCompanyIndex: defineJob(z.object({ bin: z.string(), organizationId: z.string() })).handler(async (input) => {
		console.log('Handling company index:', input);
		// handleCompanyIndex(input);
	}),
	scheduledSearch: defineJob(z.object({ frequency: scheduleFrequencyEnumSchema })).handler(async (input) => {
		console.log('Scheduled search');
		scheduledSearch(input.frequency);
	}),
	performScheduledSearch: defineJob(z.object({ scheduleId: z.string() })).handler(async (input) => {
		console.log('Performing scheduled search:', input.scheduleId);
		await performScheduledSearch(input.scheduleId);
	}),
	processContractBatch: defineJob(z.object({ batch: z.array(z.any()) })).handler(async (input) => {
		await processContractBatch(input.batch);
	}),
	sendScheduledSearchResults: defineJob(z.object({ scheduleId: z.string() })).handler(async (input) => {
		console.log('Sending scheduled search results:', input.scheduleId);
		await sendScheduledSearchResults(input.scheduleId);
	}),
});

const { router, queue } = jobRouter;
jobRouter.buildWorkers();

// Export the router for use in other files
export { router, jobRouter };
