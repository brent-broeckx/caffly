import { Router, type Request, type Response } from "express";

import { getAuthenticatedUserFromRequest } from "../auth/session.js";

import { getSidebarProjectsForUser } from "./service.js";

export function createProjectRouter(): Router {
  const router = Router();

  router.get("/sidebar", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const projects = await getSidebarProjectsForUser(authUser.id);

    res.status(200).json({
      currentUser: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        image: authUser.image
      },
      projects
    });
  });

  return router;
}
