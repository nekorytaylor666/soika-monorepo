// import { getDocumentProxy, extractText } from 'unpdf';
// import { JSDOM } from 'jsdom';
// import { db, dbDirect } from './db/connection';
// import { eq, sql } from 'drizzle-orm';
// import { lots, recommendedProducts } from './db/schema';

export type GosZakupLot = {
	id: number;
	lotNumber: string;
	descriptionRu: string;
	consultingServices: number;
	customerId: number;
	customerBin: string;
	customerNameRu: string;
	enstruList: number[];
	trdBuyNumberAnno: string;
	trdBuyId: number;
	// biome-ignore lint/style/useNamingConvention: graphql schema
	RefLotsStatus: {
		id: number;
		nameRu: string;
		code: string;
	};
	count: number;
	indexDate: string;
	// biome-ignore lint/style/useNamingConvention: graphql schema
	RefTradeMethods: {
		nameRu: string;
		id: number;
		code: string;
	};
	nameRu: string;
	amount: number;
	plnPointKatoList: string[];
	// biome-ignore lint/style/useNamingConvention: graphql schema
	Files: {
		nameRu: string;
		filePath: string;
		originalName: string;
	}[];
};
async function fetchLots(after?: string, tenderId?: string) {
	const endpoint = 'https://ows.goszakup.gov.kz/v3/graphql';
	const token = 'da6b81450fa5bdc80b1a89a9edd9a302';
	const today = new Date();
	today.setDate(today.getDate() - 2);
	const yesterday = today.toISOString().split('T')[0];

	const fetchLotsDocument = `
	query Lots {
	Lots(filter: {
		amount: 100000,
		refLotStatusId:[220, 210],
		refTradeMethodsId: [2],
		indexDate: "${yesterday}",

	}, limit: 50 ${after ? `, after: ${after}` : ''}){
		id
		lotNumber
		descriptionRu
		consultingServices
		customerId
		customerBin
		customerNameRu
		enstruList
		trdBuyNumberAnno
		trdBuyId
		RefLotsStatus {
			id
			nameRu
			code

		}

		count
		indexDate
		RefTradeMethods {
			nameRu
			id
			code
		}
		nameRu
		amount
		plnPointKatoList
		RefTradeMethods {
			nameRu
			id
		}
		Files {
			nameRu
			filePath
			originalName
		}

	}
}
`;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			// biome-ignore lint/style/useNamingConvention: authorization header
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ query: fetchLotsDocument }),
	});

	const responseBody = (await response.json()) as {
		// biome-ignore lint/style/useNamingConvention: graphql schema
		data: { Lots: GosZakupLot[] };
		extensions: { pageInfo: { hasNextPage: boolean; lastId: string } };
	};
	return responseBody;
}

export async function fetchAllLots({
	afterId,
	lots = [],
	onPage,
	tenderId,
}: {
	afterId?: string;
	lots?: GosZakupLot[];
	onPage?: (lots: GosZakupLot[]) => Promise<void>;
	tenderId?: string;
}) {
	const cursor = await fetchLots(afterId, tenderId);
	lots.push(...cursor.data.Lots); // Use spread operator to push elements of Lots array into lots array

	if (onPage) {
		await onPage(cursor.data.Lots);
	}
	if (cursor.extensions.pageInfo.hasNextPage) {
		const nextAfterId = cursor.extensions.pageInfo.lastId; // Rename to avoid shadowing outer afterId
		return fetchAllLots({ afterId: nextAfterId, lots, onPage });
	}
	return lots;
}

// // fetchAllLots({
// // 	async onPage(page) {
// // 		console.log(page);
// // 	},
// // });

// export async function fetchTrdBuy(search?: string) {
// 	const endpoint = 'https://ows.goszakup.gov.kz/v3/graphql';
// 	const token = 'da6b81450fa5bdc80b1a89a9edd9a302';
// 	const commonName = search || '';
// 	const fetchTrdBuyDocument = `
// 	query TrdBuy {
// 	TrdBuy( limit: 10,filter: {refBuyStatusId: [350], publishDate: ["", "2023-12-31"], refSubjectTypeId: 1, refTradeMethodsId: [2], ${
// 		commonName ? `commonName: "?${commonName}"` : ''
// 	}}){
// 		id

// 		nameRu
// 		totalSum

// 		RefBuyStatus {
// 			nameRu
// 			id
// 		}
// 		publishDate

