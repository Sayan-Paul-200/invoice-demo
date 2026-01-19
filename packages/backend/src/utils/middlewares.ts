import { RequestHandler } from 'express';
import { parseAccessToken } from '@invoice-management-system/iam';
import { GlobalContext, JWKS } from './types';

type AddGlobalContextInput = GlobalContext & {
  jwks: JWKS;
};

export const addGlobalContext = ({ dbClient, jwks }: AddGlobalContextInput): RequestHandler => {
  return (req, _res, next) => {
    req.globalContext = { dbClient };
    req.jwks = jwks;
    next();
  };
};

export const addContext: RequestHandler = async (req, res, next) => {
  let authorizationHeader = req.header('Authorization') ?? '';

  if (!authorizationHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  authorizationHeader = authorizationHeader.slice(7);

  try {
    const accessToken = await parseAccessToken({
      token: authorizationHeader,
      publicKey: req.jwks.publicKey,
    });

    req.context = {
      userId: accessToken.userId,
      role: accessToken.account.role,
      projectId: accessToken.account.projectId,
      permissions: accessToken.account.permissions,
    };
    next();
  } catch (error) {
    console.error('Invalid Access Token:', error);
    res.status(401).json({ error: 'Invalid or Expired Token' });
  }
};

// --- ADDED BACK ---
// Useful for testing frontend loading states
export const addDelay =
  (delay: number): RequestHandler =>
  (_req, _res, next) => {
    setTimeout(next, delay);
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};