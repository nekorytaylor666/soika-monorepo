import { EVENT_TYPE } from '../../lib/config';
import { fetchAllLots } from '../../lib/goszakupSource';
import { addLotCreationJob } from '../manager';

export async function handleFetchLots() {
	await fetchAllLots({
		async onPage(page) {
			const messages = page.map((lot) => ({ body: { lot, type: EVENT_TYPE.lotCreation } }));
			for (const message of messages) {
				await addLotCreationJob(message.body.lot);
			}
		},
	});
}
