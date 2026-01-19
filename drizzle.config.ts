import { defineConfig } from 'drizzle-kit';

// Validate environment variables
['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DATABASE', 'POSTGRES_USER', 'POSTGRES_PASSWORD'].forEach((envVar) => {
  if (!(envVar in process.env)) {
    throw new Error(`${envVar} is not defined`);
  }
});

export default defineConfig({
  schema: './libs/db/src/schema/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env['POSTGRES_HOST'] ?? 'localhost',
    port: parseInt(process.env['POSTGRES_PORT'] ?? '5432'),
    database: process.env['POSTGRES_DATABASE'] ?? 'ims',
    user: process.env['POSTGRES_USER'] ?? 'postgres',
    password: process.env['POSTGRES_PASSWORD'] ?? '',
    ssl: false,
  },
});
