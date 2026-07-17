import crypto from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { env } from "./env";
import type { User } from "@db/schema";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const BACKUP_CODE_COUNT = 8;

function deriveKey(): Buffer {
  // Derive a stable 32-byte key from APP_SECRET using SHA-256.
  return crypto.createHash("sha256").update(env.appSecret).digest();
}

export function encryptSecret(plainSecret: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainSecret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

export function decryptSecret(encryptedSecret: string): string {
  const key = deriveKey();
  const combined = Buffer.from(encryptedSecret, "base64");
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function generateSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function getProvisioningUri(user: User, secret: string): string {
  const issuer = "GreenCleanMeknes";
  const accountName = user.email || user.name || user.unionId;
  const totp = new OTPAuth.TOTP({
    issuer,
    label: accountName,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export async function generateQrDataUrl(
  provisioningUri: string
): Promise<string> {
  return QRCode.toDataURL(provisioningUri, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

export function verifyCode(encryptedSecret: string, code: string): boolean {
  try {
    const secret = decryptSecret(encryptedSecret);
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    // Allow a small window around the current time to account for clock drift.
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    plain.push(code);
    hashed.push(hashBackupCode(code));
  }
  return { plain, hashed };
}

export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; remaining: string[] } {
  const target = hashBackupCode(code);
  const index = hashedCodes.findIndex(h => h === target);
  if (index === -1) {
    return { valid: false, remaining: hashedCodes };
  }
  const remaining = [...hashedCodes];
  remaining.splice(index, 1);
  return { valid: true, remaining };
}
