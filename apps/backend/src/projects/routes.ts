import { Router, type Request, type Response } from "express";

import { getAuthenticatedUserFromRequest } from "../auth/session.js";

import {
  createWorkspaceRoomForUser,
  getSidebarProjectsForUser,
  setProjectVisibilityForUser,
  softDeleteProjectForUser
} from "./service.js";

function parseCreateWorkspaceRoomBody(req: Request): { name?: string } {
  const body = (req.body ?? {}) as Record<string, unknown>;

  return {
    name: typeof body.name === "string" ? body.name : undefined
  };
}

function parseVisibilityBody(req: Request): { visible?: boolean } {
  const body = (req.body ?? {}) as Record<string, unknown>;

  return {
    visible: typeof body.visible === "boolean" ? body.visible : undefined
  };
}

export function createProjectRouter(): Router {
  const router = Router();

  router.post("/rooms", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const body = parseCreateWorkspaceRoomBody(req);

    if (!body.name?.trim()) {
      res.status(400).json({ error: "Missing required field: name" });

      return;
    }

    try {
      const created = await createWorkspaceRoomForUser({
        userId: authUser.id,
        name: body.name
      });

      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({
        error: "Unable to create workspace room",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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

  router.delete("/:projectId", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;

    if (!projectId) {
      res.status(400).json({ error: "Missing required route param: projectId" });

      return;
    }

    try {
      await softDeleteProjectForUser({
        userId: authUser.id,
        projectId
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({
        error: "Unable to delete project",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  router.patch("/:projectId/visibility", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
    const body = parseVisibilityBody(req);

    if (!projectId) {
      res.status(400).json({ error: "Missing required route param: projectId" });

      return;
    }

    if (body.visible === undefined) {
      res.status(400).json({ error: "Missing required field: visible" });

      return;
    }

    try {
      await setProjectVisibilityForUser({
        userId: authUser.id,
        projectId,
        visible: body.visible
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({
        error: "Unable to update project visibility",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return router;
}
