import { db } from "db/connection";
import { samrukContracts, customers, suppliers } from "db/schema";
import { eq } from "drizzle-orm";
import { getDocumentProxy, extractText, unPdf } from "unpdf"; // Make sure to import your PDF processing library
import fetch from "node-fetch";

interface ContractListItem {
  id: number;
  systemNumber: string;
  contractCardStatus: string;
  advertNumber: string;
  supplier: {
    id: number;
    identifier: string;
    nameRu: string;
    nameKk: string;
    nameEn: string | null;
    bin: string | null;
  };
  customer: {
    id: number;
    identifier: string;
    nameRu: string;
    nameKk: string;
    nameEn: string | null;
    bin: string;
  };
  contractItemsNameKk: string;
  contractItemsNameRu: string;
  contractItemsNameEn: string;
  contractDateTime: string;
  sumNds: number;
  contractItems: Array<{
    id: number;
    rowNumber: string;
    tenderSubjectType: string;
    deleted: boolean;
  }>;
}

interface ContractDetail {
  id: number;
  contractType: string;
  systemNumber: string;
  contractDateTime: string;
  contractCardStatus: string;
  sumNds: number;
  executionSumNds: number;
  contractItems: Array<{
    truHistory?: {
      code: string;
      ru: string;
      briefRu: string;
    };
  }>;
}

const CONCURRENT_LIMIT = 10; // Adjust this number based on your system's capabilities

async function downloadAndParsePdf(fileUid: string): Promise<string> {
  const url = `https://zakup.sk.kz/eprocfilestorage/open-api/files/download/${fileUid}`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      language: "ru",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      // Add other required headers
    },
  });

  const fileBuffer = await response.arrayBuffer();
  const filePdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  const { text: fileText } = await extractText(filePdf, { mergePages: true });
  return fileText as string;
}
function splitTechSpecLanguages(techSpecText: string) {
  // The documents are typically divided by this line
  const dividerLine = "ТЕХНИЧЕСКАЯ СПЕЦИФИКАЦИЯ";

  const parts = techSpecText.split(dividerLine);

  return {
    kk: parts[0]?.trim() || "", // Kazakh part is typically first
    ru: parts[1]?.trim() || "", // Russian part follows
  };
}

function formatDateToISO(date: Date): string {
  const formattedDate = `${date.toISOString().split(".")[0]}+05:00`;
  console.log(formattedDate);
  return formattedDate;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function fetchContractsList(
  page: number,
  dateFrom: Date,
  dateTo: Date,
): Promise<ContractListItem[]> {
  const response = await fetch(
    `https://zakup.sk.kz/eprocsearch/api/external/contract-cards/filter?size=100&page=${page}&sort=lastModifiedDate%2Cdesc`,
    {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "app-code-name": "Mozilla",
        "app-name": "Netscape",
        "content-type": "application/json",
        "e-tag": "MTExOTQzNDMxNTE0NQ==",
        language: "ru",
        origin: "https://zakup.sk.kz",
        priority: "u=1, i",
        "product-sub": "20030107",
        referer: "https://zakup.sk.kz/",
        "sec-ch-ua":
          '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        tor: "TU1URXpNakF3TWpjek56RTNOdz09cw==",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        contractCardStatus: "EXECUTED",
        tenderSubjectTypes: "GOODS",
        contractDateTimeFrom: formatDateToISO(dateFrom),
        contractDateTimeTo: formatDateToISO(dateTo),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch contracts list: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data || [];
}

export async function ingestContractsSamruk() {
  try {
    const startDate = new Date("2021-01-01");

    const endDate = new Date();
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const nextDate = addDays(currentDate, 1);
      console.log(
        `Processing contracts for date: ${currentDate.toISOString().split("T")[0]}`,
      );

      let page = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        const contractsList = await withRetry(() =>
          fetchContractsList(page, currentDate, nextDate),
        );

        console.log(
          `Processing page ${page + 1} for date ${currentDate.toISOString().split("T")[0]}`,
        );
        console.log(`Fetched ${contractsList.length} contracts`);

        if (contractsList.length === 0) {
          hasMoreData = false;
          break;
        }

        // Process contracts in chunks to limit concurrency
        for (let i = 0; i < contractsList.length; i += CONCURRENT_LIMIT) {
          const chunk = contractsList.slice(i, i + CONCURRENT_LIMIT);
          await Promise.all(
            chunk.map(async (contract) => {
              try {
                console.log(`Processing contract ${contract.id}`);
                const contractDetail = await withRetry(() =>
                  fetchContractDetail(contract.id),
                );

                // Process contract items in parallel
                await Promise.all(
                  contractDetail.contractItems.map(async (item) => {
                    const contractData = {
                      id: String(contract.id),
                      contractSum: String(contract.sumNds),
                      supplierBiin: contract.supplier?.identifier,
                      supplierId: String(contract.supplier?.id),
                      customerBin: contract.customer?.bin,
                      contractDate: new Date(contract.contractDateTime),
                      systemNumber: contract.systemNumber,
                      contractCardStatus: contract.contractCardStatus,
                      advertNumber: contract.advertNumber,
                      nameRu: contract.contractItemsNameRu,
                      truHistory: item.truHistory,
                      technicalSpecification: "",
                    };

                    await db.insert(samrukContracts).values(contractData);
                  }),
                );
              } catch (error) {
                console.error(
                  `Error processing contract ${contract.id}:`,
                  error,
                );
              }
            }),
          );
        }

        page++;
      }

      // Move to next day
      currentDate = nextDate;
    }

    console.log("Finished processing all contracts");
  } catch (error) {
    console.error("Error ingesting contracts:", error);
    throw error;
  }
}

async function fetchContractDetail(id: number): Promise<ContractDetail> {
  const response = await fetch(
    `https://zakup.sk.kz/eprocsearch/api/external/contract-cards/${id}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        language: "ru",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch contract detail: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data;
}

// Add retry logic wrapper
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

await ingestContractsSamruk();

// const contracts = await db.query.contracts.findMany({
//   limit: 10,
// });
// console.log(contracts);
// const contract = await fetchContractDetail(3566353540);
// console.log(contract);
