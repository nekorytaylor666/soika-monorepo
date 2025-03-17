import { db } from "db/connection";
import { ktruCodes, ktruGroups, ktruSubgroups } from "db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import * as xlsx from "xlsx";

interface KtruCode {
  id: string;
  code: string;
  nameRu?: string | null;
  descriptionRu?: string | null;
  source?: string | null;
}

interface KtruGroup {
  codes: KtruCode[];
  subgroups: Record<string, KtruCode[]>;
  isValidGroup: boolean;
  name?: string;
}

interface KtruSubgroup {
  codes: KtruCode[];
  isValidSubgroup: boolean;
  name?: string;
}

// Define interfaces for registry data row
interface RegistryRow {
  [key: string]: unknown;
}

// Define batch sizes for optimized database operations
const BATCH_SIZE = 100;

async function main() {
  console.log("Loading KTRU registry from XLS file...");

  // Load registry data from Excel file
  const registryFilePath = path.resolve(__dirname, "registry.xls");
  console.log(`Looking for registry file at: ${registryFilePath}`);

  // Check if the registry file exists
  if (!fs.existsSync(registryFilePath)) {
    console.error(`Registry file not found at: ${registryFilePath}`);
    console.error("Please copy the registry.xls file to the scripts directory");

    // Try to list files in the directory to help troubleshoot
    const dirPath = path.dirname(registryFilePath);
    console.log(`Files in ${dirPath}:`);
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        console.log(` - ${file}`);
      }
    } catch (err: Error) {
      console.error(`Error reading directory: ${err.message}`);
    }
    return;
  }

  console.log(
    `Found registry file. Size: ${fs.statSync(registryFilePath).size} bytes`,
  );

  // Read the Excel file - XLS format
  try {
    // First try with binary format
    const workbook = xlsx.readFile(registryFilePath, { type: "binary" });
    console.log(
      `Successfully read XLS file. Found ${workbook.SheetNames.length} sheets.`,
    );
    console.log(`Sheet names: ${workbook.SheetNames.join(", ")}`);

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Check the structure of the first worksheet
    const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1:A1");
    console.log(
      `Sheet range: ${worksheet["!ref"]}, Rows: ${range.e.r - range.s.r + 1}, Columns: ${range.e.c - range.s.c + 1}`,
    );

    // Check for column headers
    console.log("Column headers found in first row:");
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = xlsx.utils.encode_cell({ r: range.s.r, c: col });
      const cellValue = worksheet[cellAddress]?.v;
      if (cellValue) {
        headers.push(cellValue);
        console.log(` - ${cellValue}`);
      }
    }

    // Try to convert to JSON and check if expected columns exist
    const registryData = xlsx.utils.sheet_to_json(worksheet) as RegistryRow[];
    console.log(`Converted ${registryData.length} rows to JSON`);

    if (registryData.length > 0) {
      console.log(
        "First row keys:",
        Object.keys(registryData[0]).join(", "),
      );
      console.log("First row data:", JSON.stringify(registryData[0], null, 2));
    }

    // Try to find the right column names for codes and names
    const codeColumnCandidates = [
      "Код позиции",
      "код позиции",
      "Код",
      "код",
      "Code",
      "code",
    ];

    const nameColumnCandidates = [
      "Наименование позиции",
      "наименование позиции",
      "Наименование",
      "наименование",
      "Name",
      "name",
    ];

    let codeColumn = null;
    let nameColumn = null;

    for (const candidate of codeColumnCandidates) {
      if (
        registryData.length > 0 &&
        registryData[0][candidate] !== undefined
      ) {
        codeColumn = candidate;
        console.log(`Found code column: "${codeColumn}"`);
        break;
      }
    }

    for (const candidate of nameColumnCandidates) {
      if (
        registryData.length > 0 &&
        registryData[0][candidate] !== undefined
      ) {
        nameColumn = candidate;
        console.log(`Found name column: "${nameColumn}"`);
        break;
      }
    }

    if (!codeColumn && registryData.length > 0) {
      // Try to guess which column might contain codes based on format
      for (const key of Object.keys(registryData[0])) {
        const value = String(registryData[0][key]);
        if (/^\d+(\.\d+)*$/.test(value)) {
          codeColumn = key;
          console.log(
            `Guessed code column based on format: "${codeColumn}" with value: ${value}`,
          );
          break;
        }
      }
    }

    if (!codeColumn) {
      console.error("Could not find a column containing KTRU codes");
      return;
    }

    // Create sets for valid groups and subgroups with their names
    const validGroups = new Map<string, string>();
    const validSubgroups = new Map<string, string>();

    // Process registry data to extract valid group and subgroup codes
    let processedCodes = 0;
    for (const row of registryData) {
      const code = row[codeColumn]?.toString()?.trim();
      const name = nameColumn ? row[nameColumn]?.toString()?.trim() : null;

      if (code) {
        processedCodes++;
        // For each code in registry, consider it a valid group/subgroup
        validGroups.set(code, name || "");

        // If the code has more than 2 digits, extract possible group prefixes
        if (code.length >= 2) {
          const groupCode = code.substring(0, 2);
          if (!validGroups.has(groupCode)) {
            validGroups.set(groupCode, `Group ${groupCode}`);
          }
        }

        if (code.length >= 4) {
          const subgroupCode = code.substring(0, 4);
          if (!validSubgroups.has(subgroupCode)) {
            validSubgroups.set(subgroupCode, `Subgroup ${subgroupCode}`);
          }
        }

        if (code.length >= 6) {
          const groupCode = code.substring(0, 6);
          if (!validGroups.has(groupCode)) {
            validGroups.set(groupCode, `Group ${groupCode}`);
          }
        }

        if (code.length >= 9) {
          const subgroupCode = code.substring(0, 9);
          if (!validSubgroups.has(subgroupCode)) {
            validSubgroups.set(subgroupCode, `Subgroup ${subgroupCode}`);
          }
        }

        // Print some examples for diagnostic purposes
        if (processedCodes <= 5) {
          console.log(`Processed code: ${code}${name ? ` - ${name}` : ""}`);
          console.log(`  Added to validGroups: ${code}`);
          if (code.length >= 2)
            console.log(`  Added to validGroups: ${code.substring(0, 2)}`);
          if (code.length >= 4)
            console.log(`  Added to validSubgroups: ${code.substring(0, 4)}`);
          if (code.length >= 6)
            console.log(`  Added to validGroups: ${code.substring(0, 6)}`);
          if (code.length >= 9)
            console.log(`  Added to validSubgroups: ${code.substring(0, 9)}`);
        }
      }
    }

    console.log(`Processed ${processedCodes} codes from registry`);
    console.log(
      `Loaded ${validGroups.size} valid groups and ${validSubgroups.size} valid subgroups from registry`,
    );

    if (validGroups.size === 0) {
      console.error(
        "No valid groups were extracted. Check if the codes in the registry have the expected format.",
      );
      return;
    }

    // Get all KTRU codes
    const ktruCodesRes = await db.query.ktruCodes.findMany({
      columns: {
        code: true,
        descriptionRu: true,
        nameRu: true,
        source: true,
        id: true,
      },
    });

    console.log(`Retrieved ${ktruCodesRes.length} KTRU codes from database`);

    // Show some examples from database for comparison
    if (ktruCodesRes.length > 0) {
      console.log("First 5 KTRU codes from database:");
      for (let i = 0; i < Math.min(5, ktruCodesRes.length); i++) {
        console.log(` - ${ktruCodesRes[i].code}`);
      }
    }

    // Create groups for the results
    const shortCodeGroups: Record<string, KtruGroup> = {};
    const longCodeGroups: Record<string, KtruGroup> = {};

    // Process each KTRU code
    for (const ktruCode of ktruCodesRes) {
      const code = ktruCode.code;
      const codeLength = code.length;

      // For codes around 17 chars (including dots), group by first segment before dot
      if (codeLength <= 17) {
        const groupKey = code.split(".")[0]; // Get first segment before dot
        const isValidGroup = validGroups.has(groupKey);
        const groupName = validGroups.get(groupKey) || `Group ${groupKey}`;

        // Create main group if it doesn't exist
        if (!shortCodeGroups[groupKey]) {
          shortCodeGroups[groupKey] = {
            codes: [],
            subgroups: {},
            isValidGroup,
            name: groupName,
          };
        }

        // Add to main group
        shortCodeGroups[groupKey].codes.push(ktruCode);

        // Extract parts for subgroup (if possible)
        const parts = code.split(".");
        if (parts.length >= 2) {
          // Create subgroup key from first two segments
          const subgroupKey = parts[0] + (parts[1] || "");
          const isValidSubgroup = validSubgroups.has(subgroupKey);
          const subgroupName =
            validSubgroups.get(subgroupKey) || `Subgroup ${subgroupKey}`;

          if (!shortCodeGroups[groupKey].subgroups[subgroupKey]) {
            shortCodeGroups[groupKey].subgroups[subgroupKey] = [];
          }
          shortCodeGroups[groupKey].subgroups[subgroupKey].push(ktruCode);
        }
      }
      // For codes more than 17 chars, group by first 6 digits
      else {
        // Remove dots for consistent grouping
        const codeWithoutDots = code.replace(/\./g, "");
        const groupKey = codeWithoutDots.substring(0, 6); // Get first 6 digits
        const isValidGroup = validGroups.has(groupKey);
        const groupName = validGroups.get(groupKey) || `Group ${groupKey}`;

        // Create main group if it doesn't exist
        if (!longCodeGroups[groupKey]) {
          longCodeGroups[groupKey] = {
            codes: [],
            subgroups: {},
            isValidGroup,
            name: groupName,
          };
        }

        // Add to main group
        longCodeGroups[groupKey].codes.push(ktruCode);

        // Create subgroup from first 9 digits (if possible)
        if (codeWithoutDots.length >= 9) {
          const subgroupKey = codeWithoutDots.substring(0, 9); // First 6 + next 3 digits
          const isValidSubgroup = validSubgroups.has(subgroupKey);
          const subgroupName =
            validSubgroups.get(subgroupKey) || `Subgroup ${subgroupKey}`;

          if (!longCodeGroups[groupKey].subgroups[subgroupKey]) {
            longCodeGroups[groupKey].subgroups[subgroupKey] = [];
          }
          longCodeGroups[groupKey].subgroups[subgroupKey].push(ktruCode);
        }
      }
    }

    // Now insert the groups and subgroups into the database in batches
    console.log("\nInserting groups and subgroups into the database in batches...");

    // Create maps to store the created group IDs
    const groupDbIds = new Map<string, string>();
    const subgroupDbIds = new Map<string, string>();

    // First, get all existing groups to avoid duplicates
    console.log("\nFetching existing groups...");
    const existingGroups = await db.query.ktruGroups.findMany({
      columns: {
        id: true,
        code: true,
      },
    });

    for (const group of existingGroups) {
      groupDbIds.set(group.code, group.id);
    }
    console.log(`Found ${existingGroups.length} existing groups`);

    // Prepare batches for groups - collect all valid groups from short and long codes
    const groupsToInsert = [];

    // Add short code groups
    for (const [groupCode, data] of Object.entries(shortCodeGroups)) {
      if (data.isValidGroup && !groupDbIds.has(groupCode)) {
        groupsToInsert.push({
          code: groupCode,
          nameRu: data.name,
          isValid: data.isValidGroup,
        });
      }
    }

    // Add long code groups
    for (const [groupCode, data] of Object.entries(longCodeGroups)) {
      if (data.isValidGroup && !groupDbIds.has(groupCode) &&
          !groupsToInsert.some(g => g.code === groupCode)) {
        groupsToInsert.push({
          code: groupCode,
          nameRu: data.name,
          isValid: data.isValidGroup,
        });
      }
    }

    // Insert groups in batches
    console.log(`\nInserting ${groupsToInsert.length} new groups in batches...`);
    for (let i = 0; i < groupsToInsert.length; i += BATCH_SIZE) {
      const batch = groupsToInsert.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        try {
          const insertedGroups = await db.insert(ktruGroups)
            .values(batch)
            .returning({ id: ktruGroups.id, code: ktruGroups.code });

          for (const group of insertedGroups) {
            groupDbIds.set(group.code, group.id);
          }
          console.log(`Inserted batch of ${batch.length} groups (${i+1}-${i+batch.length} of ${groupsToInsert.length})`);
        } catch (error) {
          console.error(`Error inserting batch of groups:`, error);
        }
      }
    }

    // Fetch existing subgroups
    console.log("\nFetching existing subgroups...");
    const existingSubgroups = await db.query.ktruSubgroups.findMany({
      columns: {
        id: true,
        code: true,
      },
    });

    for (const subgroup of existingSubgroups) {
      subgroupDbIds.set(subgroup.code, subgroup.id);
    }
    console.log(`Found ${existingSubgroups.length} existing subgroups`);

    // Prepare batches for subgroups
    const subgroupsToInsert = [];

    // Collect subgroups from short codes
    for (const [groupCode, data] of Object.entries(shortCodeGroups)) {
      const groupId = groupDbIds.get(groupCode);
      if (groupId) {
        for (const [subgroupCode, codes] of Object.entries(data.subgroups)) {
          if (!subgroupDbIds.has(subgroupCode)) {
            const isValidSubgroup = validSubgroups.has(subgroupCode);
            const subgroupName = validSubgroups.get(subgroupCode) || `Subgroup ${subgroupCode}`;
            subgroupsToInsert.push({
              code: subgroupCode,
              nameRu: subgroupName,
              isValid: isValidSubgroup,
              groupId: groupId,
            });
          }
        }
      }
    }

    // Collect subgroups from long codes
    for (const [groupCode, data] of Object.entries(longCodeGroups)) {
      const groupId = groupDbIds.get(groupCode);
      if (groupId) {
        for (const [subgroupCode, codes] of Object.entries(data.subgroups)) {
          if (!subgroupDbIds.has(subgroupCode) &&
              !subgroupsToInsert.some(s => s.code === subgroupCode)) {
            const isValidSubgroup = validSubgroups.has(subgroupCode);
            const subgroupName = validSubgroups.get(subgroupCode) || `Subgroup ${subgroupCode}`;
            subgroupsToInsert.push({
              code: subgroupCode,
              nameRu: subgroupName,
              isValid: isValidSubgroup,
              groupId: groupId,
            });
          }
        }
      }
    }

    // Insert subgroups in batches
    console.log(`\nInserting ${subgroupsToInsert.length} new subgroups in batches...`);
    for (let i = 0; i < subgroupsToInsert.length; i += BATCH_SIZE) {
      const batch = subgroupsToInsert.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        try {
          const insertedSubgroups = await db.insert(ktruSubgroups)
            .values(batch)
            .returning({ id: ktruSubgroups.id, code: ktruSubgroups.code });

          for (const subgroup of insertedSubgroups) {
            subgroupDbIds.set(subgroup.code, subgroup.id);
          }
          console.log(`Inserted batch of ${batch.length} subgroups (${i+1}-${i+batch.length} of ${subgroupsToInsert.length})`);
        } catch (error) {
          console.error(`Error inserting batch of subgroups:`, error);
        }
      }
    }

    // Now update the KTRU codes to link them to their groups and subgroups in batches
    console.log("\nUpdating KTRU codes with group and subgroup references in batches...");

    // Prepare batches of updates
    const updates = [];

    // Process short codes
    for (const [groupCode, data] of Object.entries(shortCodeGroups)) {
      const groupId = groupDbIds.get(groupCode);
      if (groupId) {
        for (const ktruCode of data.codes) {
          // Determine subgroup if any
          let subgroupId = null;
          const parts = ktruCode.code.split(".");
          if (parts.length >= 2) {
            const subgroupCode = parts[0] + (parts[1] || "");
            subgroupId = subgroupDbIds.get(subgroupCode) || null;
          }

          updates.push({
            id: ktruCode.id,
            groupId,
            subgroupId,
          });
        }
      }
    }

    // Process long codes
    for (const [groupCode, data] of Object.entries(longCodeGroups)) {
      const groupId = groupDbIds.get(groupCode);
      if (groupId) {
        for (const ktruCode of data.codes) {
          // Determine subgroup if any
          let subgroupId = null;
          const codeWithoutDots = ktruCode.code.replace(/\./g, "");
          if (codeWithoutDots.length >= 9) {
            const subgroupCode = codeWithoutDots.substring(0, 9);
            subgroupId = subgroupDbIds.get(subgroupCode) || null;
          }

          updates.push({
            id: ktruCode.id,
            groupId,
            subgroupId,
          });
        }
      }
    }

    // Perform batch updates
    let updatedCount = 0;
    console.log(`Updating ${updates.length} KTRU codes in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        try {
          // Group by common groupId and subgroupId for more efficient updates
          const updateGroups = new Map();

          for (const update of batch) {
            const key = `${update.groupId}-${update.subgroupId || 'null'}`;
            if (!updateGroups.has(key)) {
              updateGroups.set(key, {
                groupId: update.groupId,
                subgroupId: update.subgroupId,
                ids: []
              });
            }
            updateGroups.get(key).ids.push(update.id);
          }

          // Execute updates by group
          for (const updateGroup of updateGroups.values()) {
            await db.update(ktruCodes)
              .set({
                groupId: updateGroup.groupId,
                subgroupId: updateGroup.subgroupId
              })
              .where(inArray(ktruCodes.id, updateGroup.ids));

            updatedCount += updateGroup.ids.length;
          }

          console.log(`Updated batch of ${batch.length} KTRU codes (${i+1}-${i+batch.length} of ${updates.length})`);
        } catch (error) {
          console.error(`Error updating batch of KTRU codes:`, error);
        }
      }
    }

    console.log(`Finished updating ${updatedCount} KTRU codes with group/subgroup references.`);

    // Print results for short codes
    console.log("\nShort Code Groups (grouped by first segment before dot):");
    for (const [group, data] of Object.entries(shortCodeGroups)) {
      console.log(
        `\nMain Group ${group}: ${data.codes.length} codes${data.isValidGroup ? " (VALID)" : " (INVALID)"}`,
      );

      // Print subgroups
      const subgroupCount = Object.keys(data.subgroups).length;
      console.log(`  Contains ${subgroupCount} subgroups:`);

      for (const [subgroup, codes] of Object.entries(data.subgroups)) {
        const isValidSubgroup = validSubgroups.has(subgroup);
        console.log(
          `    Subgroup ${subgroup}: ${codes.length} codes${isValidSubgroup ? " (VALID)" : " (INVALID)"}`,
        );
        // Uncomment to see example codes in each subgroup
        // console.log(`      Example: ${codes[0].code}`);
      }
    }

    // Print results for long codes
    console.log("\nLong Code Groups (grouped by first 6 digits):");
    for (const [group, data] of Object.entries(longCodeGroups)) {
      console.log(
        `\nMain Group ${group}: ${data.codes.length} codes${data.isValidGroup ? " (VALID)" : " (INVALID)"}`,
      );

      // Print subgroups
      const subgroupCount = Object.keys(data.subgroups).length;
      console.log(`  Contains ${subgroupCount} subgroups:`);

      if (subgroupCount > 0) {
        for (const [subgroup, codes] of Object.entries(data.subgroups)) {
          const isValidSubgroup = validSubgroups.has(subgroup);
          console.log(
            `    Subgroup ${subgroup}: ${codes.length} codes${isValidSubgroup ? " (VALID)" : " (INVALID)"}`,
          );
          // Uncomment to see example codes in each subgroup
          // console.log(`      Example: ${codes[0].code}`);
        }
      } else {
        console.log(`    No subgroups - using only main group ${group}`);
      }
    }

    // Get total number of groups and codes
    const totalShortGroups = Object.keys(shortCodeGroups).length;
    const totalLongGroups = Object.keys(longCodeGroups).length;
    const totalShortCodes = Object.values(shortCodeGroups).reduce(
      (sum, data) => sum + data.codes.length,
      0,
    );
    const totalLongCodes = Object.values(longCodeGroups).reduce(
      (sum, data) => sum + data.codes.length,
      0,
    );

    // Count total subgroups and valid groups/subgroups
    let totalShortSubgroups = 0;
    let totalLongSubgroups = 0;
    let validShortGroups = 0;
    let validLongGroups = 0;
    let validShortSubgroups = 0;
    let validLongSubgroups = 0;

    for (const [group, data] of Object.entries(shortCodeGroups)) {
      const subgroupCount = Object.keys(data.subgroups).length;
      totalShortSubgroups += subgroupCount;
      if (data.isValidGroup) validShortGroups++;

      for (const subgroup of Object.keys(data.subgroups)) {
        if (validSubgroups.has(subgroup)) validShortSubgroups++;
      }
    }

    for (const [group, data] of Object.entries(longCodeGroups)) {
      const subgroupCount = Object.keys(data.subgroups).length;
      totalLongSubgroups += subgroupCount;
      if (data.isValidGroup) validLongGroups++;

      for (const subgroup of Object.keys(data.subgroups)) {
        if (validSubgroups.has(subgroup)) validLongSubgroups++;
      }
    }

    console.log("\nSummary:");
    console.log(
      `Total Short Code Main Groups: ${totalShortGroups} (${validShortGroups} valid) with ${totalShortSubgroups} subgroups (${validShortSubgroups} valid) - ${totalShortCodes} codes`,
    );
    console.log(
      `Total Long Code Main Groups: ${totalLongGroups} (${validLongGroups} valid) with ${totalLongSubgroups} subgroups (${validLongSubgroups} valid) - ${totalLongCodes} codes`,
    );
    console.log(`Total Codes: ${totalShortCodes + totalLongCodes}`);
    console.log(
      `Valid Groups: ${validGroups.size}, Valid Subgroups: ${validSubgroups.size}`,
    );

    console.log("\nDatabase Insert Summary:");
    console.log(`Inserted/matched ${groupDbIds.size} KTRU groups`);
    console.log(`Inserted/matched ${subgroupDbIds.size} KTRU subgroups`);
    console.log(
      `Updated ${updatedCount} KTRU codes with group/subgroup references`,
    );
    console.log("Done!");
  } catch (error) {
    console.error("Error reading Excel file:", error);
    console.log("Trying alternative approach with array buffer...");

    try {
      // Try reading as buffer
      const data = fs.readFileSync(registryFilePath);
      const workbook = xlsx.read(data);

      console.log(
        `Alternative approach successful. Found ${workbook.SheetNames.length} sheets.`,
      );
      // Continue with processing as before...
    } catch (err) {
      console.error("Alternative approach also failed:", err);
    }
  }
}

main().catch((error) => {
  console.error("Error running script:", error);
});
