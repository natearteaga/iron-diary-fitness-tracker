const STORAGE_KEY = "iron-diary-v1";
const CALORIE_TARGET = 2800;
const PROTEIN_TARGET = 180;

const state = loadState();
const ids = {
  mealList: document.getElementById("meal-list"),
  workoutList: document.getElementById("workout-list"),
  recoveryList: document.getElementById("recovery-list"),
  feedbackList: document.getElementById("feedback-list"),
  todayCalories: document.getElementById("today-calories"),
  todayCaloriesNote: document.getElementById("today-calories-note"),
  todayProtein: document.getElementById("today-protein"),
  todayProteinNote: document.getElementById("today-protein-note"),
  weeklyVolume: document.getElementById("weekly-volume"),
  weeklyVolumeNote: document.getElementById("weekly-volume-note"),
  readinessScore: document.getElementById("readiness-score"),
  readinessNote: document.getElementById("readiness-note"),
  coachConfidence: document.getElementById("coach-confidence"),
  coachConfidenceNote: document.getElementById("coach-confidence-note"),
  summary: document.getElementById("insight-summary"),
  drivers: document.getElementById("insight-drivers"),
  recommendation: document.getElementById("insight-recommendation"),
  insightPerformance: document.getElementById("insight-performance"),
  insightCarb: document.getElementById("insight-carb"),
  insightSleep: document.getElementById("insight-sleep"),
};

bindNavigation();
bindActions();
bindForms();
setFormDefaults();
setActiveScreen(state.activeScreen || "home");
render();

function bindNavigation() {
  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => setActiveScreen(button.dataset.screen));
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => setActiveScreen(button.dataset.go));
  });
}

function bindActions() {
  document.getElementById("generate-insight").addEventListener("click", () => {
    state.lastInsight = buildInsight(state);
    persistAndRender();
  });

  document.getElementById("load-demo").addEventListener("click", () => {
    const demo = buildDemoState();
    state.meals = demo.meals;
    state.workouts = demo.workouts;
    state.recovery = demo.recovery;
    state.feedback = demo.feedback;
    state.lastInsight = buildInsight(state);
    persistAndRender();
  });

  document.getElementById("reset-data").addEventListener("click", () => {
    if (!window.confirm("Reset all Iron Diary entries? This clears local data.")) return;
    state.meals = [];
    state.workouts = [];
    state.recovery = [];
    state.feedback = [];
    state.lastInsight = null;
    persistAndRender();
    setFormDefaults();
    setActiveScreen("home");
  });
}

function bindForms() {
  document.getElementById("meal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    state.meals.push({
      loggedAt: data.loggedAt,
      name: data.name.trim(),
      calories: Number(data.calories),
      protein: Number(data.protein),
      carbs: Number(data.carbs),
      fat: Number(data.fat),
      isPreWorkout: Boolean(data.isPreWorkout),
    });
    event.target.reset();
    setFormDefaults();
    persistAndRender();
  });

  document.getElementById("workout-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    state.workouts.push({
      date: data.date,
      exercise: data.exercise.trim(),
      sets: Number(data.sets),
      reps: Number(data.reps),
      weight: Number(data.weight),
      rpe: Number(data.rpe),
    });
    event.target.reset();
    setFormDefaults();
    persistAndRender();
  });

  document.getElementById("recovery-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    state.recovery.push({
      date: data.date,
      sleepHours: Number(data.sleepHours),
      energy: Number(data.energy),
      soreness: Number(data.soreness),
      stress: Number(data.stress),
    });
    event.target.reset();
    setFormDefaults();
    persistAndRender();
  });

  document.getElementById("feedback-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    state.feedback.push({
      date: data.date,
      exercise: data.exercise.trim(),
      feltStrength: Number(data.feltStrength),
      jointPain: Number(data.jointPain),
      notes: (data.notes || "").trim(),
    });
    event.target.reset();
    setFormDefaults();
    persistAndRender();
  });
}

