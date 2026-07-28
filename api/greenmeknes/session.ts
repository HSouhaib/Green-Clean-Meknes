import * as jose from "jose";
import { env } from "../lib/env";
import type { SessionPayload, TwoFactorPendingPayload } from "./types";

const JWT_ALG = "HS256";

export async function signSessionToken(
  payload: SessionPayload
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  if (!token) {
    // Silent: no token is normal for unauthenticated requests
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) {
      return null;
    }
    return {
      unionId,
      clientId,
      twoFactorVerified: payload.twoFactorVerified as boolean | undefined,
    } as SessionPayload;
  } catch {
    // Silent: invalid/expired tokens are handled by the caller
    return null;
  }
}

export async function signTwoFactorPendingToken(
  payload: TwoFactorPendingPayload
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifyTwoFactorPendingToken(
  token: string
): Promise<TwoFactorPendingPayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId, twoFactorPending } = payload;
    if (!unionId || !clientId || !twoFactorPending) {
      return null;
    }
    return {
      unionId,
      clientId,
      twoFactorPending: true,
    } as TwoFactorPendingPayload;
  } catch {
    return null;
  }
}
