import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { asDate, getUserId } from "./helpers.js";

export const recoveryRouter = Router();

const recoveryInput = z.object({
  date: z.string().min(1),
  sleepHours: z.number().min(0).max(24),
  energy: z.number().int().min(1).max(10),
  soreness: z.number().int().min(1).max(10),
  stress: z.number().int().min(1).max(10)
});

const feedbackInput = z.object({
  date: z.string().min(1),
  exercise: z.string().min(1),
  feltStrength: z.number().int().min(-2).max(2),
  jointPain: z.number().int().min(0).max(10),
  notes: z.string().optional()
});

recoveryRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  const checkIns = await prisma.recoveryCheckIn.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 50
  });
  res.json({ data: checkIns });
});

recoveryRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const input = recoveryInput.parse(req.body);

  const checkIn = await prisma.recoveryCheckIn.upsert({
    where: {
      userId_date: {
        userId,
        date: asDate(input.date)
      }
    },
    update: {
      sleepHours: input.sleepHours,
      energy: input.energy,
      soreness: input.soreness,
      stress: input.stress
    },
    create: {
      userId,
      date: asDate(input.date),
      sleepHours: input.sleepHours,
      energy: input.energy,
      soreness: input.soreness,
      stress: input.stress
    }
  });

  res.status(201).json({ data: checkIn });
});

recoveryRouter.get("/feedback", async (req, res) => {
  const userId = getUserId(req);
  const feedback = await prisma.liftFeedback.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 50
  });
  res.json({ data: feedback });
});

recoveryRouter.post("/feedback", async (req, res) => {
  const userId = getUserId(req);
  const input = feedbackInput.parse(req.body);

  const feedback = await prisma.liftFeedback.create({
    data: {
      userId,
      date: asDate(input.date),
      exercise: input.exercise,
      feltStrength: input.feltStrength,
      jointPain: input.jointPain,
      notes: input.notes
    }
  });

  res.status(201).json({ data: feedback });
});
