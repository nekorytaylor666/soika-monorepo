import { db } from "db/connection";
import {
  ktruGroups,
  ktruCodes,
  goszakupContracts,
  samrukContracts,
} from "db/schema";
import { desc, eq, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { createObjectCsvWriter } from "csv-writer";

async function main() {
  console.log("Fetching KTRU groups data...");

  const results = await db
    .select({
      id: ktruGroups.id,
      code: ktruGroups.code,
      nameRu: ktruGroups.nameRu,
      descriptionRu: ktruGroups.descriptionRu,
      contractCount: sql<number>`
        COUNT(DISTINCT
          CASE
            WHEN ${samrukContracts.id} IS NOT NULL THEN 's_' || ${samrukContracts.id}::text
            WHEN ${goszakupContracts.id} IS NOT NULL THEN 'g_' || ${goszakupContracts.id}::text
            ELSE NULL
          END
        )`,
      totalSum: sql<number>`
        SUM(
          CASE
            WHEN ${samrukContracts.contractSum} IS NOT NULL AND ${samrukContracts.contractSum} != ''
              THEN ${samrukContracts.contractSum}::float
            ELSE 0
          END +
          CASE
            WHEN ${goszakupContracts.contractSum} IS NOT NULL AND ${goszakupContracts.contractSum} != ''
              THEN ${goszakupContracts.contractSum}::float
            ELSE 0
          END
        )`,
      averageLocalShare: sql<number>`
        AVG(
          CASE
            WHEN ${samrukContracts.localContentProjectedShare} IS NOT NULL
              THEN ${samrukContracts.localContentProjectedShare}
            WHEN ${goszakupContracts.localContentProjectedShare} IS NOT NULL
              THEN ${goszakupContracts.localContentProjectedShare}
            ELSE 0
          END
        )`,
    })
    .from(ktruGroups)
    .leftJoin(ktruCodes, eq(ktruCodes.groupId, ktruGroups.id))
    .leftJoin(samrukContracts, eq(samrukContracts.ktruCodeId, ktruCodes.id))
    .leftJoin(goszakupContracts, eq(goszakupContracts.ktruCodeId, ktruCodes.id))
    .groupBy(
      ktruGroups.id,
      ktruGroups.code,
      ktruGroups.nameRu,
      ktruGroups.descriptionRu,
    )
    .orderBy(
      desc(sql`SUM(
      CASE
        WHEN ${samrukContracts.contractSum} IS NOT NULL AND ${samrukContracts.contractSum} != ''
          THEN ${samrukContracts.contractSum}::float
        ELSE 0
      END +
      CASE
        WHEN ${goszakupContracts.contractSum} IS NOT NULL AND ${goszakupContracts.contractSum} != ''
          THEN ${goszakupContracts.contractSum}::float
        ELSE 0
      END
    )`),
    );

  console.log(`Found ${results.length} KTRU groups`);

  // Ensure the public directory exists
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Create CSV writer
  const csvWriter = createObjectCsvWriter({
    path: path.join(publicDir, "ktru_groups.csv"),
    header: [
      { id: "code", title: "Код группы" },
      { id: "nameRu", title: "Наименование" },
      { id: "contractCount", title: "Количество контрактов" },
      { id: "totalSum", title: "Сумма контрактов" },
      { id: "averageLocalShare", title: "Среднее местное содержание" },
    ],
  });

  // Write data to CSV
  await csvWriter.writeRecords(
    results.map((group) => ({
      ...group,
      totalSum: group.totalSum || 0,
      averageLocalShare: group.averageLocalShare
        ? `${group.averageLocalShare.toFixed(2)}%`
        : "0%",
    })),
  );

  console.log("CSV file has been written successfully");
}

main().catch(console.error);
