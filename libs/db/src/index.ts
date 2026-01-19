import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import * as schema from './schema/schema';
export * from './schema/schema';

export type NativeDbClient = postgres.Sql<Record<string, unknown>>;

export type DrizzleClient = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql<Record<string, unknown>>;
};

export type CreateNativeDbClientInput = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
};

// Database Client
export function createNativeDbClient(input: CreateNativeDbClientInput): NativeDbClient {
  return postgres(input);
}

// Drizzle Client
export function GetDrizzleClient(postgresClient: NativeDbClient): DrizzleClient {
  return drizzle(postgresClient, { schema });
}

export function CreateDrizzleClient(input: CreateNativeDbClientInput): DrizzleClient {
  const postgresClient = createNativeDbClient(input);
  return drizzle(postgresClient, { schema });
}

// Migration Client
export async function RunDbMigration(input: CreateNativeDbClientInput) {
  const migrationClient = postgres({
    ...input,
    max: 1,
    onnotice: () => {
      /* Ignore notices */
    },
  });

  await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
  await migrationClient.end();
}

export { schema };