import { ExpressAuth } from "@auth/express";
import cors from "cors";
import express, { type Express } from "express";

import { createAccountRouter } from "./accounts/routes.js";
import { buildAuthConfig } from "./auth/config.js";
import { getAppConfig } from "./config/env.js";
import { createGithubIntegrationRouter } from "./integrations/github/routes.js";
import { createUserRouter } from "./users/routes.js";

export function createApp(): Express {
  const app = express();
  const appConfig = getAppConfig();

  app.set("trust proxy", true);
  app.use(
    cors({
      origin: appConfig.webBaseUrl?.trim() || "http://localhost:5173",
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "backend",
      environment: appConfig.appEnv
    });
  });

  app.use("/api/users", createUserRouter());
  app.use("/api/accounts", createAccountRouter());
  app.use("/api/integrations/github", createGithubIntegrationRouter());
  app.use("/auth", ExpressAuth(buildAuthConfig(appConfig)));

  return app;
}

export function startBackendServer(): void {
  const app = createApp();
  const port = Number(process.env.PORT ?? "4000");

  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}
