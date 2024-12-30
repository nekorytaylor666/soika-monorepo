import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { db } from "db/connection";
import { ktruCodes } from "db/schema/schema";
import { cosineDistance, eq, isNull, sql } from "drizzle-orm";

async function testKtruEmbeddings() {
  try {
    // 1. First get a small sample of KTRU codes (e.g., 5)
    const sampleKtruCodes = await db.query.ktruCodes.findMany({
      where: isNull(ktruCodes.embedding),
      limit: 5,
    });

    if (sampleKtruCodes.length === 0) {
      console.log("No KTRU codes found without embeddings");
      return;
    }

    console.log("\n=== Test Data ===");
    sampleKtruCodes.forEach((ktru) => {
      console.log(`\nKTRU Code: ${ktru.code}`);
      console.log(`Name: ${ktru.nameRu}`);
      console.log(`Description: ${ktru.descriptionRu?.slice(0, 100)}...`);
    });

    // 2. Generate embeddings for the sample
    const textsToEmbed = sampleKtruCodes.map((ktru) =>
      `${ktru.nameRu ?? ""}\n${ktru.descriptionRu ?? ""}`.trim(),
    );

    console.log("\n=== Generating Embeddings ===");
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: textsToEmbed,
    });

    // 3. Save embeddings
    console.log("\n=== Saving Embeddings ===");
    await Promise.all(
      sampleKtruCodes.map((ktruCode, index) =>
        db
          .update(ktruCodes)
          .set({
            embedding: embeddings[index],
            updatedAt: new Date(),
          })
          .where(eq(ktruCodes.id, ktruCode.id)),
      ),
    );

    // 4. Test similarity search using the sample KTRU codes as queries
    console.log("\n=== Testing Similarity Search ===");

    // Use the first 3 KTRU codes as test queries
    for (const ktru of sampleKtruCodes.slice(0, 3)) {
      const query = `${ktru.nameRu ?? ""}\n${ktru.descriptionRu ?? ""}`.trim();
      console.log(`\nQuery KTRU: ${ktru.code}`);
      console.log(`Query text: "${query.slice(0, 100)}..."`);

      const results = await findSimilarKtruCodes(query, 3);
      console.log("Top 3 matches:");
      results.forEach((result, i) => {
        console.log(`\n${i + 1}. ${result.code}`);
        console.log(`Name: ${result.nameRu}`);
        console.log(`Description: ${result.descriptionRu?.slice(0, 100)}...`);
      });
    }

    // 5. Verify embedding dimensions
    const storedKtru = await db.query.ktruCodes.findFirst({
      where: sql`embedding IS NOT NULL`,
    });

    if (storedKtru?.embedding) {
      console.log(
        "\n=== Embedding Verification ===",
        "\nDimensions:",
        storedKtru.embedding.length,
        "\nSample values (first 5):",
        storedKtru.embedding.slice(0, 5),
      );
    }
  } catch (error) {
    console.error("Error in test:", error);
    throw error;
  }
}

async function findSimilarKtruCodes(query: string, limit = 5) {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  const similarity = sql<number>`1 - (${cosineDistance(ktruCodes.embedding, embedding)})`;
  return db.query.ktruCodes.findMany({
    where: sql`embedding IS NOT NULL`,
    orderBy: (ktruCodes, { desc }) => [desc(similarity)],
    limit,
  });
}

// Run the test
console.log("Starting KTRU embeddings test...");
await testKtruEmbeddings();
