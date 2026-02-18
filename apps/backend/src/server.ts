import { ExpressAuth } from "@auth/express";
import { createServer } from "node:http";
import cors from "cors";
import express, { type Express } from "express";

import { createAccountRouter } from "./accounts/routes.js";
import { buildAuthConfig } from "./auth/config.js";
import { createChatRouter } from "./chat/routes.js";
import { type ChatRealtimeBroadcaster, WsChatRealtimeGateway } from "./chat/realtime.js";
import { getAppConfig } from "./config/env.js";
import { createGithubIntegrationRouter } from "./integrations/github/routes.js";
import { createProjectRouter } from "./projects/routes.js";
import { createRoomRouter } from "./rooms/routes.js";
import { createUserRouter } from "./users/routes.js";

const noopRealtime: ChatRealtimeBroadcaster = {
  broadcastMessage: () => {}
};

export function createApp(realtime: ChatRealtimeBroadcaster = noopRealtime): Express {
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
  app.use("/api/projects", createProjectRouter());
  app.use("/api/rooms", createRoomRouter());
  app.use("/api/chat", createChatRouter(realtime));
  app.use("/api/integrations/github", createGithubIntegrationRouter());
  app.use("/auth", ExpressAuth(buildAuthConfig(appConfig)));

  return app;
}

export function startBackendServer(): void {
  const app = express();
  const port = Number(process.env.PORT ?? "4000");
  const server = createServer(app);
  const realtime = new WsChatRealtimeGateway(server);
  const configuredApp = createApp(realtime);

  app.use(configuredApp);

  server.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}
