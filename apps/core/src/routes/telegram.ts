import { Context, Telegraf } from "telegraf";
import { db } from "db/connection";
import { telegramUsers, notificationPreferences, user } from "db/schema";
import { eq } from "drizzle-orm";
import { TELEGRAM_BOT_TOKEN } from "../lib/config";
import { Hono } from "hono";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.start(async (ctx: Context) => {
  const startPayload = ctx.startPayload;
  if (!startPayload) {
    return ctx.reply(
      "Please use the link provided in the application to start the bot.",
    );
  }

  const telegramId = ctx.from.id.toString();
  const chatId = ctx.chat.id.toString();

  try {
    // Decode the base64 payload to get the profile ID
    const userId = Buffer.from(startPayload, "base64").toString("utf-8");

    const existingUser = await db.query.telegramUsers.findFirst({
      where: eq(telegramUsers.userId, userId),
    });

    if (existingUser) {
      return ctx.reply(
        "Your Telegram account is already linked to your profile.",
      );
    }

    const userProfile = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userProfile) {
      return ctx.reply(
        "No account found with this profile ID. Please check and try again.",
      );
    }

    await db.insert(telegramUsers).values({
      userId: userProfile.id,
      telegramId,
      chatId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });

    await db.insert(notificationPreferences).values({
      userId: userProfile.id,
    });

    ctx.reply(
      "Your Telegram account has been successfully linked to your profile!",
    );
  } catch (error) {
    console.error("Error linking Telegram account:", error);
    ctx.reply(
      "An error occurred while linking your account. Please try again later.",
    );
  }
});

export const telegramRoutes = new Hono().basePath("/telegram");

telegramRoutes.post("/send", async (c) => {
  const { userId, message, notificationType } = await c.req.json();
  await sendTelegramNotification({ userId, message, notificationType });
  return c.json({ message: "Notification sent" });
});

export async function sendTelegramNotification({
  userId,
  message,
  notificationType,
}: {
  userId: string;
  message: string;
  notificationType: "newReport" | "newRecommendation";
}) {
  const telegramUser = await db.query.telegramUsers.findFirst({
    where: eq(telegramUsers.userId, userId),
  });

  if (!telegramUser) {
    console.log(`No Telegram user found for profile ${userId}`);
    return;
  }

  const preferences = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });

  if (
    (notificationType === "newReport" && preferences?.newReports) ||
    (notificationType === "newRecommendation" &&
      preferences?.newRecommendations)
  ) {
    await bot.telegram.sendMessage(telegramUser.chatId, message, {
      parse_mode: "MarkdownV2",
    });
  }
}

export async function startTelegramBot() {
  bot.launch();
  console.log("Telegram bot started");
}
