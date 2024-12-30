import { db } from "db/connection";
import {
  organizationMembers,
  scheduleResults,
  schedules as scheduleSchema,
  type ScheduleFrequency,
} from "db/schema";
import { eq } from "drizzle-orm";
import { router } from "../jobRouter.old";
import { performSearch } from "../../lib/search";
import { sendTelegramNotification } from "../../routes/telegram";
import { Hono } from "hono";

export async function scheduledSearch(frequency: ScheduleFrequency) {
  console.log("Scheduled search");
  const schedules = await db.query.schedules.findMany({
    where: eq(scheduleSchema.frequency, frequency),
  });

  for (const schedule of schedules) {
    await router.performScheduledSearch.emit({ scheduleId: schedule.id });
  }
}

export async function performScheduledSearch(scheduleId: string) {
  console.log("Performing scheduled search:", scheduleId);
  const schedule = await db.query.schedules.findFirst({
    where: eq(scheduleSchema.id, scheduleId),
  });
  if (!schedule) {
    console.error("Schedule not found:", scheduleId);
    return;
  }
  if (!schedule.organizationId) {
    console.error("Schedule has no organization:", scheduleId);
    return;
  }
  const result = await performSearch(schedule.query, {
    limit: 10,
    offset: 0,
  });
  const results = result.results;
  await db.insert(scheduleResults).values({
    scheduleId,
    result,
    createdAt: new Date(),
    organizationId: schedule.organizationId,
  });
  const members = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.organizationId, schedule.organizationId),
  });

  const escapeMarkdown = (text: string) => {
    return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
  };

  const formattedResults = results
    .map((result: any, index: number) => {
      return (
        `${index + 1}\\. *${escapeMarkdown(result.lotName)}*\n` +
        `   \\- Описание: ${escapeMarkdown(result.lotDescription)}\n` +
        `   \\- Дополнительно: ${escapeMarkdown(result.lotAdditionalDescription)}\n` +
        `   \\- Бюджет: ${escapeMarkdown(result.budget.toLocaleString())} Тенге\\.`
      );
    })
    .join("\n\n");

  const message = `*Результаты поиска для "${escapeMarkdown(schedule.query)}"*\n\n${formattedResults}`;

  sendTelegramNotification({
    userId: members[0].userId,
    message,
    notificationType: "newReport",
  });
}

export const scheduleRouter = new Hono().basePath("/scheduled-search");

scheduleRouter.post("/", async (c) => {
  await scheduledSearch("daily");
  return c.json({ message: "Scheduled search performed" });
});
