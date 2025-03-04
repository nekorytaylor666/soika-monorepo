import { db } from "db/connection";
import { ktruCodes } from "db/schema";
import { embeddings } from "../apps/backend/src/lib/ai";
import { eq, isNull, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("Starting Samruk TRU codes import process...");

  try {
    // Read the SQL script
    // const sqlScriptPath = path.join(__dirname, "extract_samruk_tru_codes.sql");
    // console.log(`Reading SQL script from ${sqlScriptPath}...`);
    // const sqlScript = fs.readFileSync(sqlScriptPath, "utf-8");

    // // Split the script into individual statements
    // // This is a simple approach and might not work for all SQL scripts
    // const statements = sqlScript
    //   .split(";")
    //   .map((stmt) => stmt.trim())
    //   .filter((stmt) => stmt.length > 0);

    // console.log(`Executing SQL script with ${statements.length} statements...`);

    // // Execute each statement
    // for (let i = 0; i < statements.length; i++) {
    //   const stmt = statements[i];

    //   // Skip comments
    //   if (stmt.startsWith("--")) continue;

    //   try {
    //     // Execute the statement
    //     const result = await db.execute(sql`${stmt}`);

    //     // Log SELECT results
    //     if (stmt.trim().toUpperCase().startsWith("SELECT")) {
    //       if (result && result.length > 0) {
    //         console.log("Query result:", result[0]);
    //       }
    //     }
    //   } catch (error) {
    //     console.error(`Error executing statement ${i + 1}:`, error);
    //     console.error(`Statement: ${stmt}`);
    //     throw error;
    //   }
    // }

    console.log("SQL script execution completed.");

    // Find all KTRU codes without embeddings
    console.log("Finding KTRU codes without embeddings...");
    const codesWithoutEmbeddings = await db
      .select({
        id: ktruCodes.id,
        code: ktruCodes.code,
        nameRu: ktruCodes.nameRu,
        descriptionRu: ktruCodes.descriptionRu,
      })
      .from(ktruCodes)
      .where(isNull(ktruCodes.embedding));

    console.log(
      `Found ${codesWithoutEmbeddings.length} KTRU codes without embeddings.`,
    );

    // Generate embeddings for each code
    let processedCount = 0;
    for (const code of codesWithoutEmbeddings) {
      try {
        // Prepare text for embedding
        const textToEmbed = `${code.nameRu || ""} ${code.descriptionRu || ""}`;

        // Generate embedding
        const embedding = await embeddings.embedQuery(textToEmbed);

        // Update the record with the embedding
        await db
          .update(ktruCodes)
          .set({ embedding })
          .where(eq(ktruCodes.id, code.id));

        processedCount++;

        if (processedCount % 10 === 0) {
          console.log(
            `Processed ${processedCount}/${codesWithoutEmbeddings.length} codes...`,
          );
        }
      } catch (error) {
        console.error(`Error processing code ${code.code}:`, error);
      }
    }

    console.log(`Successfully processed ${processedCount} KTRU codes.`);
    console.log("Import process completed.");
  } catch (error) {
    console.error("Error during import process:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
