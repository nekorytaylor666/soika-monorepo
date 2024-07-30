import { Context, Telegraf } from 'telegraf';
import { db } from 'db/connection';
import { telegramUsers, notificationPreferences, profile } from 'db/schema/schema';
import { eq } from 'drizzle-orm';
import { TELEGRAM_BOT_TOKEN } from '../lib/config';
import { Hono } from 'hono';

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.start(async (ctx: Context) => {
	const startPayload = ctx.startPayload;
	if (!startPayload) {
		return ctx.reply('Please use the link provided in the application to start the bot.');
	}

	const telegramId = ctx.from.id.toString();
	const chatId = ctx.chat.id.toString();

	try {
		// Decode the base64 payload to get the profile ID
		const profileId = Buffer.from(startPayload, 'base64').toString('utf-8');

		const existingUser = await db.query.telegramUsers.findFirst({
			where: eq(telegramUsers.profileId, profileId),
		});

		if (existingUser) {
			return ctx.reply('Your Telegram account is already linked to your profile.');
		}

		const userProfile = await db.query.profile.findFirst({
			where: eq(profile.id, profileId),
		});

		if (!userProfile) {
			return ctx.reply('No account found with this profile ID. Please check and try again.');
		}

		await db.insert(telegramUsers).values({
			profileId: userProfile.id,
			telegramId,
			chatId,
			username: ctx.from.username,
			firstName: ctx.from.first_name,
			lastName: ctx.from.last_name,
		});

		await db.insert(notificationPreferences).values({
			profileId: userProfile.id,
		});

		ctx.reply('Your Telegram account has been successfully linked to your profile!');
	} catch (error) {
		console.error('Error linking Telegram account:', error);
		ctx.reply('An error occurred while linking your account. Please try again later.');
	}
});

export const telegramRoutes = new Hono().basePath('/telegram');

telegramRoutes.post('/send', async (c) => {
	const { profileId, message, notificationType } = await c.req.json();
	await sendTelegramNotification({ profileId, message, notificationType });
	return c.json({ message: 'Notification sent' });
});

export async function sendTelegramNotification({
	profileId,
	message,
	notificationType,
}: {
	profileId: string;
	message: string;
	notificationType: 'newReport' | 'newRecommendation';
}) {
	const telegramUser = await db.query.telegramUsers.findFirst({
		where: eq(telegramUsers.profileId, profileId),
	});

	if (!telegramUser) {
		console.log(`No Telegram user found for profile ${profileId}`);
		return;
	}

	const preferences = await db.query.notificationPreferences.findFirst({
		where: eq(notificationPreferences.profileId, profileId),
	});

	if (
		(notificationType === 'newReport' && preferences?.newReports) ||
		(notificationType === 'newRecommendation' && preferences?.newRecommendations)
	) {
		await bot.telegram.sendMessage(telegramUser.chatId, message, { parse_mode: 'MarkdownV2' });
	}
}

export async function startTelegramBot() {
	bot.launch();
	console.log('Telegram bot started');
}