// 		Lots {
// 			id
// 			nameRu
// 			Files {
// 				nameRu
// 				id
// 				filePath
// 			}
// 		}
// 		RefTradeMethods {
// 			nameRu
// 			id
// 		}
// 		RefTypeTrade{
// 			nameRu
// 		}
// 		RefSubjectType {
// 			nameRu
// 			id
// 		}

// 	}
// }
// 	`;
// 	const response = await fetch(endpoint, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 			// biome-ignore lint/style/useNamingConvention: authorization header
// 			Authorization: `Bearer ${token}`,
// 		},
// 		body: JSON.stringify({ query: fetchTrdBuyDocument }),
// 	});
// 	const responseBody = await response.json();
// 	const data = responseBody?.data?.TrdBuy;
// 	return data;
// }

async function fetchContracts(after?: string) {
	const endpoint = 'https://ows.goszakup.gov.kz/v3/graphql';
	const token = 'da6b81450fa5bdc80b1a89a9edd9a302';

	const fetchContractsDocument = `
    query Contracts {
      Contract(filter: {
        indexDate: ["2024-01-01",""]
        refContractStatusId: [390]
      }, limit: 3${after ? `, after: ${after}` : ''}) {
        id
        contractSum
        faktSum
        File {
          id
          nameRu
          filePath
        }
        supplierBik
        supplierBiin
        supplierId
        Supplier {
          bin
          nameRu
          iin
          fullNameRu
          systemId
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
        customerBik
        descriptionRu
        customerBin
        RefContractStatus {
          id
          nameRu
        }
        TrdBuy {
          id
          numberAnno
          nameRu
          Lots {
            id
            nameRu
            descriptionRu
          }
        }
      }
    }
  `;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ query: fetchContractsDocument }),
	});

	const responseBody = await response.json();
	return responseBody as {
		data: { Contract: GosZakupContract[] };
		extensions: { pageInfo: { hasNextPage: boolean; lastId: string; lastIndexDate: string } };
	};
}

// async function fetchContracts(trdBuyId: number) {
// 	const endpoint = 'https://ows.goszakup.gov.kz/v3/graphql';
// 	const token = 'da6b81450fa5bdc80b1a89a9edd9a302';
// 	const fetchContractsDocument = `
// 	query Contract {
// 	Contract(filter: {trdBuyId: ${trdBuyId}}) {
// 		id
// 		trdBuyNameRu
// 		contractNumber
// 		ContractUnits {
// 			id
// 			lotId
// 		}
// 	}
// }
// 	`;
// 	const response = await fetch(endpoint, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 			// biome-ignore lint/style/useNamingConvention: authorization header
// 			Authorization: `Bearer ${token}`,
// 		},
// 		body: JSON.stringify({ query: fetchContractsDocument }),
// 	});
// 	const responseBody = await response.json();
// 	const data = responseBody?.data?.Contract;
// 	return data;
// }
// async function parseTechnicalSpecification(doc: Document) {
// 	let secondTable = doc.querySelectorAll('table')[2];

// 	if (!secondTable) {
// 		secondTable = doc.querySelectorAll('table')[1];
// 		if (!secondTable) {
// 			return;
// 		}
// 	}
// 	const tableRows = secondTable.querySelectorAll('tr');
// 	for (const row of tableRows) {
// 		const col = row.querySelector('td:nth-child(1)')?.textContent?.trim();
// 		const val = row.querySelector('td:nth-child(2)')?.textContent?.trim();
// 		if (col?.includes('Наименование товара')) {
// 			// console.log('val:', val);
// 			var productName = val;
// 		}
// 		if (col?.includes('Завод-изготовитель')) {
// 			// console.log('val:', val);
// 			var manufacturer = val;
// 		}
// 		if (col?.includes('Описание')) {
// 			// console.log('val:', val);
// 			var description = val;
// 		}
// 	}
// 	return {
// 		productName,
// 		manufacturer,
// 		description,
// 	};
// }

// async function parsePriceList(doc: Document) {
// 	const tables = doc.querySelectorAll('table');
// 	for (const table of tables) {
// 		const rows = table.querySelectorAll('tr');
// 		for (const row of rows) {
// 			const [labelCell, valueCell] = row.querySelectorAll('td');
// 			if (!labelCell || !valueCell) {
// 				continue;
// 			}

// 			const label = labelCell.textContent?.trim();
// 			const value = valueCell.textContent?.trim();

