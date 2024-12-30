import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { db } from "db/connection";
import { ktruCodes } from "db/schema";
import { cosineDistance, eq, is, isNull, sql } from "drizzle-orm";

const BATCH_SIZE = 100; // Adjust based on your needs and API limits

export async function generateKtruCodeEmbeddings() {
  try {
    // Get all KTRU codes that don't have embeddings yet
    const ktruCodesWithoutEmbeddings = await db.query.ktruCodes.findMany({
      where: isNull(ktruCodes.embedding),
    });

    if (ktruCodesWithoutEmbeddings.length === 0) {
      console.log("No KTRU codes found without embeddings");
      return;
    }

    console.log(
      `Found ${ktruCodesWithoutEmbeddings.length} KTRU codes to process`,
    );

    // Process in batches
    for (let i = 0; i < ktruCodesWithoutEmbeddings.length; i += BATCH_SIZE) {
      const batch = ktruCodesWithoutEmbeddings.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1}...`);

      // Prepare the text content for embedding - only using name and description
      const textsToEmbed = batch.map((ktru) => {
        // Combine name and description for semantic understanding
        return `${ktru.nameRu ?? ""}
${ktru.descriptionRu ?? ""}`.trim();
      });

      // Generate embeddings using AI SDK
      const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: textsToEmbed,
      });

      // Batch update the database
      await Promise.all(
        batch.map((ktruCode, index) =>
          db
            .update(ktruCodes)
            .set({
              embedding: embeddings[index],
              updatedAt: new Date(),
            })
            .where(eq(ktruCodes.id, ktruCode.id)),
        ),
      );

      console.log(
        `Completed batch ${i / BATCH_SIZE + 1}, processed ${
          i + batch.length
        } of ${ktruCodesWithoutEmbeddings.length} total`,
      );

      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < ktruCodesWithoutEmbeddings.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `Successfully generated embeddings for ${ktruCodesWithoutEmbeddings.length} KTRU codes`,
    );
  } catch (error) {
    console.error("Error generating KTRU code embeddings:", error);
    throw error;
  }
}

// Function to find similar KTRU codes based on text query
export async function findSimilarKtruCodes(query: string, limit = 5) {
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

// await generateKtruCodeEmbeddings();
const similarKtruCodes = await findSimilarKtruCodes("Шины", 5);
console.log(similarKtruCodes);
