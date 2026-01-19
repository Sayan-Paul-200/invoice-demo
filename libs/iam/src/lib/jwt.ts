import { CryptoKey, CompactSign, compactVerify } from 'jose'; 
import { v7 as uuidv7 } from 'uuid';

import { REFRESH_TOKEN_EXPIRY_SECONDS, ACCESS_TOKEN_EXPIRY_SECONDS } from './constants';
import { JWTRefreshToken, JWTAccessToken, AccountInfo } from './types';


type IssueRefreshTokenInput = {
  application: string;
  userId: string;
  privateKey: CryptoKey | Uint8Array;
};

export async function issueRefreshToken(input: IssueRefreshTokenInput) {
  const tokenUUID = uuidv7();
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setSeconds(refreshTokenExpiry.getSeconds() + REFRESH_TOKEN_EXPIRY_SECONDS);

  const refreshTokenData: JWTRefreshToken = {
    tokenUUID,
    application: input.application,
    userId: input.userId,
  };

  const refreshToken = await new CompactSign(new TextEncoder().encode(JSON.stringify(refreshTokenData)))
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', exp: refreshTokenExpiry.toUTCString() })
    .sign(input.privateKey);

  return { refreshToken, refreshTokenExpiry };
}


type IssueAccessTokenInput = {
  refreshToken: JWTRefreshToken;
  fullName: string;
  account: AccountInfo; // Uses our new AccountInfo
  privateKey: CryptoKey | Uint8Array;
};

export async function issueAccessToken(input: IssueAccessTokenInput) {
  const tokenUUID = uuidv7();
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setSeconds(accessTokenExpiry.getSeconds() + ACCESS_TOKEN_EXPIRY_SECONDS);

  const accessTokenData: JWTAccessToken = {
    tokenUUID,
    parentTokenUUID: input.refreshToken.tokenUUID,
    application: input.refreshToken.application,
    userId: input.refreshToken.userId,
    fullName: input.fullName,
    account: input.account,
  };

  const accessToken = await new CompactSign(new TextEncoder().encode(JSON.stringify(accessTokenData)))
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', exp: accessTokenExpiry.toISOString() })
    .sign(input.privateKey);

  return { accessToken, accessTokenExpiry };
}

type ParseTokenInput = {
  token: string;
  publicKey: CryptoKey | Uint8Array;
};

export async function parseRefreshToken({ token, publicKey }: ParseTokenInput): Promise<JWTRefreshToken> {
  const { payload } = await compactVerify(token, publicKey);
  return JSON.parse(new TextDecoder().decode(payload));
}

export async function parseAccessToken({ token, publicKey }: ParseTokenInput): Promise<JWTAccessToken> {
  const { payload } = await compactVerify(token, publicKey);
  return JSON.parse(new TextDecoder().decode(payload));
}