// 			if (label === 'Цена за единицу (без учета НДС)') {
// 				var pricePerUnitExcludingVat = parsePrice(value);
// 			} else if (label === 'Цена за единицу (с учетом НДС)') {
// 				var pricePerUnitIncludingVat = parsePrice(value);
// 			} else if (label === 'Сумма по предмету договора (с учетом НДС)') {
// 				var contractAmountIncludingVat = parsePrice(value);
// 			}
// 		}
// 	}
// 	return {
// 		pricePerUnitExcludingVat,
// 		pricePerUnitIncludingVat,
// 		contractAmountIncludingVat,
// 	};
// }

// async function fetchContractDetails(pid, unitId) {
// 	const options = {
// 		method: 'POST',
// 		body: new URLSearchParams({ pid: pid.toString(), unit_id: unitId.toString() }),
// 	};

// 	const response = await fetch('https://goszakup.gov.kz/ru/egzcontract/cpublic/loadunit', options);
// 	const html = await response.text();

// 	// Parse the HTML string
// 	const dom = new JSDOM(html);

// 	const doc = dom.window.document;
// 	const priceList = await parsePriceList(doc);
// 	const techSpecLink = doc.querySelector('#show_doc_block1 tbody tr:first-child td:first-child a');
// 	if (techSpecLink) {
// 		const href = techSpecLink.getAttribute('href');
// 		if (!href) {
// 			return;
// 		}
// 		console.log(href);
// 		const response = await fetch(href);
// 		const html = await response.text();
// 		const dom = new JSDOM(html);
// 		const doc = dom.window.document;

// 		var specification = await parseTechnicalSpecification(doc);
// 		return {
// 			specification,
// 			priceList,
// 			href,
// 		};
// 	}
// 	return null;
// }

// const dbConn = dbDirect('postgres://soika_admin:nekorytaylor123@soika.gefest.agency:5432/soika');
// const lotsRes = await dbConn.query.lots.findMany({
// 	where: sql`lots.ref_trade_methods ->> 'id'::text = '2'`,
// 	offset: 300,
// });
// let processedCount = 0;
// const totalCount = lotsRes.length;

// for (const lot of lotsRes) {
// 	console.log(lot.id);
// 	if (!lot.purchaseName) {
// 		processedCount++;
// 		console.log(`Processed ${processedCount} of ${totalCount} lots`);
// 		continue;
// 	}
// 	const trdBuys = await fetchTrdBuy(lot.purchaseName);
// 	if (!trdBuys) {
// 		processedCount++;
// 		console.log(`Progress: ${processedCount}/${totalCount}`);
// 		continue;
// 	}
// 	for (const trdBuy of trdBuys) {
// 		const contracts = await fetchContracts(trdBuy.id);
// 		if (!contracts) {
// 			processedCount++;
// 			console.log(`Progress: ${processedCount}/${totalCount}`);
// 			continue;
// 		}
// 		for (const contract of contracts) {
// 			if (contract) {
// 				const contractDetails = await fetchContractDetails(contract.id, contract.ContractUnits[0].id);
// 				if (!contractDetails?.specification) {
// 					processedCount++;
// 					console.log(`Progress: ${processedCount}/${totalCount}`);
// 					continue;
// 				}
// 				await dbConn.insert(recommendedProducts).values({
// 					productName: contractDetails.specification.productName,
// 					productDescription: contractDetails.specification.manufacturer,
// 					productSpecifications: contractDetails.specification.description,
// 					price: contractDetails.priceList.pricePerUnitExcludingVat,
// 					currency: 'KZT',
// 					lotId: lot.id,
// 					sourceUrl: contractDetails.href,
// 					unitOfMeasure: 'товар',
// 					complianceScore: 0,
// 					complianceDetails: 'Данные из реестра',
// 				});
// 				processedCount++;
// 				console.log(`Progress: ${processedCount}/${totalCount}`);
// 			}
// 		}
// 		await new Promise((r) => setTimeout(r, 100));
// 	}
// }

// function parsePrice(priceString: string): number {
// 	// Remove any non-digit characters (except for the decimal point)
// 	const cleanedString = priceString.replace(/[^\d.]/g, '');

// 	// Parse the cleaned string as a floating-point number
// 	const floatValue = Number.parseFloat(cleanedString);

// 	// Round the float value to the nearest integer
// 	const intValue = Math.round(floatValue);

// 	return intValue;
// }

// // Example usage
