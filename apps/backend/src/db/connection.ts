import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { BlankInput } from "hono/types";
import * as schema from "./schema/schema";

const client = postgres(process.env.DATABASE_URL as string);
export const db = drizzle(client, { schema });
