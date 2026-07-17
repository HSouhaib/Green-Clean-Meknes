import * as jose from "jose";
import QRCode from "qrcode";
import { env } from "./env";

const JWT_ALG = "HS256";
const BADGE_EXPIRES_IN = "7d";

export interface BadgePayload {
  userId: number;
  campaignId: number;
  role: string;
}

export async function generateBadgeToken(
  payload: BadgePayload
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(BADGE_EXPIRES_IN)
    .sign(secret);
}

export async function verifyBadgeToken(
  token: string
): Promise<BadgePayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const userId = Number(payload.userId);
    const campaignId = Number(payload.campaignId);
    const role = String(payload.role || "");
    if (!userId || !campaignId || !role) {
      return null;
    }
    return { userId, campaignId, role };
  } catch {
    return null;
  }
}

export async function generateBadgeQr(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    width: 256,
    margin: 2,
    color: {
      dark: "#6B8E5A",
      light: "#0000",
    },
  });
}
