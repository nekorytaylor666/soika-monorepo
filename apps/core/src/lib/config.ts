import type { GosZakupLot } from './goszakupSource';

import { z } from 'zod';

export const DATABASE_URL = z.string().url().parse(process.env.DATABASE_URL);
export const TELEGRAM_BOT_TOKEN = z.string().parse(process.env.TELEGRAM_BOT_TOKEN);

export const EVENT_TYPE = {
	fetchLots: 'fetchLots',
	productExtraction: 'productExtraction',
	parseProducts: 'parseProducts',
	productComplianceEvaluation: 'productComplianceEvaluation',
	productComplianceEvaluationCompleted: 'productComplianceEvaluationCompleted',
	lotCreation: 'lotCreation',
	companyIndex: 'companyIndex',
	scheduleCompanyIndex: 'scheduleCompanyIndex',
} as const;

export type MessageType<T extends keyof typeof EVENT_TYPE> = T extends typeof EVENT_TYPE.parseProducts
	? {
			type: T;
			lotId: string;
		}
	: T extends typeof EVENT_TYPE.lotCreation
		? {
				type: T;
				lot: GosZakupLot;
			}
		: T extends typeof EVENT_TYPE.fetchLots
			? {
					type: T;
				}
			: T extends typeof EVENT_TYPE.companyIndex
				? {
						type: T;
						bin: string;
						organizationId: string;
					}
				: T extends typeof EVENT_TYPE.scheduleCompanyIndex
					? {
							type: T;
						}
					: never;
