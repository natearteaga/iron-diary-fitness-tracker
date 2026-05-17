import type { LiftFeedback, MealEntry, RecoveryCheckIn, WorkoutSession } from "@prisma/client";

export type InsightResult = {
  summary: string;
  drivers: string[];
  recommendation: string;
  confidence: number;
  stats: {
    performance: string;
    carbs: string;
    sleep: string;
    performanceRaw: number;
    carbsRaw: number;
    sleepRaw: number;
  };
};

export function buildInsight(input: {
  workouts: WorkoutSession[];
  meals: MealEntry[];
  recovery: RecoveryCheckIn[];
  feedback: LiftFeedback[];
}): InsightResult {
  const week = splitByWeek(input.workouts, (entry) => entry.date);
  const currentPerf = performanceScore(week.current);
  const previousPerf = performanceScore(week.previous);
  const perfDelta = percentageChange(currentPerf, previousPerf);

  const currentDates = unique(week.current.map((entry) => entry.date.toISOString().slice(0, 10)));
  const previousDates = unique(week.previous.map((entry) => entry.date.toISOString().slice(0, 10)));

  const carbsDelta = avgPreLiftCarbs(input.meals, currentDates) - avgPreLiftCarbs(input.meals, previousDates);

  const recoveryWeek = splitByWeek(input.recovery, (entry) => entry.date);
  const sleepDelta = avg(recoveryWeek.current, "sleepHours") - avg(recoveryWeek.previous, "sleepHours");

  const priorDelta =
    avgPriorDayVolume(input.workouts, currentDates) - avgPriorDayVolume(input.workouts, previousDates);

  const feedbackWeek = splitByWeek(input.feedback, (entry) => entry.date);
  const feltDelta = avg(feedbackWeek.current, "feltStrength") - avg(feedbackWeek.previous, "feltStrength");

  const drivers: string[] = [];
  if (Math.abs(carbsDelta) >= 5) drivers.push(`Pre-lift carbs changed ${signed(carbsDelta)}g`);
  if (Math.abs(sleepDelta) >= 0.2) drivers.push(`Sleep shifted ${signed(sleepDelta)}h`);
  if (Math.abs(priorDelta) >= 40) drivers.push(`Prior-day load moved ${signed(-priorDelta)}`);
  if (Math.abs(feltDelta) >= 0.2) drivers.push(`Self-rated strength moved ${signed(feltDelta)}`);

  const confidence = insightConfidence({
    workoutCount: week.current.length + week.previous.length,
    recoveryCount: recoveryWeek.current.length + recoveryWeek.previous.length,
    mealCount: input.meals.length,
    driverCount: drivers.length
  });

  if (!Number.isFinite(perfDelta)) {
    return {
      summary: "Log at least two training weeks to unlock week-over-week explanations.",
      drivers: ["Need previous week workouts", "Add daily recovery check-ins", "Mark pre-workout meals"],
      recommendation: "Collect another week of data, then regenerate insight.",
      confidence,
      stats: {
        performance: "n/a",
        carbs: "n/a",
        sleep: "n/a",
        performanceRaw: Number.NaN,
        carbsRaw: Number.NaN,
        sleepRaw: Number.NaN
      }
    };
  }

  return {
    summary: `Performance ${signed(perfDelta)}% vs last week.`,
    drivers: drivers.length ? drivers.slice(0, 3).map((item) => `Likely driver: ${item}`) : ["No strong drivers detected yet."],
    recommendation: recommendationFor({ perfDelta, carbsDelta, sleepDelta, priorDelta, feltDelta }),
    confidence,
    stats: {
      performance: `${signed(perfDelta)}%`,
      carbs: `${signed(carbsDelta)}g`,
      sleep: `${signed(sleepDelta)}h`,
      performanceRaw: perfDelta,
      carbsRaw: carbsDelta,
      sleepRaw: sleepDelta
    }
  };
}

