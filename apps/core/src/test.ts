import { db } from "db/connection";
import { eq } from "drizzle-orm";
import { findSimilarGuides } from "./queue/handlers/newIngestContracts";
import { lots } from "db/schema/schema";
import fs from "node:fs/promises";
import path from "node:path";
import { router } from "./queue/jobRouter.old";

// const similarGuides = await findSimilarGuides('Аппарат летательный беспилотный вертолетного типа (Дрон)');

// const outputPath = path.join(__dirname, 'similarGuides.json');
// const totalSum = similarGuides.reduce((acc, guide) => {
// 	return acc + Number(guide.contractSum);
// }, 0);
// console.log(totalSum, similarGuides.length);
// try {
// 	await fs.writeFile(outputPath, JSON.stringify(similarGuides, null, 2));
// 	console.log(`Results written to ${outputPath}`);
// } catch (error) {
// 	console.error('Error writing to file:', error);
// }

// await router.test.emit({});
const contracts = await db.query.contracts.findMany({
  limit: 10,
});
console.log(contracts);
