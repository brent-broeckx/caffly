import { Router, type Request, type Response } from "express";

import { createCoreUser, getCoreUserById } from "./service.js";

function parseCreateUserBody(req: Request): {
  username?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  githubUserId?: string;
} {
  const body = (req.body ?? {}) as Record<string, unknown>;

  return {
    username: typeof body.username === "string" ? body.username : undefined,
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
    githubUserId: typeof body.githubUserId === "string" ? body.githubUserId : undefined
  };
}

export function createUserRouter(): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    try {
      const user = await createCoreUser(parseCreateUserBody(req));

      res.status(201).json({ user });
    } catch (error) {
      res.status(400).json({
        error: "Unable to create user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  router.get("/:id", async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const user = await getCoreUserById(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });

      return;
    }

    res.status(200).json({ user });
  });

  return router;
}
