import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import type { AppConfig } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

function resolveEncryptionKey(appConfig: AppConfig): Buffer {
  const rawKey = appConfig.encryptionKey?.trim();

  if (!rawKey) {
    if (appConfig.appEnv === "development") {
      return createHash("sha256").update("dev-encryption-key-fallback").digest();
    }

    throw new Error("ENCRYPTION_KEY is required to store provider tokens securely");
  }

  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }

  const base64Key = Buffer.from(rawKey, "base64");

  if (base64Key.length === 32) {
    return base64Key;
  }

  return createHash("sha256").update(rawKey).digest();
}

export function encryptToken(token: string | null | undefined, appConfig: AppConfig): string | null {
  if (!token) {
    return null;
  }

  const key = resolveEncryptionKey(appConfig);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `v1.${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptToken(payload: string | null | undefined, appConfig: AppConfig): string | null {
  if (!payload) {
    return null;
  }

  const [version, ivBase64, authTagBase64, encryptedBase64] = payload.split(".");

  if (version !== "v1" || !ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Unsupported encrypted token format");
  }

  const key = resolveEncryptionKey(appConfig);
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf8");
}

