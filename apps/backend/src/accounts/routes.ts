import { Router, type Request, type Response } from "express";

import { linkProviderAccount, listAccountsForUser } from "./service.js";

function parseLinkAccountBody(req: Request): {
  userId?: string;
  provider?: string;
  providerAccountId?: string;
  type?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
} {
  const body = (req.body ?? {}) as Record<string, unknown>;

  return {
    userId: typeof body.userId === "string" ? body.userId : undefined,
    provider: typeof body.provider === "string" ? body.provider : undefined,
    providerAccountId: typeof body.providerAccountId === "string" ? body.providerAccountId : undefined,
    type: typeof body.type === "string" ? body.type : undefined,
    accessToken: typeof body.accessToken === "string" ? body.accessToken : undefined,
    refreshToken: typeof body.refreshToken === "string" ? body.refreshToken : undefined,
    idToken: typeof body.idToken === "string" ? body.idToken : undefined
  };
}

export function createAccountRouter(): Router {
  const router = Router();

  router.post("/link", async (req: Request, res: Response) => {
    try {
      const input = parseLinkAccountBody(req);

      if (!input.userId || !input.provider || !input.providerAccountId) {
        res.status(400).json({
          error: "Missing required fields: userId, provider, providerAccountId"
        });

        return;
      }

      const account = await linkProviderAccount({
        userId: input.userId,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        type: input.type,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        idToken: input.idToken
      });

      res.status(201).json({ account });
    } catch (error) {
      res.status(400).json({
        error: "Unable to link account",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  router.get("/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params as { userId: string };
      const accounts = await listAccountsForUser(userId);

      res.status(200).json({ accounts });
    } catch (error) {
      res.status(400).json({
        error: "Unable to list accounts",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return router;
}
