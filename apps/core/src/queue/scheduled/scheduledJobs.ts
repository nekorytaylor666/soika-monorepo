import { router } from '../jobRouter.old';

export function scheduledSearches() {
	// Daily search at midnight
	router.scheduledSearch.emit(
		{ frequency: 'daily' },
		{
			repeat: {
				pattern: '0 0 * * *',
			},
		},
	);

	// Weekly search on Sunday at 1 AM
	router.scheduledSearch.emit(
		{ frequency: 'weekly' },
		{
			repeat: {
				pattern: '0 1 * * 0',
			},
		},
	);

	// Monthly search on the 1st of each month at 2 AM
	router.scheduledSearch.emit(
		{ frequency: 'monthly' },
		{
			repeat: {
				pattern: '0 2 1 * *',
			},
		},
	);
}
