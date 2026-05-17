import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { getUserId } from "./helpers.js";

export const appleHealthRouter = Router();

const authPayload = z.object({
  permissionsGranted: z.array(z.string()).min(1)
});

const syncPayload = z.object({
  direction: z.enum(["EXPORT_TO_APPLE_HEALTH", "IMPORT_FROM_APPLE_HEALTH"]),
  startedAt: z.string().datetime().optional()
});

appleHealthRouter.get("/status", async (req, res) => {
  const userId = getUserId(req);
  const integration = await prisma.appleHealthIntegration.findUnique({
    where: { userId }
  });

  res.json({
    data: integration ?? {
      connected: false,
      permissions: [],
      lastSyncAt: null,
      note: "Connect iOS app to HealthKit to enable sync."
    }
  });
});

appleHealthRouter.post("/connect", async (req, res) => {
  const userId = getUserId(req);
  const input = authPayload.parse(req.body);

  const integration = await prisma.appleHealthIntegration.upsert({
    where: { userId },
    update: {
      connected: true,
      permissions: input.permissionsGranted,
      connectedAt: new Date()
    },
    create: {
      userId,
      connected: true,
      permissions: input.permissionsGranted,
      connectedAt: new Date()
    }
  });

  res.status(201).json({ data: integration });
});

appleHealthRouter.post("/sync", async (req, res) => {
  const userId = getUserId(req);
  const input = syncPayload.parse(req.body);

  const event = await prisma.appleHealthSyncEvent.create({
    data: {
      userId,
      direction: input.direction,
      status: "QUEUED",
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      details: {
        note: "Initial placeholder. Wire this to iOS HealthKit sync worker."
      }
    }
  });

  res.status(202).json({ data: event });
});

appleHealthRouter.get("/sync/history", async (req, res) => {
  const userId = getUserId(req);
  const events = await prisma.appleHealthSyncEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 25
  });

  res.json({ data: events });
});
