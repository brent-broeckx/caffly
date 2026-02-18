import { existsSync } from "node:fs";
import path from "node:path";

import { config as loadDotEnv } from "dotenv";

export type AppEnvironment = "development" | "staging" | "production";

export type AppConfig = {
  appEnv: AppEnvironment;
  databaseUrl: string;
  authSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
  jwtSecret?: string;
  jwtMaxAgeSeconds: number;
  sessionMaxAgeSeconds: number;
  sessionUpdateAgeSeconds: number;
  encryptionKey?: string;
  webBaseUrl?: string;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeEnvironment(value: string | undefined): AppEnvironment {
  if (value === "production") {
    return "production";
  }

  if (value === "staging") {
    return "staging";
  }

  return "development";
}

function loadEnvironmentFiles(appEnv: AppEnvironment): void {
  const cwd = process.cwd();
  const baseEnvPath = path.join(cwd, ".env");
  const environmentPath = path.join(cwd, `.env.${appEnv}`);

  if (existsSync(baseEnvPath)) {
    loadDotEnv({ path: baseEnvPath });
  }

  if (existsSync(environmentPath)) {
    loadDotEnv({ path: environmentPath, override: true });
  }
}

function requireEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

let cachedConfig: AppConfig | undefined;

export function getAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const appEnv = normalizeEnvironment(process.env.APP_ENV ?? process.env.NODE_ENV);

  loadEnvironmentFiles(appEnv);

  cachedConfig = {
    appEnv,
    databaseUrl: requireEnv("DATABASE_URL"),
    authSecret: process.env.AUTH_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    jwtMaxAgeSeconds: parsePositiveInt(process.env.JWT_MAX_AGE_SECONDS, 60 * 60 * 24 * 30),
    sessionMaxAgeSeconds: parsePositiveInt(process.env.SESSION_MAX_AGE_SECONDS, 60 * 60 * 24 * 7),
    sessionUpdateAgeSeconds: parsePositiveInt(process.env.SESSION_UPDATE_AGE_SECONDS, 60 * 60 * 24),
    encryptionKey: process.env.ENCRYPTION_KEY,
    webBaseUrl: process.env.WEB_BASE_URL
  };

  if (cachedConfig.appEnv !== "development" && !cachedConfig.authSecret) {
    throw new Error("AUTH_SECRET is required outside development environment");
  }

  return cachedConfig;
}
