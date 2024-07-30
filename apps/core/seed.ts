import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

config({ path: '.dev.vars' });

const db = drizzle(postgres(`${process.env.DATABASE_URL}`, { ssl: 'require', max: 1 }));
