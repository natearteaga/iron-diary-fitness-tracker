import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { asDate, getUserId } from "./helpers.js";

export const mealsRouter = Router();

const mealInput = z.object({
  loggedAt: z.string().min(1),
  name: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  isPreWorkout: z.boolean().default(false),
  source: z.enum(["MANUAL", "BARCODE", "APPLE_HEALTH"]).default("MANUAL")
});

mealsRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  const meals = await prisma.mealEntry.findMany({
    where: { userId },
    orderBy: { loggedAt: "desc" },
    take: 50
  });
  res.json({ data: meals });
});

mealsRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const input = mealInput.parse(req.body);

  const meal = await prisma.mealEntry.create({
    data: {
      userId,
      loggedAt: asDate(input.loggedAt),
      name: input.name,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      isPreWorkout: input.isPreWorkout,
      source: input.source
    }
  });

  res.status(201).json({ data: meal });
});
