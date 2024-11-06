// ... (keep existing imports and type definitions)
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { db } from 'db/connection';
import { contracts } from 'db/schema/schema';
import { asc, cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { chunk } from 'lodash';

export type GosZakupContract = {
	id: number;
	contractSum: string;
	faktSum: string;
	File: {
		id: number;
		nameRu: string;
		filePath: string;
	};
	supplierBik: string;
	supplierBiin: string;
	supplierId: number;
	Supplier: {
		bin: string;
		nameRu: string;
		iin: string;
		fullNameRu: string;
		systemId: number;
	};
	RefSubjectType: {
		nameRu: string;
		id: number;
	};
	Customer: {
		systemId: number;
		bin: string;
		iin: string;
		nameRu: string;
		fullNameRu: string;
	};
	customerBik: string;
	descriptionRu: string;
	customerBin: string;
	RefContractStatus: {
		id: number;
		nameRu: string;
	};
	TrdBuy: {
		id: number;
		numberAnno: string;
		nameRu: string;
	};
	ContractUnits: {
		id: number;
		lotId: number;
	}[];
};

async function fetchContracts(after?: string) {
	const endpoint = 'https://ows.goszakup.gov.kz/v3/graphql';
	const token = 'da6b81450fa5bdc80b1a89a9edd9a302';

	const fetchContractsDocument = `
    query Contracts {
      Contract(filter: {
        indexDate: ["2024-01-01",""]
        refContractStatusId: [390]
      }, limit: 50${after ? `, after: ${after}` : ''}) {
        id
        contractSum
        faktSum
        supplierBik
        supplierBiin
        supplierId
        Supplier {
          bin
          nameRu
          iin
          fullNameRu
          systemId
        }
        RefSubjectType {
          nameRu
          id
        }
		ContractUnits {
			id
			lotId
		}
        Customer {
          systemId
          bin
          iin
          nameRu
          fullNameRu
        }
        customerBik
        descriptionRu
        customerBin
        RefContractStatus {
          id
          nameRu
        }
        TrdBuy {
          id
          numberAnno
          nameRu
          Lots {
            id
            nameRu
            descriptionRu
          }
        }
      }
    }
  `;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ query: fetchContractsDocument }),
	});

	const responseBody = await response.json();
	return responseBody as {
		data: { Contract: GosZakupContract[] };
		extensions: { pageInfo: { hasNextPage: boolean; lastId: string; lastIndexDate: string; totalCount: number } };
	};
}

export async function fetchAllContracts({
	afterId,
	contracts = [],
	onPage,
	totalProcessed = 0,
	totalCount,
}: {
	afterId?: string;
	contracts?: GosZakupContract[];
	onPage?: (contracts: GosZakupContract[], progress: { processed: number; total: number }) => Promise<void>;
	totalProcessed?: number;
	totalCount?: number;
}) {
	const cursor = await fetchContracts(afterId);
	contracts.push(...cursor.data.Contract);

	const processed = totalProcessed + cursor.data.Contract.length;
	const total = totalCount || cursor.extensions.pageInfo.totalCount;

	console.log(`Progress: ${processed}/${total} contracts processed`);

	if (onPage) {
		await onPage(cursor.data.Contract, { processed, total });
	}

	if (cursor.extensions.pageInfo.hasNextPage) {
		const nextAfterId = cursor.extensions.pageInfo.lastId;
		return fetchAllContracts({ afterId: nextAfterId, contracts, onPage, totalProcessed: processed, totalCount: total });
	}

	return contracts;
}

const embedding = new OpenAIEmbeddings({
	apiKey: process.env.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
	batchSize: 512, // Default value if omitted is 512. Max is 2048
	model: 'text-embedding-3-small',
});

