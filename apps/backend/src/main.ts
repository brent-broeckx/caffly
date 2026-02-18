import { getAppConfig } from "./config/env.js";
import { createApp, startBackendServer } from "./server.js";

export function bootstrapBackend(): string {
  getAppConfig();
  createApp();

  return "backend-ready";
}

if (process.env.NODE_ENV !== "test") {
  startBackendServer();
}
