import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file explicitly
// This ensures .env takes precedence over system environment variables
config({ path: resolve(process.cwd(), '.env'), override: true });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Debug: Log database connection (hide password)
const dbUrlForLog = process.env.DATABASE_URL.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
console.log(`[Database] Connecting to: ${dbUrlForLog}`);

// Create postgres connection
// This driver works with standard PostgreSQL and Supabase
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
