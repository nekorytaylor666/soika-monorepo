import { ChatGroq } from '@langchain/groq';
import { z } from 'zod';
import { ChatOpenAI, OpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { OutputFixingParser, StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';

const tenderInfoSchema = z.object({
	purchaseNumber: z.string().describe('Номер закупки. Оставь только цифры'),
	purchaseName: z.string().describe('Наименование закупки'),
	lotNumber: z.string().describe('Номер лота. Оставь только цифры'),
	lotName: z.string().describe('Наименование лота'),
	lotDescription: z.string().describe('Описание лота'),
	lotAdditionalDescription: z.string().describe('Дополнительное описание лота'),
	quantity: z.number().describe('Количество'),
	unitOfMeasure: z.string().describe('Единица измерения'),
	deliveryPlaces: z.string().describe('Места поставки'),
	deliveryTerm: z.string().describe('Срок поставки'),
	lotSpecifications: z
		.string()
		.describe('Описание и требуемые функциональные, технические, качественные и эксплуатационные характеристики закупаемых товаров'),
});
// We can use zod to define a schema for the output using the `fromZodSchema` method of `StructuredOutputParser`.
const parser = StructuredOutputParser.fromZodSchema(tenderInfoSchema);

const fixParser = OutputFixingParser.fromLLM(
	new ChatOpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o' }),
	parser
);
const chain = RunnableSequence.from([
	PromptTemplate.fromTemplate(
		'Переведите в JSON формат техническую спецификацию лота. Передавай полную информацию о лоте. Не сокращай текст. ВОЗВРАЩАЙ ТОЛЬКО JSON БЕЗ КОММЕНТАРИЕВ. \n{format_instructions}\n{input}'
	),
	new OpenAI({
		temperature: 0,
		openAIApiKey: process.env.OPENAI_API_KEY,
		model: 'gpt-4o-mini',
	}),
	parser,
]);

export async function extractTenderInfo(input: string) {
	const doc = input.includes('Приложение 2') ? input.split('Приложение 2')[1] : input.split('спецификация')[1];
	console.log(doc);
	const response = await chain.invoke({
		input: doc,
		format_instructions: parser.getFormatInstructions(),
	});
	return response;
}
