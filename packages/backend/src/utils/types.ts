import type { Request } from 'express';
import type { CryptoKey } from 'jose';
import type { DrizzleClient } from '@invoice-management-system/db';

export type Maybe<T> = NonNullable<T> | undefined;

export type RoleScopes = 'admin' | 'staff' | 'accountant' | 'other';

type QueryParameter = Record<string, string>;

export type TypedRequestQuery<T = QueryParameter> = Request & {
  query: T;
};

export type GetUpdateType<T> = {
  id: string;
} & Partial<T>;

// Parameters globally available in the request context
export type GlobalContext = {
  dbClient: DrizzleClient;
};

// Parameters that will be decoded from JWT and injected into request context
export type RequestContext = {
  userId: string;
  role: RoleScopes;
  projectId?: string;
  projectName?: string;
  permissions: string[];
};

export type JWKS = {
  publicKey: CryptoKey | Uint8Array;
  privateKey: CryptoKey | Uint8Array;
};

export type PhotoUploadSuccessResponse = {
  uploadKey: string;
};

// Module Augmentation to extend Express Request safely
declare module 'express-serve-static-core' {
  interface Request {
    globalContext: GlobalContext;
    context: RequestContext;
    jwks: JWKS;
  }
}