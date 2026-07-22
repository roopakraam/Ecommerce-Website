import crypto from "crypto";

const ENCRYPTION_PREFIX = "v1";

function getEncryptionKey(): Buffer {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "INTEGRATIONS_ENCRYPTION_KEY is not configured. Generate one with: openssl rand -base64 32"
    );
  }

  // Prefer base64 (openssl rand -base64 32), then hex (64 chars), then utf8 pad/hash.
  let key: Buffer | null = null;

  try {
    const asBase64 = Buffer.from(raw, "base64");
    if (asBase64.length === 32) {
      key = asBase64;
    }
  } catch {
    // fall through
  }

  if (!key && /^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  }

  if (!key) {
    // Derive a stable 32-byte key from arbitrary passphrase input.
    key = crypto.createHash("sha256").update(raw, "utf8").digest();
  }

  return key;
}

/**
 * Encrypts plaintext with AES-256-GCM.
 * Output format: v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== ENCRYPTION_PREFIX) {
    throw new Error("Invalid encrypted secret format.");
  }

  const [, ivB64, tagB64, dataB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export function encryptJson(value: Record<string, string>): string {
  return encryptSecret(JSON.stringify(value));
}

export function decryptJson(payload: string): Record<string, string> {
  const parsed: unknown = JSON.parse(decryptSecret(payload));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Decrypted secrets are not a valid object.");
  }

  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(parsed)) {
    if (typeof val === "string") {
      result[key] = val;
    }
  }
  return result;
}

/** Mask a secret for UI display: keep short prefix + last 4. */
export function maskSecret(value: string, prefixLen = 4): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= 8) {
    return "****";
  }
  const prefix = trimmed.slice(0, Math.min(prefixLen, 8));
  const suffix = trimmed.slice(-4);
  return `${prefix}${"*".repeat(8)}${suffix}`;
}

export function isEncryptionKeyConfigured(): boolean {
  return Boolean(process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim());
}
