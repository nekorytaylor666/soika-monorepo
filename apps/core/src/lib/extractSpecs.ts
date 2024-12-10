import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const tenderInfoSchema = z.object({
  purchaseNumber: z.string().describe("Номер закупки. Оставь только цифры"),
  purchaseName: z.string().describe("Наименование закупки"),
  lotNumber: z.string().describe("Номер лота. Оставь только цифры"),
  lotName: z.string().describe("Наименование лота"),
  lotDescription: z.string().describe("Описание лота"),
  lotAdditionalDescription: z.string().describe("Дополнительное описание лота"),
  quantity: z.number().describe("Количество"),
  unitOfMeasure: z.string().describe("Единица измерения"),
  deliveryPlaces: z.string().describe("Места поставки"),
  deliveryTerm: z.string().describe("Срок поставки"),
  lotSpecifications: z
    .string()
    .describe(
      "Описание и требуемые функциональные, технические, качественные и эксплуатационные характеристики закупаемых товаров",
    ),
});

export type TechnicalSpecification = z.infer<typeof tenderInfoSchema>;

export async function extractTenderInfo(input: string) {
  const doc = input.includes("Приложение 2")
    ? input.split("Приложение 2")[1]
    : input.split("спецификация")[1];

  const result = await generateObject({
    model: google("gemini-1.5-pro"),
    schema: tenderInfoSchema,
    messages: [
      {
        role: "system",
        content: `Вы - эксперт по анализу технических спецификаций в тендерной документации.
Ваша задача - тщательно проанализировать документ и извлечь точную информацию по каждому полю:

- Внимательно найдите номер закупки и лота (только цифры)
- Определите точные наименования закупки и лота
- Найдите полное описание лота и дополнительные требования
- Укажите точное количество и единицы измерения
- Выделите все места поставки
- Определите сроки поставки
- Извлеките все технические, функциональные и качественные характеристики товаров

Важно:
1. Сохраняйте исходную формулировку, не интерпретируйте
2. Если информация отсутствует в документе, укажите "Не указано"
3. Извлекайте полный текст без сокращений
4. При наличии нескольких вариантов, укажите все через разделитель
5. Проверяйте корректность цифр в номерах и количествах`,
      },
      {
        role: "user",
        content: doc,
      },
    ],
  });

  return result.object;
}
