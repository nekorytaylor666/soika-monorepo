import { Hono } from "hono";
import { MilvusClient, DataType, sleep } from "@zilliz/milvus2-sdk-node";
import { OpenAI } from "openai";
import axios from "axios";
import { db } from "db/connection";
import { recommendedLots } from "db/schema";
import { EVENT_TYPE, MessageType } from "../../lib/config";
import { addCompanyIndexJob } from "../manager";
import { router } from "../jobRouter.old";

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const milvusClient = new MilvusClient({
  address: "localhost:19530",
  ssl: false,
  timeout: 10000,
});

async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data.map((data) => data.embedding);
}

async function createPartition(bin: string): Promise<void> {
  await milvusClient.createPartition({
    collection_name: "tender_lots",
    partition_name: bin,
  });
  console.log(`Created partition for BIN: ${bin}`);
}

async function ingestData(bin: string): Promise<void> {
  // Check if the collection exists
  // const hasCollection = await milvusClient.hasCollection({
  // 	collection_name: 'tender_lots',
  // });
  // console.log(`Has collection for BIN: ${bin}`);

  // if (!hasCollection) {
  // 	console.error("Collection 'tender_lots' does not exist. Creating it now...");
  // 	await createMilvusCollection();
  // }

  const result = await fetchLotsData(bin);

  // Extract lots from the response
  const lots = result.data.Contract.flatMap((contract) =>
    contract.TrdBuy.Lots.map((lot) => ({
      id: lot.id,
      name: lot.nameRu,
      description: lot.descriptionRu,
      contract_id: contract.id,
    })),
  );
  console.log(JSON.stringify(lots, null, 2));

  // Create embeddings for lots in batches
  const batchSize = 100;
  const lotEmbeddings = [];

  console.log("Creating embeddings...");
  for (let i = 0; i < lots.length; i += batchSize) {
    const batch = lots.slice(i, i + batchSize);
    const texts = batch.map((lot) => `${lot.name} ${lot.description}`);
    const embeddings = await createEmbeddings(texts);

    for (let j = 0; j < batch.length; j++) {
      lotEmbeddings.push({
        id: batch[j].id,
        vector: embeddings[j],
        text: `${batch[j].name} ${batch[j].description}`,
        contract_id: batch[j].contract_id,
      });
    }

    console.log(`Processed ${i + batch.length} of ${lots.length} lots`);
  }

  // Insert embeddings into Milvus
  const insertBatchSize = 50;
  console.log("Inserting embeddings into Milvus...");
  for (let i = 0; i < lotEmbeddings.length; i += insertBatchSize) {
    const batch = lotEmbeddings.slice(i, i + insertBatchSize);
    try {
      const insertResult = await milvusClient.insert({
        collection_name: "tender_lots",
        partition_name: bin,
        data: batch,
      });
      console.log(
        `Inserted ${i + batch.length} of ${lotEmbeddings.length} embeddings. Insert result:`,
      );
    } catch (error) {
      console.error(`Error inserting batch ${i / insertBatchSize + 1}:`, error);
      throw error;
    }
  }

  console.log(
    `Total inserted: ${lotEmbeddings.length} lot embeddings into Milvus for BIN: ${bin}`,
  );
}

