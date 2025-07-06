import { defineConfig } from "drizzle-kit";

// Support both DATABASE_URL and NETLIFY_DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or NETLIFY_DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
