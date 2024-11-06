import { Queue, Worker, type Job } from 'bullmq';
import { EVENT_TYPE, type MessageType } from '../lib/config';
import { handleLotCreation } from './handlers/lotCreation';
import { handleTextRuProductParsing } from './handlers/lotTextRuProducts';
import { handleFetchLots } from './handlers/lotsFetch';
import { handleCompanyIndex } from './handlers/companyIndex';

export const queueName = 'soikaLotProcessingQueue';

const connection = {
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT) || 6379,
};

export const queue = new Queue(queueName, { connection });

export const worker = new Worker(
	queueName,
	async (job: Job) => {
		console.log(job.data);
		switch (job.name) {
			case EVENT_TYPE.lotCreation:
				await handleLotCreation(job.data as MessageType<typeof EVENT_TYPE.lotCreation>);
				break;
			// case EVENT_TYPE.parseProducts:
			// 	await handleTextRuProductParsing(job.data as MessageType<typeof EVENT_TYPE.parseProducts>);
			// 	break;
			case EVENT_TYPE.fetchLots:
				await handleFetchLots();
				break;
			case EVENT_TYPE.companyIndex:
				// console.log('companyIndex', job.data);
				await handleCompanyIndex(job.data as MessageType<typeof EVENT_TYPE.companyIndex>);
				break;
			// case EVENT_TYPE.scheduleCompanyIndex:
			// 	await handleScheduleCompanyIndex();
			// 	break;
			default:
				throw new Error(`Unsupported job type: ${job.name}`);
		}
	},
	{
		connection,
		removeOnFail: { count: 1 },
		concurrency: 100,
	}
);

export async function addLotCreationJob(lot: MessageType<typeof EVENT_TYPE.lotCreation>['lot']) {
	await queue.add(EVENT_TYPE.lotCreation, { lot });
}

export async function addTextRuProductParsingJob(lotId: MessageType<typeof EVENT_TYPE.parseProducts>['lotId']) {
	await queue.add(EVENT_TYPE.parseProducts, { lotId });
}

export async function addFetchLotsJob() {
	await queue.add(EVENT_TYPE.fetchLots, {});
}

export async function addCompanyIndexJob(
	bin: MessageType<typeof EVENT_TYPE.companyIndex>['bin'],
	organizationId: MessageType<typeof EVENT_TYPE.companyIndex>['organizationId']
) {
	await queue.add(EVENT_TYPE.companyIndex, { bin, organizationId });
}

export async function addScheduleCompanyIndexJob() {
	await queue.add(EVENT_TYPE.scheduleCompanyIndex, {});
}

worker.on('completed', (job) => {
	console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
	console.log(`Job ${job?.id} has failed with ${err.message}`);
});
