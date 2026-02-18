import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotEnv } from "dotenv";

import { defineConfig } from "prisma/config";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));

const normalizeEnvironment = (value: string | undefined): "development" | "staging" | "production" => {
  if (value === "production") {
    return "production";
  }

  if (value === "staging") {
    return "staging";
  }

  return "development";
};

const appEnv = normalizeEnvironment(process.env.APP_ENV ?? process.env.NODE_ENV);

const baseEnvPath = path.join(backendRoot, ".env");
const environmentPath = path.join(backendRoot, `.env.${appEnv}`);

if (existsSync(baseEnvPath)) {
  loadDotEnv({ path: baseEnvPath });
}

if (existsSync(environmentPath)) {
  loadDotEnv({ path: environmentPath, override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db"
  }
});
