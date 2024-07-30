import { ChatGroq } from '@langchain/groq';
import { z } from 'zod';
import { OpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { TokenTextSplitter } from '@langchain/textsplitters';

const productInfoSchema = z.object({
	name: z.string(),
	description: z.string(),
	specifications: z.string(),
	price: z.number(),
	currency: z.string(),
	unitOfMeasure: z.string(),
	isTender: z.boolean(),
});
// We can use zod to define a schema for the output using the `fromZodSchema` method of `StructuredOutputParser`.
const parser = StructuredOutputParser.fromZodSchema(productInfoSchema);

export async function extractProductInfo(input: string) {
	// Create a TokenTextSplitter instance
	const splitter = new TokenTextSplitter({
		encodingName: 'cl100k_base',
		chunkSize: 8000,
		chunkOverlap: 0,
	});

	// Split the input text
	const chunks = await splitter.splitText(input);

	// Use only the first chunk (main content)
	const mainContent = chunks[0];

	console.log(mainContent);
	const chain = RunnableSequence.from([
		PromptTemplate.fromTemplate(`Вы - интеллектуальный помощник, задача которого заключается в извлечении конкретной информации с веб-страницы.
		Информация для извлечения включает наименование продукта, описание продукта и его спецификации.
		Внимательно прочитайте содержимое веб-страницы и извлеките эти поля в формате JSON.\n{format_instructions}\n{input}`),
		new OpenAI({
			temperature: 0,
			openAIApiKey: process.env.OPENAI_API_KEY,
			model: 'gpt-4o-mini',
		}),
		parser,
	]);
	const response = await chain.invoke({
		input: mainContent,
		format_instructions: parser.getFormatInstructions(),
	});
	console.log(response);
	return response;
}

export async function scrapeUrl(url: string) {
	const data = await fetch(`https://r.jina.ai/${url}`, {
		method: 'GET',
		headers: {
			Authorization: 'Bearer jina_28f45e828a1b46abafbbd62c742c743250elOwPyd9l7AInOLT2AdGj40XNj',
		},
	}).then((res) => res.text());
	return extractProductInfo(data);
}

// extractProductInfo(`Title: Светильник светодиодный COMFORT MYSTERY-RGB 80Вт 230В 3000-6500K 6000Лм 500x80мм с пультом ДУ IN HOME купить онлайн по цене от 3 750 ₽

// URL Source: https://in-home.ru/products/osveshchenie-dlya-doma/svetilniki-dekorativnye/potolochnye-svetilniki/svetilnik-svetodiodnyy-comfort-mystery-rgb-80vt-230v-3000-6500k-6000lm-500x80mm-s-pultom-du-in-home

// Markdown Content:
// Светильник с мерцающим рассеивателем оснащен дополнительной светодиодной подсветкой в спектре оттенков RGB. Она позволяет менять освещение с мягкого естественного на контрастное цветное. Пульт дистанционного управления поможет отрегулировать яркость и температуру освещения под ваше настроение, время суток или под конкретные задачи. Одним нажатием кнопки вы сможете сменить холодный контрастный свет (6500К) на уютный теплый (3000К), или снизить яркость до мягкого расслабляющего свечения в энергосберегающем режиме ночника (5% освещенности). Холодный дневной свет создает яркое контрастное освещение, удобное для работы с мелкими предметами и деталями. Теплый свет добавит интерьеру уюта и будет способствовать расслаблению в период вечернего отдыха. Используйте таймер отключения, и через 30 минут светильник выключится сам. Номинальный срок службы – не менее 30 000 часов, гарантия 2 года.

// <table><tbody><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Длина Изделия, мм</span></p></td><td><span itemprop="value">500</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Материал корпуса</span></p></td><td><span itemprop="value">Металл</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Степень защиты</span></p></td><td><span itemprop="value">IP40</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Цвет корпуса</span></p></td><td><span itemprop="value">Белый</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Мощность (Вт)</span></p></td><td><span itemprop="value">80</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Световой поток (лм)</span></p></td><td><span itemprop="value">6&nbsp;000</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Высота/глубина Изделия, мм</span></p></td><td><span itemprop="value">85</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Цветовая температура (К)</span></p></td><td><span itemprop="value">3000-6500</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Ширина Изделия, мм</span></p></td><td><span itemprop="value">500</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Вес единицы, кг</span></p></td><td><span itemprop="value">1,6</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Площадь освещения</span></p></td><td><span itemprop="value">до 40м2</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Ширина Упаковки, мм</span></p></td><td><span itemprop="value">520</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Длина Упаковки, мм</span></p></td><td><span itemprop="value">520</span></td></tr><tr itemprop="additionalProperty" itemscope="" itemtype="http://schema.org/PropertyValue"><td><p><span itemprop="name">Высота Упаковки, мм</span></p></td><td><span itemprop="value">90</span></td></tr></tbody></table>

// В нашем интернет-магазине доступна онлайн-оплата банковской картой.

// При оформлении заказа на сайте, Вы будете перенаправлены на платежный шлюз ПАО "Сбербанк России" для ввода реквизитов банковской карты.

// В появившемся окне Вам нужно заполнить персональные данные с банковской карты:

// *   номер банковской карты,
// *   cрок окончания действия банковской карты, месяц/год,
// *   CVV код для карт Visa / CVC код для Master Card / CAV код для JCB (3 последние цифры на полосе для подписи на обороте карты)

// После нажатия кнопки "Оплатить", на Ваш номер телефона поступит код-подтверждение, который Вы должны будете внести и завершить покупку. Далее произойдет перенаправление обратно на сайт, на страницу статуса заказа. Это означает оплата прошла - заказ оплачен.

// Доставка осуществляется курьерской службой АО "ДПД РУС" и возможна только после полной оплаты заказа в интернет-магазине. При оплате банковской картой на указанный электронный адрес придет квитанция об оплате. Отследить посылку можно на сайте [https://www.dpd.ru/](https://www.dpd.ru/) по номеру идентификатора отправления. Для получения посылки необходимо сообщить код из sms-сообщения.

// Передача заказов в транспортную компанию осуществляется по рабочим дням, с понедельника по пятницу.

// **Курьерская доставка:**

// Срок доставки: 2-22 дня в зависимости от региона России. Возможность хранения в пункте выдачи (если не получилось принять посылку у курьера):14 дней и 3 дня в постамате. Стоимость: рассчитывается индивидуально.

// **Доставка в постаматы и пункты выдачи:**

// Сеть пунктов приема и выдачи посылок Pickup объединяет около 5000 точек в 800 городах России и ЕАЭС. Пункты имеют удобный график работы, во многих из них предусмотрены различные варианты оплаты, а также дополнительные услуги: проверка соответствия, работоспособности и т.д. Онлайн-заказ будет бесплатно храниться в пункте Pickup в течение 14 дней.

// `);