function setFormDefaults() {
  const now = new Date();
  const today = toYmd(now);
  const dt = `${today}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.querySelector('#meal-form input[name="loggedAt"]').value = dt;
  document.querySelector('#workout-form input[name="date"]').value = today;
  document.querySelector('#recovery-form input[name="date"]').value = today;
  document.querySelector('#feedback-form input[name="date"]').value = today;
}

function setActiveScreen(screen) {
  const target = document.getElementById(`screen-${screen}`);
  if (!target) return;
  state.activeScreen = screen;
  persistStateOnly();

  document.querySelectorAll(".screen").forEach((section) => {
    section.classList.toggle("active", section.id === `screen-${screen}`);
  });

  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screen);
  });
}

function render() {
  renderLists();
  renderMetrics();
  renderInsight();
}

function renderLists() {
  ids.mealList.innerHTML = renderList(state.meals.slice(-6).reverse(), (item) => {
    const name = escapeHtml(item.name);
    const pre = item.isPreWorkout ? " • pre-lift" : "";
    return `${formatDateTime(item.loggedAt)} • ${name} • ${item.calories} kcal • P${item.protein}/C${item.carbs}/F${item.fat}${pre}`;
  });

  ids.workoutList.innerHTML = renderList(state.workouts.slice(-6).reverse(), (item) => {
    return `${item.date} • ${escapeHtml(item.exercise)} • ${item.sets}x${item.reps} @ ${item.weight} • RPE ${item.rpe}`;
  });

  ids.recoveryList.innerHTML = renderList(state.recovery.slice(-6).reverse(), (item) => {
    return `${item.date} • sleep ${item.sleepHours}h • energy ${item.energy}/10 • soreness ${item.soreness}/10 • stress ${item.stress}/10`;
  });

  ids.feedbackList.innerHTML = renderList(state.feedback.slice(-6).reverse(), (item) => {
    const notes = item.notes ? ` • ${escapeHtml(item.notes)}` : "";
    return `${item.date} • ${escapeHtml(item.exercise)} • strength ${signed(item.feltStrength)} • pain ${item.jointPain}/10${notes}`;
  });
}

function renderMetrics() {
  const today = toYmd(new Date());
  const todaysMeals = state.meals.filter((entry) => entry.loggedAt.startsWith(today));
  const weekly = splitByWeek(state.workouts, "date");
  const currVolume = sumVolume(weekly.current);
  const prevVolume = sumVolume(weekly.previous);
  const volumeDelta = percentageChange(currVolume, prevVolume);
  const confidence = state.lastInsight?.confidence || buildInsight(state).confidence;

  const calorieToday = sum(todaysMeals, "calories");
  const proteinToday = sum(todaysMeals, "protein");
  const readiness = readinessScore(latestByDate(state.recovery, "date"));

  ids.todayCalories.textContent = calorieToday.toFixed(0);
  ids.todayCaloriesNote.textContent = `${Math.round((calorieToday / CALORIE_TARGET) * 100) || 0}% of ${CALORIE_TARGET}`;
  ids.todayProtein.textContent = `${proteinToday.toFixed(0)} g`;
  ids.todayProteinNote.textContent = `${Math.round((proteinToday / PROTEIN_TARGET) * 100) || 0}% of ${PROTEIN_TARGET}g`;
  ids.weeklyVolume.textContent = currVolume.toFixed(0);
  ids.weeklyVolumeNote.textContent = Number.isFinite(volumeDelta) ? `${signed(volumeDelta)}% vs last week` : "Need prior week";
  ids.readinessScore.textContent = readiness.score.toFixed(0);
  ids.readinessNote.textContent = readiness.note;
  ids.coachConfidence.textContent = `${Math.round(confidence * 100)}%`;
  ids.coachConfidenceNote.textContent = confidence > 0.7 ? "High data depth" : confidence > 0.4 ? "Moderate data depth" : "Low data depth";

  toneText(ids.weeklyVolumeNote, volumeDelta);
  toneText(ids.readinessScore, readiness.score - 65);
}

function renderInsight() {
  const insight = state.lastInsight || buildInsight(state);
  ids.summary.textContent = insight.summary;
  ids.drivers.innerHTML = renderList(insight.drivers, (item) => escapeHtml(item));
  ids.recommendation.textContent = insight.recommendation;
  ids.insightPerformance.textContent = insight.stats.performance;
  ids.insightCarb.textContent = insight.stats.carbs;
  ids.insightSleep.textContent = insight.stats.sleep;
  toneText(ids.insightPerformance, insight.stats.performanceRaw);
  toneText(ids.insightCarb, insight.stats.carbsRaw);
  toneText(ids.insightSleep, insight.stats.sleepRaw);
}

function buildInsight(fullState) {
  const weeks = splitByWeek(fullState.workouts, "date");
  const currentPerformance = performanceScore(weeks.current);
  const previousPerformance = performanceScore(weeks.previous);
  const perfDelta = percentageChange(currentPerformance, previousPerformance);
  const currentDates = unique(weeks.current.map((entry) => entry.date));
  const previousDates = unique(weeks.previous.map((entry) => entry.date));

  const currentPreLiftCarbs = avgPreLiftCarbs(fullState.meals, currentDates);
  const previousPreLiftCarbs = avgPreLiftCarbs(fullState.meals, previousDates);
  const carbsDelta = currentPreLiftCarbs - previousPreLiftCarbs;

  const recoveryWeeks = splitByWeek(fullState.recovery, "date");
  const sleepDelta = avg(recoveryWeeks.current, "sleepHours") - avg(recoveryWeeks.previous, "sleepHours");

  const priorCurrent = avgPriorDayVolume(fullState.workouts, currentDates);
  const priorPrevious = avgPriorDayVolume(fullState.workouts, previousDates);
  const priorDayDelta = priorCurrent - priorPrevious;

  const feedbackWeeks = splitByWeek(fullState.feedback, "date");
  const feltDelta = avg(feedbackWeeks.current, "feltStrength") - avg(feedbackWeeks.previous, "feltStrength");

  const drivers = [];
  if (Math.abs(carbsDelta) >= 5) drivers.push(`Pre-lift carbs changed ${signed(carbsDelta)}g`);
  if (Math.abs(sleepDelta) >= 0.2) drivers.push(`Sleep shifted ${signed(sleepDelta)}h`);
  if (Math.abs(priorDayDelta) >= 40) drivers.push(`Prior-day load moved ${signed(-priorDayDelta)}`);
  if (Math.abs(feltDelta) >= 0.2) drivers.push(`Self-rated strength moved ${signed(feltDelta)}`);

  const confidence = insightConfidence({
    workoutCount: weeks.current.length + weeks.previous.length,
    recoveryCount: recoveryWeeks.current.length + recoveryWeeks.previous.length,
    mealCount: fullState.meals.length,
    driverCount: drivers.length,
  });

  if (!Number.isFinite(perfDelta)) {
    return {
      summary: "Log at least two training weeks to unlock week-over-week explanations.",
      drivers: [
        "Need previous week workouts",
        "Add daily recovery check-ins",
        "Mark pre-workout meals",
      ],
      recommendation: "Use Load Demo or log 3+ sessions this week and next week.",
      confidence,
      stats: {
        performance: "n/a",
        carbs: "n/a",
        sleep: "n/a",
        performanceRaw: Number.NaN,
        carbsRaw: Number.NaN,
        sleepRaw: Number.NaN,
      },
    };
  }

  return {
    summary: `Performance ${signed(perfDelta)}% vs last week.`,
    drivers: drivers.length ? drivers.slice(0, 3).map((item) => `Likely driver: ${item}`) : ["No strong drivers detected yet."],
    recommendation: recommendationFor({
      perfDelta,
      carbsDelta,
      sleepDelta,
      priorDayDelta,
      feltDelta,
    }),
    confidence,
    stats: {
      performance: `${signed(perfDelta)}%`,
      carbs: `${signed(carbsDelta)}g`,
      sleep: `${signed(sleepDelta)}h`,
      performanceRaw: perfDelta,
      carbsRaw: carbsDelta,
      sleepRaw: sleepDelta,
    },
  };
}

function recommendationFor({ perfDelta, carbsDelta, sleepDelta, priorDayDelta, feltDelta }) {
  if (perfDelta > 0 && carbsDelta > 0 && sleepDelta > 0) {
    return "Keep the same pre-lift fueling and sleep pattern. Add one controlled back-off set next week.";
  }
  if (perfDelta < 0 && sleepDelta < 0) {
    return "Recovery is likely the bottleneck. Keep intensity but reduce accessory volume 10-15% for one week.";
  }
  if (perfDelta < 0 && priorDayDelta > 0) {
    return "Fatigue looks elevated from prior-day load. Separate heavy sessions from high-volume work by 24 hours.";
  }
  if (feltDelta < 0) {
    return "Readiness dropped. Extend warm-up and cap top sets at RPE 8 this week.";
  }
  return "Current trend is stable. Keep logging consistently to increase confidence.";
}

function buildDemoState() {
  const workouts = [];
  const meals = [];
  const recovery = [];
  const feedback = [];
  const currentStart = weekStart(new Date());
  const previousStart = shiftDays(currentStart, -7);

  const sessions = [
    { day: 0, exercise: "Back Squat", sets: 4, reps: 5, prevWeight: 225, currWeight: 235, rpe: 8.5 },
    { day: 2, exercise: "Bench Press", sets: 4, reps: 6, prevWeight: 165, currWeight: 172.5, rpe: 8 },
    { day: 4, exercise: "Deadlift", sets: 3, reps: 4, prevWeight: 275, currWeight: 290, rpe: 8.5 },
  ];

  [previousStart, currentStart].forEach((weekStartDate, index) => {
    for (let i = 0; i < 7; i += 1) {
      const date = toYmd(shiftDays(weekStartDate, i));
      recovery.push({
        date,
        sleepHours: index === 0 ? 6.9 + (i % 2) * 0.2 : 7.7 + (i % 2) * 0.2,
        energy: index === 0 ? 6 : 7,
        soreness: index === 0 ? 6 : 4,
        stress: index === 0 ? 6 : 5,
      });

      meals.push({
        loggedAt: `${date}T08:00`,
        name: "Egg scramble + oats",
        calories: 620,
        protein: 42,
        carbs: 58,
        fat: 18,
        isPreWorkout: false,
      });
    }

    sessions.forEach((session) => {
      const date = toYmd(shiftDays(weekStartDate, session.day));
      workouts.push({
        date,
        exercise: session.exercise,
        sets: session.sets,
        reps: session.reps,
        weight: index === 0 ? session.prevWeight : session.currWeight,
        rpe: session.rpe,
      });

      meals.push({
        loggedAt: `${date}T15:00`,
        name: index === 0 ? "Yogurt + banana" : "Rice + whey",
        calories: index === 0 ? 380 : 520,
        protein: index === 0 ? 26 : 35,
        carbs: index === 0 ? 58 : 96,
        fat: index === 0 ? 8 : 6,
        isPreWorkout: true,
      });

      feedback.push({
        date,
        exercise: session.exercise,
        feltStrength: index === 0 ? 0 : 1,
        jointPain: index === 0 ? 3 : 2,
        notes: index === 0 ? "A little slow on reps." : "Speed and positioning felt strong.",
      });
    });
  });

  return { workouts, meals, recovery, feedback };
}

function renderList(items, formatFn) {
  if (!items.length) return "<li>No entries yet.</li>";
  return items.map((item) => `<li>${formatFn(item)}</li>`).join("");
}

function persistAndRender() {
  persistStateOnly();
  render();
}

function persistStateOnly() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && typeof raw === "object") {
      return {
        meals: raw.meals || [],
        workouts: raw.workouts || [],
        recovery: raw.recovery || [],
        feedback: raw.feedback || [],
        lastInsight: raw.lastInsight || null,
        activeScreen: raw.activeScreen || "home",
      };
    }
  } catch {
    return emptyState();
  }
  return emptyState();
}

function emptyState() {
  return {
    meals: [],
    workouts: [],
    recovery: [],
    feedback: [],
    lastInsight: null,
    activeScreen: "home",
  };
}

function splitByWeek(entries, dateField) {
  const currentStart = weekStart(new Date());
  const currentEnd = shiftDays(currentStart, 7);
  const previousStart = shiftDays(currentStart, -7);

  return entries.reduce(
    (acc, entry) => {
      const date = parseDate(entry[dateField]);
      if (date >= currentStart && date < currentEnd) acc.current.push(entry);
      else if (date >= previousStart && date < currentStart) acc.previous.push(entry);
      return acc;
    },
    { current: [], previous: [] },
  );
}

function weekStart(referenceDate) {
  const date = new Date(referenceDate);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function shiftDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseDate(value) {
  if (typeof value !== "string") return new Date(value);
  if (value.length === 10) return new Date(`${value}T12:00:00`);
  return new Date(value);
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function sum(list, key) {
  return list.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function avg(list, key) {
  if (!list.length) return 0;
  return sum(list, key) / list.length;
}

function sumVolume(workouts) {
  return workouts.reduce((total, entry) => total + entry.sets * entry.reps * entry.weight, 0);
}

function performanceScore(workouts) {
  if (!workouts.length) return 0;
  return workouts.reduce((total, entry) => {
    const e1rm = entry.weight * (1 + entry.reps / 30);
    return total + e1rm * entry.sets * (entry.rpe / 10);
  }, 0);
}

function avgPreLiftCarbs(meals, workoutDates) {
  if (!workoutDates.length) return 0;
  const match = meals.filter((meal) => meal.isPreWorkout && workoutDates.includes(meal.loggedAt.slice(0, 10)));
  return avg(match, "carbs");
}

function avgPriorDayVolume(workouts, workoutDates) {
  if (!workoutDates.length) return 0;
  let total = 0;
  let count = 0;
  workoutDates.forEach((dateText) => {
    const prior = toYmd(shiftDays(parseDate(dateText), -1));
    const priorSessions = workouts.filter((entry) => entry.date === prior);
    if (priorSessions.length) {
      total += sumVolume(priorSessions);
      count += 1;
    }
  });
  return count ? total / count : 0;
}

function percentageChange(current, previous) {
  if (!previous) return Number.NaN;
  return ((current - previous) / previous) * 100;
}

function readinessScore(entry) {
  if (!entry) return { score: 0, note: "Needs recent check-in" };
  const sleep = clamp(entry.sleepHours / 8, 0, 1);
  const energy = clamp(entry.energy / 10, 0, 1);
  const soreness = clamp(1 - entry.soreness / 10, 0, 1);
  const stress = clamp(1 - entry.stress / 10, 0, 1);
  const score = (sleep * 0.35 + energy * 0.35 + soreness * 0.15 + stress * 0.15) * 100;
  const note = score >= 75 ? "Good readiness" : score >= 60 ? "Moderate readiness" : "Low readiness";
  return { score, note };
}

function latestByDate(items, dateField) {
  if (!items.length) return null;
  return items.reduce((latest, item) => {
    if (!latest) return item;
    return parseDate(item[dateField]) > parseDate(latest[dateField]) ? item : latest;
  }, null);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function signed(value) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
}

function unique(values) {
  return [...new Set(values)];
}

function insightConfidence({ workoutCount, recoveryCount, mealCount, driverCount }) {
  const workoutFactor = Math.min(workoutCount / 8, 1) * 0.4;
  const recoveryFactor = Math.min(recoveryCount / 8, 1) * 0.3;
  const mealFactor = Math.min(mealCount / 20, 1) * 0.2;
  const driverFactor = Math.min(driverCount / 3, 1) * 0.1;
  return Math.min(workoutFactor + recoveryFactor + mealFactor + driverFactor, 1);
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${toYmd(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toneText(element, value) {
  element.classList.remove("is-positive", "is-negative");
  if (!Number.isFinite(value)) return;
  if (value > 0) element.classList.add("is-positive");
  if (value < 0) element.classList.add("is-negative");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
