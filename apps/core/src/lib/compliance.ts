import { ChatPromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputFunctionsParser, StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

const llm = new ChatOpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o' });
const parser = new JsonOutputFunctionsParser();

const productComplianceSchema = {
	name: 'productCompliance',
	description: 'Оценивает соответствие продукта спецификациям.',
	parameters: {
		type: 'object',
		properties: {
			compliance_details: {
				type: 'string',
				description: 'Подробный анализ того, насколько продукт соответствует спецификациям.',
			},
			compliance_score: {
				type: 'number',
				minimum: 0,
				maximum: 10,
				description:
					'Оценка от 0 до 10 того, насколько продукт соответствует спецификациям. Баллы снижаются за отсутствующую информацию или прямое несоответствие.',
			},
			fully_compliant: {
				type: 'boolean',
				description: 'Полностью ли продукт соответствует спецификациям.',
			},
		},
		required: ['compliance_details', 'compliance_score', 'fully_compliant'],
	},
};

const runnable = llm
	.bind({
		functions: [productComplianceSchema],
		function_call: { name: 'productCompliance' },
	})
	.pipe(parser);

const prompt = ChatPromptTemplate.fromPromptMessages([
	HumanMessagePromptTemplate.fromTemplate(
		'Проанализируйте и оцените соответствие продукта предоставленным техническим спецификациям. Снижайте очки за прямое несоответствие спецификациям. Добавляйте очки за соответствие спецификациям. Все ответы на русском языке.'
	),
	HumanMessagePromptTemplate.fromTemplate('детали_продукта: {product_details}\n\n спецификации: {specifications}'),
]);
const chain = prompt.pipe(runnable);

// const complianceLLMChain = RunnableSequence.from(prompt.runnable(llm).withConfig({ run_name: 'ProductCompliance' })).withParser(parser);

export async function evaluateProductCompliance(productDetails: string, specifications: string) {
	const result = await chain.invoke({
		product_details: productDetails,
		specifications: specifications,
	});
	return result as {
		compliance_details: string;
		compliance_score: number;
		fully_compliant: boolean;
	};
}
// import { ChatOpenAI } from '@langchain/openai';
// import { JsonOutputFunctionsParser } from 'langchain/output_parsers';
// import { HumanMessage } from '@langchain/core/messages';

// // Instantiate the parser
// // const parser = new JsonOutputFunctionsParser();

// // Define the function schema

// // Instantiate the ChatOpenAI class
// const model = new ChatOpenAI({ model: 'gpt-4' });

// // Create a new runnable, bind the function to the model, and pipe the output through the parser
// // const runnable = model
// // 	.bind({
// // 		functions: [extractionFunctionSchema],
// // 		function_call: { name: 'extractor' },
// // 	})
// // 	.pipe(parser);

// // Invoke the runnable with an input
// const result = await runnable.invoke([
// 	HumanMessagePromptTemplate.fromTemplate('детали_продукта: {product_details}\n\n спецификации: {specifications}').inputVariables({
// 		product_details: 'test',
// 		specifications: 'test',
// 	}),
// ]);

// console.log({ result });

// // /**
// {
//   result: {
//     tone: 'positive',
//     word_count: 4,
//     chat_response: "Indeed, it's a lovely day!"
//   }
// }
//  */
