import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";

const ALGORITHM = "aes-256-gcm" as const;
const KEY_LENGTH = 32; // 256-bit
const IV_LENGTH = 12;  // 96-bit for GCM
const AUTH_TAG_LENGTH = 16;

function deriveKey(userId: string): Buffer {
  const secret = process.env.TOKEN_MASTER_SECRET;
  if (!secret) throw new Error("TOKEN_MASTER_SECRET not configured");

  return createHash("sha256")
    .update(secret + userId)
    .digest()
    .subarray(0, KEY_LENGTH);
}

export interface EncryptedData {
  ciphertext: Buffer;
  iv: Buffer;
}

export function encryptToken(plaintext: string, userId: string): EncryptedData {
  const key = deriveKey(userId);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Append auth tag to ciphertext
  const ciphertext = Buffer.concat([encrypted, authTag]);

  return { ciphertext, iv };
}

export function decryptToken(
  ciphertext: Buffer,
  iv: Buffer,
  userId: string
): string {
  const key = deriveKey(userId);

  // Extract auth tag from end of ciphertext
  const encryptedData = ciphertext.subarray(0, -AUTH_TAG_LENGTH);
  const authTag = ciphertext.subarray(-AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]).toString("utf8");
}

// Generate a cryptographically secure random string for OAuth state
export function generateSecureState(): string {
  return randomBytes(32).toString("hex");
}

// Generate a PKCE code verifier
export function generateCodeVerifier(): string {
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Generate PKCE code challenge from verifier
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update(verifier).digest();
  return hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