async function fetchLotsData(bin: string): Promise<any> {
  const url = "https://ows.goszakup.gov.kz/v3/graphql";
  const headers = {
    Authorization: "Bearer da6b81450fa5bdc80b1a89a9edd9a302",
    "Content-Type": "application/json",
  };
  const cookies = {
    _csrf: "lfj3tzBMilnl-9DbRXVjRKvzcQucFE8T",
  };

  const query = `
    query TrdBuy {
      Contract(filter: {supplierBiin: "${bin}", faktTradeMethodsId: [3, 2]}, limit: 30000) {
        id
        crdate
        trdBuyNameRu
        contractSum
        TrdBuy {
          id
          totalSum
          Lots {
            id
            amount
            count
            nameRu
            descriptionRu
          }
        }
        contractNumber
        RefContractStatus {
          nameRu
        }
        descriptionRu
      }
    }
  `;

  try {
    const response = await axios.post(
      url,
      { query },
      {
        headers,
        withCredentials: true,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching lots data:", error);
    throw error;
  }
}

async function createMilvusCollection(): Promise<void> {
  const collectionName = "tender_lots";
  const dim = 1536; // Dimension of the embedding vector, adjust if needed

  // Define the fields for the collection
  const fields = [
    {
      name: "id",
      description: "Unique ID for each lot",
      data_type: DataType.Int64,
      is_primary_key: true,
      auto_id: false,
    },
    {
      name: "vector",
      description: "Embedding vector of the lot text",
      data_type: DataType.FloatVector,
      dim: dim,
    },
    {
      name: "text",
      description: "Original text of the lot",
      data_type: DataType.VarChar,
      max_length: 65535, // Adjust based on your needs
    },
    {
      name: "contract_id",
      description: "ID of the associated contract",
      data_type: DataType.Int64,
    },
  ];

  // Create the collection
  const resCollection = await milvusClient.createCollection({
    collection_name: collectionName,
    fields: fields,
    metric_type: "IP",
  });
  console.log(resCollection);

  const resIndex = await milvusClient.createIndex({
    collection_name: collectionName,
    field_name: "vector",
    index_type: "IVF_FLAT",
    metric_type: "IP",
    index_name: "vector_index",
    params: { nlist: 128 },
  });

  console.log(resIndex);

  console.log(`Collection ${collectionName} created successfully.`);
}

async function searchSimilarLots(
  queryTexts: string[],
  bin: string,
  topK: number = 20,
): Promise<any[]> {
  const queryEmbeddings = await createEmbeddings(queryTexts);

  try {
    const res = await milvusClient.search({
      collection_name: "tender_lots",
      vectors: queryEmbeddings,
      search_params: {
        anns_field: "vector",
        topk: "5",
        metric_type: "IP",
        params: JSON.stringify({ nprobe: 8 }),
      },
      topk: topK,
      partition_names: [bin],
      vector_type: DataType.FloatVector,
      output_fields: ["id", "text", "contract_id"],
    });
    console.log(res);
    return res.results;
  } catch (error) {
    console.error("Error during search:", error);
    return [];
  }
}

async function fetchNewLots(): Promise<any[]> {
  const url = "https://ows.goszakup.gov.kz/v3/graphql";
  const headers = {
    Authorization: "Bearer da6b81450fa5bdc80b1a89a9edd9a302",
    "Content-Type": "application/json",
  };
  const cookies = {
    _csrf: "lfj3tzBMilnl-9DbRXVjRKvzcQucFE8T",
  };
  const today = new Date();
  today.setDate(today.getDate() - 1);
  const yesterday = today.toISOString().split("T")[0];

  const query = `
    query Lots {
      Lots(filter: {
        amount: 100000,
        refTradeMethodsId: [3,2],
      }, limit: 30000){
       	id
		consultingServices
		descriptionRu
		amount
		nameRu
		lotNumber
		consultingServices
		customerId
		customerBin
		customerNameRu
		RefBuyTradeMethods {
			nameRu
			id
		}
		RefTradeMethods {
			nameRu
			id
			code
		}
		TrdBuy {
			id
			startDate
			endDate
			discusStartDate
			discusEndDate
			totalSum
			RefBuyStatus {
				code
				nameRu
				id
			}
		}
      }
    }
  `;

  try {
    const response = await axios.post(
      url,
      { query },
      { headers, withCredentials: true },
    );
    return response.data.data.Lots;
  } catch (error) {
    console.error("Error fetching new lots:", error);
    throw error;
  }
}
async function generateRecommendationReport(bin: string): Promise<any[]> {
  const newLots = await fetchNewLots();
  console.log(newLots.length);
  const lotsWithSimilarResults = [];
  const batchSize = 200;
  const res = await milvusClient.loadPartitions({
    collection_name: "tender_lots",
    partition_names: [bin],
  });
  console.log(res);

  await sleep(1000);

  for (let i = 0; i < newLots.length; i += batchSize) {
    const batch = newLots.slice(i, i + batchSize);
    const searchQueries = batch.map((lot) =>
      `${lot.nameRu} ${lot.descriptionRu || ""}`.trim(),
    );

    const searchResults = await searchSimilarLots(searchQueries, bin);

    for (let j = 0; j < batch.length; j++) {
      const lot = batch[j];
      const results = searchResults[j];
      const similarResults = results.filter((hit: any) => hit.score > 0.8);

      if (similarResults.length > 0) {
        lotsWithSimilarResults.push({
          original_lot: {
            id: lot.id,
            name: lot.nameRu,
            description: lot.descriptionRu,
            amount: lot.amount,
            customerName: lot.customerNameRu,
            tradeMethod: lot.RefTradeMethods.nameRu,
            trdBuyId: lot.TrdBuy.id,
            trdBuyStartDate: lot.TrdBuy.startDate,
            trdBuyEndDate: lot.TrdBuy.endDate,
            trdBuyTotalSum: lot.TrdBuy.totalSum,
          },
          similar_lots: similarResults,
        });
      }
    }
  }
  await milvusClient.releasePartitions({
    collection_name: "tender_lots",
    partition_names: [bin],
  });

  return lotsWithSimilarResults;
}

export async function handleCompanyIndex(
  data: MessageType<typeof EVENT_TYPE.companyIndex>,
) {
  console.log("handleCompanyIndex", data);
  const report = await generateRecommendationReport(data.bin);
  const res = await db
    .insert(recommendedLots)
    .values({
      organizationId: data.organizationId,
      results: report,
      createdAt: new Date(),
    })
    .returning();
  console.log(res);
}

const app = new Hono();

app.post("/ingest_data", async (c) => {
  const bin = c.req.query("bin");
  if (!bin) {
    return c.text("BIN parameter is required", 400);
  }

  try {
    await createPartition(bin);
    await ingestData(bin);
    return c.text(`Data ingested for BIN: ${bin}`);
  } catch (e) {
    console.error(`Error ingesting data:`, e);
    return c.text(`Error ingesting data: ${e.message}`, 500);
  }
});

app.post("/generate_recommendation_report", async (c) => {
  const { bin, organizationId } = await c.req.json();
  if (!bin) {
    return c.text("BIN parameter is required", 400);
  }
  if (!organizationId) {
    return c.text("organizationId parameter is required", 400);
  }
  // await addCompanyIndexJob(bin, organizationId);
  await router.handleCompanyIndex.emit({ bin, organizationId });
  return c.json({ message: "Job added to queue" });
});

app.get("/create_milvus_collection", async (c) => {
  try {
    // await milvusClient.connectPromise;
    // await createMilvusCollection();
    return c.text("Milvus collection created successfully");
  } catch (e) {
    console.error(`Error creating Milvus collection: ${e}`);
    return c.text("Error creating Milvus collection", 500);
  }
});

export default app;