async function processContractBatch(contractBatch: GosZakupContract[]) {
	console.log(`Processing batch of ${contractBatch.length} contracts`);

	try {
		const itemsContracts = contractBatch.filter(
			(el) => el.RefSubjectType.id === 1 && el?.TrdBuy?.Lots?.length > 0 && el?.ContractUnits?.length > 0,
		);
		console.log(`Filtered contracts: ${itemsContracts.length}`);

		if (itemsContracts.length === 0) {
			console.log('No valid contracts in this batch. Skipping.');
			return 0;
		}

		const contractsWithMatchingLots = itemsContracts.map((contract) => ({
			...contract,
			matchingLots: contract.TrdBuy.Lots.filter((lot) => contract.ContractUnits.some((unit) => unit.lotId === lot.id)),
		}));
		console.log(`Contracts with matching lots: ${contractsWithMatchingLots.length}`);

		const lotTexts = contractsWithMatchingLots.flatMap((contract) =>
			contract.matchingLots.map((lot) => `${lot.nameRu} ${lot.descriptionRu}`),
		);

		if (lotTexts.length === 0) {
			console.log('No lot texts to embed. Skipping.');
			return 0;
		}

		const embeddings = await embedding.embedDocuments(lotTexts);

		const contractsToInsert = contractsWithMatchingLots.flatMap((contract) =>
			contract.matchingLots.map((lot, index) => ({
				...contract,
				trdBuy: { ...contract.TrdBuy, Lots: undefined },
				embedding: embeddings[index],
				refContractStatus: contract.RefContractStatus,
				refSubjectType: contract.RefSubjectType,
				contractUnit: contract.ContractUnits.find((unit) => unit.lotId === lot.id),
				lot: lot,
			})),
		);

		if (contractsToInsert.length > 0) {
			await db.insert(contracts).values(contractsToInsert);
			console.log(`Inserted ${contractsToInsert.length} contracts`);
		} else {
			console.log('No contracts to insert after processing.');
		}

		return contractsToInsert.length;
	} catch (error) {
		console.error('Error processing contract batch:', error);
		// You could implement retry logic here if needed
		return 0;
	}
}

export async function ingestContracts() {
	console.log('Ingesting contracts');

	const batchSize = 100; // Adjust based on your system's capabilities
	let totalProcessed = 0;

	await fetchAllContracts({
		async onPage(page, progress) {
			const batches = chunk(page, batchSize);

			for (const batch of batches) {
				const batchProcessed = await processContractBatch(batch);
				totalProcessed += batchProcessed;

				console.log(`Processed ${batchProcessed} contracts in this batch`);
				console.log(
					`Total progress: ${progress.processed}/${progress.total} contracts (${((progress.processed / progress.total) * 100).toFixed(2)}%)`,
				);
			}
		},
	});

	console.log(`Ingestion complete. Total contracts processed: ${totalProcessed}`);
// }

// const testSimilaritySearch = async () => {
// 	// Fetch the first contract from the database
// 	const firstContractQuery = sql`
//     SELECT id,description_ru, embedding
//     FROM contracts
//     LIMIT 1
//   `;
// 	const [firstContract] = await db.execute(firstContractQuery);

// 	if (!firstContract) {
// 		console.log('No contracts found in the database.');
// 		return;
// 	}

// 	console.log('First contract:', firstContract);

// 	// Use the embedding of the first contract for similarity search
// 	const query = sql`
//     SELECT
//       id,
// 	  description_ru,
//       embedding <=> ${firstContract.embedding} as similarity
//     FROM contracts
//     ORDER BY similarity
// 	limit 50
//   `;

// 	const similarContracts = await db.execute(query);
// 	console.log('Similar contracts:', similarContracts);

// 	return { firstContract, similarContracts };
// };

// // Run the test
// const result = await testSimilaritySearch();
// console.log('Test result:', result);
// const contractCount = await db.select({ count: sql<number>`count(*)` }).from(contracts);
// console.log(`Total number of contracts in the database: ${contractCount[0].count}`);

// Test the search

// ... (keep the rest of the existing code)
