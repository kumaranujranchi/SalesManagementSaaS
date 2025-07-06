import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema.js';

// Support both DATABASE_URL and NETLIFY_DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or NETLIFY_DATABASE_URL environment variable is required');
}

// Create the connection
const sql = neon(databaseUrl);

// Create the database instance
export const db = drizzle(sql, { schema });

// Export schema for convenience
export * from '@shared/schema.js';
