import { and, asc, cosineDistance, desc, eq, gt, lt, sql } from "drizzle-orm";
import { lots, recommendedProducts } from "db/schema";
import { db } from "db/connection";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function performSearch(
  query: string,
  options: {
    limit: number;
    offset: number;
    minBudget?: number | null;
    maxBudget?: number | null;
    tradeMethod?: number | null;
    withRecommendations?: boolean;
  },
) {
  const {
    limit,
    offset,
    minBudget,
    maxBudget,
    tradeMethod,
    withRecommendations,
  } = options;

  if (query === "") {
    return {
      results: [],
      totalCount: 0,
    };
  }

  const startTime = performance.now();

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const columns = {
    id: true,
    lotName: true,
    lotDescription: true,
    lotAdditionalDescription: true,
    budget: true,
  };

  const embeddingPromise = embeddings.embedQuery(query);

  const keywordResultsPromise = db.query.lots.findMany({
    where: (table, { inArray }) =>
      and(
        withRecommendations
          ? inArray(
              table.id,
              db
                .select({ lotId: recommendedProducts.lotId })
                .from(recommendedProducts),
            )
          : undefined,
        sql`to_tsvector('russian', ${lots.lotName} || ' ' || ${lots.lotDescription} || ' ' || ${lots.lotAdditionalDescription}) @@ plainto_tsquery('russian', ${query})`,
        minBudget ? gt(table.budget, minBudget) : undefined,
        maxBudget ? lt(table.budget, maxBudget) : undefined,
        tradeMethod
          ? sql`ref_trade_methods ->> 'id' = ${tradeMethod}`
          : undefined,
      ),
    with: {
      recommendedProducts: {
        columns: {
          id: true,
        },
      },
    },
    columns,
    limit: 25,
    orderBy: desc(
      sql`ts_rank_cd(to_tsvector('russian', ${lots.lotName} || ' ' || ${lots.lotDescription} || ' ' || ${lots.lotAdditionalDescription}), plainto_tsquery('russian', ${query}))`,
    ),
  });

  const [embedding, keywordResults] = await Promise.all([
    embeddingPromise,
    keywordResultsPromise,
  ]);

  const semanticResults = await db.query.lots.findMany({
    where: (table, { inArray }) =>
      and(
        withRecommendations
          ? inArray(
              table.id,
              db
                .select({ lotId: recommendedProducts.lotId })
                .from(recommendedProducts),
            )
          : undefined,
        sql`${cosineDistance(lots.embedding, embedding)} < 0.8`,
        minBudget ? gt(table.budget, minBudget) : undefined,
        maxBudget ? lt(table.budget, maxBudget) : undefined,
        tradeMethod
          ? sql`ref_trade_methods ->> 'id' = ${tradeMethod}`
          : undefined,
      ),
    with: {
      recommendedProducts: {
        columns: {
          id: true,
        },
      },
    },
    limit: 25,
    columns,
    orderBy: asc(cosineDistance(lots.embedding, embedding)),
  });

  const combinedResults = Array.from(
    new Set([...semanticResults, ...keywordResults]),
  );

  const documents = combinedResults.map((lot) => ({
    pageContent: `${lot.lotName} ${lot.lotDescription} ${lot.lotAdditionalDescription}`,
    metadata: lot,
  }));

  let rerankedResults = await rerankResults(query, documents, limit);

  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`Search duration: ${duration.toFixed(2)} ms`);

  return {
    results: rerankedResults.slice(offset, offset + limit),
    totalCount: rerankedResults.length,
  };
}

async function rerankResults(query: string, documents: any[], limit: number) {
  try {
    const jinaResponse = await fetch("https://api.jina.ai/v1/rerank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer jina_28f45e828a1b46abafbbd62c742c743250elOwPyd9l7AInOLT2AdGj40XNj",
      },
      body: JSON.stringify({
        model: "jina-reranker-v2-base-multilingual",
        query: query,
        documents: documents.map((doc) => ({
          text: doc.pageContent,
          ...doc,
        })),
        top_n: limit,
      }),
    });

    if (!jinaResponse.ok) {
      throw new Error(
        `Jina API request failed with status ${jinaResponse.status}`,
      );
    }

    const jinaData = await jinaResponse.json();
    return jinaData.results.map((result: any) => ({
      ...documents[result.index].metadata,
      score: result.score,
    }));
  } catch (error) {
    console.error("Error during Jina reranking:", error);
    return documents.map((doc) => doc.metadata);
  }
}
