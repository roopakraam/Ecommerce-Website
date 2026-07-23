import { afterEach, describe, expect, it } from "vitest";
import {
  decryptJson,
  decryptSecret,
  encryptSecret,
  isEncryptionKeyConfigured,
  maskSecret,
} from "@/lib/integrations/crypto";

const ORIGINAL_KEY = process.env.INTEGRATIONS_ENCRYPTION_KEY;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
  } else {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = ORIGINAL_KEY;
  }
});

describe("integrations crypto", () => {
  it("round-trips secrets with a 32-byte key", () => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      "base64"
    );

    const encrypted = encryptSecret("super-secret");
    expect(encrypted.startsWith("v1:")).toBe(true);
    expect(decryptSecret(encrypted)).toBe("super-secret");
  });

  it("round-trips JSON and drops non-string values", () => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString(
      "base64"
    );
    const encrypted = encryptSecret(
      JSON.stringify({
        key_id: "rzp_test",
        key_secret: "secret",
        nested: 123,
      })
    );
    expect(decryptJson(encrypted)).toEqual({
      key_id: "rzp_test",
      key_secret: "secret",
    });
  });

  it("masks secrets for UI", () => {
    expect(maskSecret("short")).toBe("****");
    expect(maskSecret("abcdefghij")).toBe("abcd********ghij");
  });

  it("reports when encryption key is configured", () => {
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
    expect(isEncryptionKeyConfigured()).toBe(false);
    process.env.INTEGRATIONS_ENCRYPTION_KEY = "passphrase";
    expect(isEncryptionKeyConfigured()).toBe(true);
  });
});
