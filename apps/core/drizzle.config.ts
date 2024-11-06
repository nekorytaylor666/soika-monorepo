import type { Config } from 'drizzle-kit';

export default {
	schema: './src/db/schema.ts',
	out: './drizzle',
	schemaFilter: ['public'],
	dialect: 'postgresql',
	dbCredentials: {
		host: 'aws-0-eu-central-1.pooler.supabase.com',
		database: 'postgres',
		user: 'postgres.byurjpsksirlrnzmwdsk',
		password: 'Nekorytaylor123',
		ssl: false,
	},
} satisfies Config;
