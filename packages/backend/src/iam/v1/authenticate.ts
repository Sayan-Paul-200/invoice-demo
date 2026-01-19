import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { verify } from 'argon2';
import { z } from 'zod';

import { schema } from '@invoice-management-system/db';
import { 
  issueRefreshToken, 
  issueAccessToken, 
  parseRefreshToken, 
  getAccountInfo, 
  getUserMetadataById 
} from '@invoice-management-system/iam';

const router = Router({ mergeParams: true });

// --- Validators ---

export const EmailLoginValidator = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const TokenLoginValidator = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// --- Endpoints ---

// POST /iam/v1/authenticate/email
router.post('/email', async (req, res): Promise<void> => {
  const { privateKey } = req.jwks;
  const { dbClient } = req.globalContext;

  const validated = EmailLoginValidator.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ 
      errors: validated.error.issues.map(issue => ({
        path: issue.path,
        message: issue.message
      })) 
    });
    return;
  }

  const { email, password } = validated.data;

  // 1. Fetch User Credentials
  const userCredentials = await dbClient
    .select({
      userId: schema.userEmails.userId,
      passwordHash: schema.userCredentials.passwordHash,
    })
    .from(schema.userEmails)
    .innerJoin(schema.userCredentials, eq(schema.userEmails.userId, schema.userCredentials.userId))
    .where(eq(schema.userEmails.email, email));

  if (userCredentials.length === 0 || !(await verify(userCredentials[0].passwordHash, password))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // 2. Issue Refresh Token
  try {
    const { refreshToken, refreshTokenExpiry } = await issueRefreshToken({
      application: 'invoice-system',
      userId: userCredentials[0].userId,
      privateKey,
    });

    // Set HTTP-Only Cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: refreshTokenExpiry,
    });

    res.json({ refreshToken, refreshTokenExpiry: refreshTokenExpiry.toISOString() });
  } catch (error) {
    console.error('Error issuing refresh token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /iam/v1/authenticate/token
router.post('/token', async (req, res): Promise<void> => {
  const { publicKey, privateKey } = req.jwks;
  const { dbClient } = req.globalContext;

  const refreshTokenInput = req.body.refreshToken || req.cookies.refresh_token;

  const validated = TokenLoginValidator.safeParse({ refreshToken: refreshTokenInput });
  if (!validated.success) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  try {
    // 1. Parse Refresh Token
    const parsedRefreshToken = await parseRefreshToken({ 
      token: validated.data.refreshToken, 
      publicKey 
    });

    // 2. Fetch User Context (Role & Project)
    // This uses the function we defined in the IAM library
    const accountInfo = await getAccountInfo({ 
      dbClient, 
      userId: parsedRefreshToken.userId 
    });

    if (!accountInfo) {
      res.status(403).json({ error: 'User account not active or found' });
      return;
    }

    // 3. Fetch Basic Metadata (Name)
    const userMetadata = await getUserMetadataById({ 
      dbClient, 
      userId: parsedRefreshToken.userId 
    });

    // 4. Issue Access Token
    const { accessToken, accessTokenExpiry } = await issueAccessToken({
      refreshToken: parsedRefreshToken,
      fullName: userMetadata.fullName,
      account: accountInfo, // Injects { role, projectId, permissions }
      privateKey,
    });

    res.json({ accessToken, accessTokenExpiry: accessTokenExpiry.toISOString() });
  } catch (error) {
    console.error('Error issuing access token:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out successfully' });
});

export { router as authenticateRouter };