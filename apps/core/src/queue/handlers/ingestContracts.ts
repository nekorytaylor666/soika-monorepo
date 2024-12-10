// ... (keep existing imports and type definitions)
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { db } from "db/connection";
import { contracts, goszakupContracts } from "db/schema/schema";
import { asc, cosineDistance, desc, gt, sql } from "drizzle-orm";
import { chunk } from "lodash";
import { load } from "cheerio";
import {
  extractTenderInfo,
  type TechnicalSpecification,
} from "../../lib/extractSpecs";
import { getDocumentProxy, extractText } from "unpdf";

export type GosZakupContract = {
  id: number;
  contractSum: string;
  contractNumber: string;
  contractNumberSys: string;
  contractMs: string;
  faktSum: string;
  supplierBik: string;
  crdate: string;
  faktExecDate: string;
  finYear: string;
  supplierBiin: string;
  supplierId: number;
  Supplier: {
    bin: string;
    nameRu: string;
    iin: string;
    fullNameRu: string;
    systemId: number;
  };
  ContractUnits: {
    id: number;
    lotId: number;
  }[];
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
  trdBuyNameRu: string;
  customerBik: string;
  descriptionRu: string;
  customerBin: string;
  RefContractStatus: {
    id: number;
    nameRu: string;
  };
  TrdBuy: {
    id: number;
    publishDate: string;
    numberAnno: string;
    nameRu: string;
    idSupplier: number;
    totalSum: string;
    Lots: {
      id: number;
      indexDate: string;
      enstruList: string;
      nameRu: string;
      lotNumber: string;
      systemId: number;
      descriptionRu: string;
      isConstructionWork: boolean;
      customerBin: string;
      isLightIndustry: boolean;
      amount: number;
      trdBuyId: number;
      trdBuyNumberAnno: string;
      unionLots: string;
      Files: {
        systemId: number;
        objectId: number;
        nameRu: string;
        filePath: string;
        id: number;
      }[];
    }[];
  };
};

