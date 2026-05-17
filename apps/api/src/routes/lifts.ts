import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { asDate, getUserId } from "./helpers.js";

export const liftsRouter = Router();

const workoutInput = z.object({
  date: z.string().min(1),
  exercise: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
  rpe: z.number().min(1).max(10),
  notes: z.string().optional()
});

liftsRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 50
  });

  res.json({ data: sessions });
});

liftsRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const input = workoutInput.parse(req.body);

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      date: asDate(input.date),
      exercise: input.exercise,
      sets: input.sets,
      reps: input.reps,
      weight: input.weight,
      rpe: input.rpe,
      notes: input.notes
    }
  });

  res.status(201).json({ data: session });
});
