import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { buildInsight } from "../services/insight-engine.js";
import { getUserId } from "./helpers.js";

export const coachRouter = Router();

coachRouter.post("/insight", async (req, res) => {
  const userId = getUserId(req);

  const [workouts, meals, recovery, feedback] = await Promise.all([
    prisma.workoutSession.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
    prisma.mealEntry.findMany({ where: { userId }, orderBy: { loggedAt: "desc" }, take: 200 }),
    prisma.recoveryCheckIn.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 }),
    prisma.liftFeedback.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 })
  ]);

  const insight = buildInsight({ workouts, meals, recovery, feedback });

  const saved = await prisma.coachInsight.create({
    data: {
      userId,
      summary: insight.summary,
      drivers: insight.drivers,
      recommendation: insight.recommendation,
      confidence: insight.confidence,
      performanceDelta: insight.stats.performanceRaw,
      carbsDelta: insight.stats.carbsRaw,
      sleepDelta: insight.stats.sleepRaw,
      contextSnapshot: {
        workoutCount: workouts.length,
        mealCount: meals.length,
        recoveryCount: recovery.length,
        feedbackCount: feedback.length
      }
    }
  });

  res.status(201).json({ data: { ...insight, id: saved.id, createdAt: saved.createdAt } });
});

coachRouter.get("/insight/latest", async (req, res) => {
  const userId = getUserId(req);
  const latest = await prisma.coachInsight.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: latest });
});