async function fetchContracts(after?: string) {
  const endpoint = "https://ows.goszakup.gov.kz/v3/graphql";
  const token = "da6b81450fa5bdc80b1a89a9edd9a302";

  const fetchContractsDocument = `
    query Contracts {
      Contract(filter: {
        crdate: ["","2023-12-31"]
        faktTradeMethodsId: [2],
        refContractStatusId: [390],
      }, limit: 50${after ? `, after: ${after}` : ""}) {
        id
        contractSum
        contractNumber
        contractNumberSys
        contractMs
        faktSum
        supplierBik
        crdate
        faktExecDate
        finYear
        supplierBiin
        supplierId
        Supplier {
          bin
          nameRu
          iin
          fullNameRu
          systemId
        }
        ContractUnits {
          id
          lotId
        }
        RefSubjectType {
          nameRu
          id
        }
        Customer {
          systemId
          bin
          iin
          nameRu
          fullNameRu
        }
        trdBuyNameRu
        customerBik
        descriptionRu
        customerBin
        RefContractStatus {
          id
          nameRu
        }
        TrdBuy {
          id
          publishDate
          numberAnno
          nameRu
          idSupplier
          totalSum
          Lots {
            id
            indexDate
            enstruList
            nameRu
            lotNumber
            systemId
            descriptionRu
            isConstructionWork
            customerBin
            isLightIndustry
            amount
            trdBuyId
            trdBuyNumberAnno
            unionLots
            Files {
              systemId
              objectId
              nameRu
              filePath
              id
            }
          }
        }
      }
    }
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: fetchContractsDocument }),
  });

  const responseBody = await response.json();
  return responseBody as {
    data: { Contract: GosZakupContract[] };
    extensions: {
      pageInfo: {
        hasNextPage: boolean;
        lastId: string;
        lastIndexDate: string;
        totalCount: number;
      };
    };
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
  onPage?: (
    contracts: GosZakupContract[],
    progress: { processed: number; total: number },
  ) => Promise<void>;
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
    return fetchAllContracts({
      afterId: nextAfterId,
      contracts,
      onPage,
      totalProcessed: processed,
      totalCount: total,
    });
  }

  return contracts;
}

const embedding = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY, // In Node.js defaults to process.env.OPENAI_API_KEY
  batchSize: 512, // Default value if omitted is 512. Max is 2048
  model: "text-embedding-3-small",
});

async function fetchKtruCode(pid: number, unitId: number) {
  try {
    const response = await fetch(
      "https://goszakup.gov.kz/ru/egzcontract/cpublic/loadunit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
        },
        body: new URLSearchParams({
          pid: pid.toString(),
          unit_id: unitId.toString(),
        }),
      },
    );

    const html = await response.text();
    const $ = load(html);

    const ktruRow = $("tr").filter(
      (_, el) => $(el).find("td:first").text().trim() === "КТРУ",
    );
    const ktruCode = ktruRow.find("td:last").text().trim();

    return ktruCode;
  } catch (error) {
    console.error(
      `Error fetching KTRU code for pid=${pid}, unitId=${unitId}:`,
      error,
    );
    return null;
  }
}

async function processContractBatch(contractBatch: GosZakupContract[]) {
  console.log(`Processing batch of ${contractBatch.length} contracts`);

  try {
    const itemsContracts = contractBatch.filter(
      (el) =>
        el.RefSubjectType.id === 1 &&
        el?.TrdBuy?.Lots?.length > 0 &&
        el?.ContractUnits?.length > 0,
    );
    console.log(`Filtered contracts: ${itemsContracts.length}`);

    if (itemsContracts.length === 0) {
      console.log("No valid contracts in this batch. Skipping.");
      return 0;
    }

    const contractsWithMatchingLots = itemsContracts.map((contract) => ({
      ...contract,
      matchingLots: contract.TrdBuy.Lots.filter((lot) =>
        contract.ContractUnits.some((unit) => unit.lotId === lot.id),
      ),
    }));
    console.log(
      `Contracts with matching lots: ${contractsWithMatchingLots.length}`,
    );

    const lotTexts = contractsWithMatchingLots.flatMap((contract) =>
      contract.matchingLots.map((lot) => `${lot.nameRu} ${lot.descriptionRu}`),
    );

    if (lotTexts.length === 0) {
      console.log("No lot texts to embed. Skipping.");
      return 0;
    }

    const embeddings = await embedding.embedDocuments(lotTexts);

    const contractPromises = [];
    let embeddingIndex = 0;

    for (const contract of contractsWithMatchingLots) {
      for (const lot of contract.matchingLots) {
        const contractUnit = contract.ContractUnits.find(
          (unit) => unit.lotId === lot.id,
        );

        const promise = (async () => {
          try {
            const ktruCode = await fetchKtruCode(
              contract.TrdBuy.id,
              contractUnit?.id || 0,
            );

            // Extract technical specifications from lot files
            let technicalSpecification: TechnicalSpecification | null = null;
            let technicalSpecificationText: string | null = null;
            if (lot.Files?.length > 0) {
              const techSpecFile = lot.Files.find((file) =>
                file.nameRu.toLowerCase().includes("тех"),
              );

              if (techSpecFile) {
                try {
                  const fileBuffer = await fetch(techSpecFile.filePath).then(
                    (res) => res.arrayBuffer(),
                  );
                  const pdf = await getDocumentProxy(
                    new Uint8Array(fileBuffer),
                  );
                  const { text } = await extractText(pdf, { mergePages: true });

                  // technicalSpecification = await extractTenderInfo(text);
                  technicalSpecificationText = text;
                  console.log(
                    `Extracted technical specification for lot ${lot.id} in contract ${contract.id}`,
                  );
                } catch (error) {
                  console.error(
                    `Error extracting technical specification for lot ${lot.id} in contract ${contract.id}:`,
                    error,
                  );
                  // Continue with null technical specification
                }
              }
            }

            return {
              id: contract.id.toString(),
              contractSum: contract.contractSum,
              faktSum: contract.faktSum,
              supplierBik: contract.supplierBik,
              supplierBiin: contract.supplierBiin,
              supplierId: contract.supplierId,
              customerBik: contract.customerBik,
              descriptionRu: contract.descriptionRu,
              customerBin: contract.customerBin,
              refSubjectType: contract.RefSubjectType,
              refContractStatus: contract.RefContractStatus,
              createdAt: new Date(contract.TrdBuy.publishDate),
              trdBuy: {
                id: contract.TrdBuy.id,
                numberAnno: contract.TrdBuy.numberAnno,
                nameRu: contract.TrdBuy.nameRu,
              },
              contractUnit: {
                id: contractUnit?.id || 0,
                lotId: lot.id,
              },
              lot: {
                id: lot.id,
                nameRu: lot.nameRu,
                descriptionRu: lot.descriptionRu,
                ktruCode,
              },
              localContentProjectedShare: contract.contractMs,
              embedding: embeddings[embeddingIndex],
              technicalSpecification,
              technicalSpecificationText: technicalSpecificationText || "",
            };
          } catch (error) {
            console.error(
              `Failed to process contract ${contract.id} lot ${lot.id}:`,
              error,
            );
            return null; // Return null for failed contracts
          }
        })();

        contractPromises.push(promise);
        embeddingIndex++;
      }
    }

    // Filter out failed contracts before inserting
    const results = await Promise.allSettled(contractPromises);
    const contractsToInsert = results
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value);

    if (contractsToInsert.length > 0) {
      await db.insert(goszakupContracts).values(contractsToInsert);
      console.log(`Inserted ${contractsToInsert.length} contracts`);
    }

    const failedCount = results.length - contractsToInsert.length;
    if (failedCount > 0) {
      console.warn(`Failed to process ${failedCount} contracts in this batch`);
    }

    return contractsToInsert.length;
  } catch (error) {
    console.error("Error processing contract batch:", error);
    return 0;
  }
}

export async function ingestContracts() {
  console.log("Ingesting contracts");

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

  console.log(
    `Ingestion complete. Total contracts processed: ${totalProcessed}`,
  );
}
await ingestContracts();
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
