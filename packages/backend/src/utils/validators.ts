import { z } from 'zod';

export const publicJwkValidator = z.object({
  kid: z.string().min(1),
  kty: z.string().min(1),
  n: z.string().min(1),
  e: z.string().min(1),
});

export const privateJwkValidator = z.object({
  kid: z.string().min(1),
  kty: z.string().min(1),
  n: z.string().min(1),
  e: z.string().min(1),
  d: z.string().min(1),
  p: z.string().min(1),
  q: z.string().min(1),
  dp: z.string().min(1),
  dq: z.string().min(1),
  qi: z.string().min(1),
});

// UUID Validators
// Useful for Zod schemas: z.string().regex(uuidRegex.v7)
export const uuidRegex = {
  v4: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89AB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i,
  v7: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[7][0-9a-fA-F]{3}-[89AB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i,
  all: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89AB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i,
};