function recommendationFor(input: {
  perfDelta: number;
  carbsDelta: number;
  sleepDelta: number;
  priorDelta: number;
  feltDelta: number;
}): string {
  if (input.perfDelta > 0 && input.carbsDelta > 0 && input.sleepDelta > 0) {
    return "Keep pre-lift fueling and sleep strategy. Add one controlled back-off set next week.";
  }
  if (input.perfDelta < 0 && input.sleepDelta < 0) {
    return "Recovery appears to be the bottleneck. Reduce accessory volume 10-15% this week.";
  }
  if (input.perfDelta < 0 && input.priorDelta > 0) {
    return "Fatigue may be elevated from prior-day load. Separate heavy and high-volume days.";
  }
  if (input.feltDelta < 0) {
    return "Subjective readiness dropped. Extend warm-up and cap top sets at RPE 8 for one week.";
  }
  return "Trend is stable. Keep logging consistently to raise confidence.";
}

function splitByWeek<T>(entries: T[], getDate: (entry: T) => Date) {
  const currentStart = weekStart(new Date());
  const previousStart = shiftDays(currentStart, -7);
  const currentEnd = shiftDays(currentStart, 7);

  return entries.reduce(
    (acc, entry) => {
      const date = getDate(entry);
      if (date >= currentStart && date < currentEnd) acc.current.push(entry);
      if (date >= previousStart && date < currentStart) acc.previous.push(entry);
      return acc;
    },
    { current: [] as T[], previous: [] as T[] }
  );
}

function weekStart(reference: Date): Date {
  const date = new Date(reference);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sum<T>(entries: T[], getValue: (entry: T) => number): number {
  return entries.reduce((total, entry) => total + getValue(entry), 0);
}

function avg<T extends Record<string, unknown>>(entries: T[], key: keyof T): number {
  if (!entries.length) return 0;
  return sum(entries, (entry) => Number(entry[key] ?? 0)) / entries.length;
}

function performanceScore(workouts: WorkoutSession[]): number {
  if (!workouts.length) return 0;
  return workouts.reduce((total, session) => {
    const e1rm = session.weight * (1 + session.reps / 30);
    return total + e1rm * session.sets * (session.rpe / 10);
  }, 0);
}

function avgPreLiftCarbs(meals: MealEntry[], workoutDates: string[]): number {
  if (!workoutDates.length) return 0;
  const matchingMeals = meals.filter((meal) => {
    const day = meal.loggedAt.toISOString().slice(0, 10);
    return meal.isPreWorkout && workoutDates.includes(day);
  });
  return avg(matchingMeals, "carbs");
}

function avgPriorDayVolume(workouts: WorkoutSession[], workoutDates: string[]): number {
  if (!workoutDates.length) return 0;

  let total = 0;
  let count = 0;

  workoutDates.forEach((dateText) => {
    const base = new Date(`${dateText}T12:00:00`);
    base.setDate(base.getDate() - 1);
    const previousDay = base.toISOString().slice(0, 10);
    const priorDaySessions = workouts.filter((session) => session.date.toISOString().slice(0, 10) === previousDay);

    if (priorDaySessions.length) {
      total += sum(priorDaySessions, (session) => session.sets * session.reps * session.weight);
      count += 1;
    }
  });

  return count ? total / count : 0;
}

function percentageChange(current: number, previous: number): number {
  if (!previous) return Number.NaN;
  return ((current - previous) / previous) * 100;
}

function signed(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function insightConfidence(input: {
  workoutCount: number;
  recoveryCount: number;
  mealCount: number;
  driverCount: number;
}): number {
  const workoutFactor = Math.min(input.workoutCount / 8, 1) * 0.4;
  const recoveryFactor = Math.min(input.recoveryCount / 8, 1) * 0.3;
  const mealFactor = Math.min(input.mealCount / 20, 1) * 0.2;
  const driverFactor = Math.min(input.driverCount / 3, 1) * 0.1;
  return Math.min(workoutFactor + recoveryFactor + mealFactor + driverFactor, 1);
}
