import { Router, type Request, type Response } from "express";

import { getAuthenticatedUserFromRequest } from "../auth/session.js";

import {
  createRoomForProject,
  getRoomByIdForUser,
  setRoomVisibilityForUser,
  softDeleteRoomForUser
} from "./service.js";

function parseCreateRoomBody(req: Request): { projectId?: string; name?: string } {
  const body = (req.body ?? {}) as Record<string, unknown>;

  return {
    projectId: typeof body.projectId === "string" ? body.projectId : undefined,
    name: typeof body.name === "string" ? body.name : undefined
  };
}

function parseVisibilityBody(req: Request): { visible?: boolean } {
  const body = (req.body ?? {}) as Record<string, unknown>;

  return {
    visible: typeof body.visible === "boolean" ? body.visible : undefined
  };
}

export function createRoomRouter(): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const body = parseCreateRoomBody(req);

    if (!body.projectId || !body.name?.trim()) {
      res.status(400).json({ error: "Missing required fields: projectId, name" });

      return;
    }

    try {
      const room = await createRoomForProject({
        userId: authUser.id,
        projectId: body.projectId,
        name: body.name
      });

      res.status(201).json({ room });
    } catch (error) {
      res.status(400).json({
        error: "Unable to create room",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  router.get("/:roomId", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

    if (!roomId) {
      res.status(400).json({ error: "Missing required route param: roomId" });

      return;
    }

    const room = await getRoomByIdForUser({
      userId: authUser.id,
      roomId
    });

    if (!room) {
      res.status(404).json({ error: "Room not found" });

      return;
    }

    res.status(200).json({ room });
  });

  router.delete("/:roomId", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;

    if (!roomId) {
      res.status(400).json({ error: "Missing required route param: roomId" });

      return;
    }

    try {
      await softDeleteRoomForUser({
        userId: authUser.id,
        roomId
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({
        error: "Unable to delete room",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  router.patch("/:roomId/visibility", async (req: Request, res: Response) => {
    const authUser = await getAuthenticatedUserFromRequest(req);

    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });

      return;
    }

    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const body = parseVisibilityBody(req);

    if (!roomId) {
      res.status(400).json({ error: "Missing required route param: roomId" });

      return;
    }

    if (body.visible === undefined) {
      res.status(400).json({ error: "Missing required field: visible" });

      return;
    }

    try {
      await setRoomVisibilityForUser({
        userId: authUser.id,
        roomId,
        visible: body.visible
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({
        error: "Unable to update room visibility",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return router;
}
