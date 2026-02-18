import { Router, type Request, type Response } from "express";

import { validateGithubApiAccess } from "./service.js";

export function createGithubIntegrationRouter(): Router {
  const router = Router();

  router.post("/validate", async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const userId = typeof body.userId === "string" ? body.userId : undefined;
      const providerAccountId =
        typeof body.providerAccountId === "string" ? body.providerAccountId : undefined;

      const result = await validateGithubApiAccess({
        userId,
        providerAccountId
      });

      res.status(result.statusCode).json(result);
    } catch (error) {
      res.status(400).json({
        ok: false,
        provider: "github",
        message: error instanceof Error ? error.message : "Unexpected validation failure"
      });
    }
  });

  return router;
}
