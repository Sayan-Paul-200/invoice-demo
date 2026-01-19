import express from 'express';
import cookieParser from 'cookie-parser';
import { importJWK } from 'jose';
import { readFileSync } from 'fs';
import { join } from 'path'; // Removed 'dirname'

// Import Routers
import { IAMv1Router } from './iam/v1';
import { APIv1Router } from './api/v1';

// Import from db shared library
import { RunDbMigration, CreateDrizzleClient } from '@invoice-management-system/db';
import type { CreateNativeDbClientInput } from '@invoice-management-system/db';

import { JWKS } from './utils/types';
import { addGlobalContext, errorHandler, addDelay } from './utils/middlewares';
import { publicJwkValidator, privateJwkValidator } from './utils/validators';
import { ensureBucketExists } from './utils/minio';

// Type augmentation for Express
// declare module 'express-serve-static-core' {
//   interface Request {
//     globalContext: GlobalContext;
//     context: RequestContext;
//     jwks: JWKS;
//   }
// }

// NOTE: We use process.cwd() to avoid ESM/CommonJS conflicts with __dirname
// process.cwd() in Nx points to the workspace root.

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Validate environment variables
const requiredEnv = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DATABASE',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'IAM_JWK_PUBLIC_KEY_PATH',
  'IAM_JWK_PRIVATE_KEY_PATH',
  'MINIO_ENDPOINT',
  'MINIO_PORT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET_NAME',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_FROM',
];

requiredEnv.forEach((envVar) => {
  if (!(envVar in process.env)) {
    throw new Error(`${envVar} is not defined`);
  }
});

const dbConfig: CreateNativeDbClientInput = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
  database: process.env.POSTGRES_DATABASE ?? 'localhost',
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  max: 10,
};

async function main() {
  console.log('🚀 Starting Server...');

  // 1. Parse JWKs using process.cwd() (Workspace Root)
  const publicJwk = publicJwkValidator.parse(
    JSON.parse(readFileSync(join(process.cwd(), process.env.IAM_JWK_PUBLIC_KEY_PATH ?? ''), 'utf8')),
  );
  const privateJwk = privateJwkValidator.parse(
    JSON.parse(readFileSync(join(process.cwd(), process.env.IAM_JWK_PRIVATE_KEY_PATH ?? ''), 'utf8')),
  );

  const jwks: JWKS = {
    publicKey: await importJWK(publicJwk, 'RS256'),
    privateKey: await importJWK(privateJwk, 'RS256'),
  };

  // 2. Perform database migration
  console.log('📦 Running Migrations...');
  await RunDbMigration(dbConfig);
  const dbClient = CreateDrizzleClient(dbConfig);

  // 3. Initialize MinIO Bucket (Ensure it exists)
  console.log('🪣 Checking Storage...');
  await ensureBucketExists();

  // 4. Start express server
  express()
    // Setup Middlewares
    .use(express.json())
    .use(cookieParser())

    // Setup global context middleware
    .use(addGlobalContext({ dbClient, jwks }))

    // Add delay middleware (Dev only)
    .use(addDelay(1000))

    // Setup API Routes
    .use('/iam/v1', IAMv1Router)
    .use('/api/v1', APIv1Router)

    .get('/', (_req, res) => {
      res.send({ message: 'Invoice Management System API' });
    })

    // Add error handling middleware
    .use(errorHandler)

    // Start the server
    // .on('error', console.error)
    .listen(port, host, () => {
      console.log(`✅ Listening at http://${host}:${port}`);
    });
}

main().catch(console.error);