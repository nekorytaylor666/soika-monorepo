import FirecrawlApp from '@mendable/firecrawl-js';

export async function scrapeUrl(url: string) {
	try {
		const app = new FirecrawlApp({ apiKey: 'fc-a5a2feafb5164972a9ff0510fd500ab5' });
		const extractResult = await app.scrapeUrl(url, {
			extractorOptions: {
				mode: 'llm-extraction',
				extractionPrompt: 'Based on the information on the page, extract the information from the schema. ',
				extractionSchema: {
					type: 'object',
					properties: {
						productName: {
							type: 'string',
						},
						productDescription: {
							type: 'string',
						},
						price: {
							type: 'number',
						},
						productSpecifications: {
							type: 'string',
						},
						currency: {
							type: 'string',
						},
						unitOfMeasure: {
							type: 'string',
						},
						isTender: {
							type: 'boolean',
						},
					},
					required: ['productName', 'productDescription', 'productSpecifications'],
				},
			},
		});

		if (extractResult.success) {
			return extractResult.data;
		} else {
			throw new Error('Failed to scrape URL');
		}
	} catch (error) {
		console.log(error);
	}
}
console.log(
	await scrapeUrl(
		'https://in-home.ru/products/osveshchenie-dlya-doma/svetilniki-dekorativnye/potolochnye-svetilniki/svetilnik-svetodiodnyy-comfort-mystery-rgb-80vt-230v-3000-6500k-6000lm-500x80mm-s-pultom-du-in-home'
	)
);
