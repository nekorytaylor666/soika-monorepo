import type { Lot } from 'db/schema/schema';

export async function initiatePlagiarismCheck(lot: Lot) {
	const exceptdomain = ['goszakup.gov.kz', 'tenderbot.kz', 'tads.kz'].join(',');
	const callback = `https://f323z7g4-3000.inc1.devtunnels.ms/plagiarism/callback/${lot.id}`;
	const text = `${lot.lotName} ${lot.lotDescription} ${lot.lotAdditionalDescription} ${lot.lotSpecifications}`;
	console.log(text);
	const plagiarismCheckData = {
		text,
		userkey: '74db24466512538c26c2f446921a5877',
		callback,
		exceptdomain,
	};

	const response = await fetch('http://api.text.ru/post', {
		headers: {
			'Content-Type': 'application/json',
		},
		method: 'POST',
		body: JSON.stringify(plagiarismCheckData),
	});
	console.log(response);

	if (!response.ok) {
		console.debug(`Failed to initiate plagiarism check for lot ${lot.id}`);
		throw new Error('Failed to initiate plagiarism check');
	}

	// biome-ignore lint/style/useNamingConvention: response from external api
	const job = (await response.json()) as { text_uid: string };
	console.debug(`Plagiarism check initiated for lot ${lot.id}. Job: ${JSON.stringify(job)}`);

	return job;
}
