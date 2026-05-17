import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

type Tab = "home" | "meals" | "lifts" | "recovery" | "coach";

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "preworkout";

type MealEntry = {
  id: string;
  loggedAt: string;
  slot: MealSlot;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type LiftSet = {
  id: string;
  weight: number;
  reps: number;
  rpe: number;
  done: boolean;
};

type ExerciseBlock = {
  id: string;
  name: string;
  sets: LiftSet[];
};

type WorkoutSession = {
  id: string;
  date: string;
  name: string;
  exercises: ExerciseBlock[];
};

type RecoveryEntry = {
  id: string;
  date: string;
  sleepHours: number;
  energy: number;
  soreness: number;
  stress: number;
};

type FeedbackEntry = {
  id: string;
  date: string;
  exercise: string;
  feltStrength: number;
  jointPain: number;
  notes: string;
};

type Insight = {
  id: string;
  createdAt: string;
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

type Focus = {
  title: string;
  subtitle: string;
};

type MealDraft = {
  loggedAt: string;
  slot: MealSlot;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

type SessionDraft = {
  date: string;
  name: string;
};

type RecoveryDraft = {
  date: string;
  sleepHours: string;
  energy: string;
  soreness: string;
  stress: string;
};

type FeedbackDraft = {
  date: string;
  exercise: string;
  feltStrength: string;
  jointPain: string;
  notes: string;
};

const GOALS = {
  calories: 2800,
  protein: 190,
  carbs: 320,
  fat: 85
};

const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack", "preworkout"];

const FOOD_CATALOG: Array<Omit<MealEntry, "id" | "loggedAt">> = [
  { slot: "breakfast", name: "Greek Yogurt Bowl", calories: 320, protein: 30, carbs: 32, fat: 8 },
  { slot: "lunch", name: "Chicken Rice Bowl", calories: 640, protein: 48, carbs: 68, fat: 17 },
  { slot: "dinner", name: "Salmon + Potatoes", calories: 700, protein: 46, carbs: 60, fat: 28 },
  { slot: "preworkout", name: "Banana + Whey", calories: 280, protein: 27, carbs: 34, fat: 3 },
  { slot: "breakfast", name: "Overnight Oats", calories: 420, protein: 24, carbs: 55, fat: 12 },
  { slot: "lunch", name: "Turkey Wrap", calories: 520, protein: 41, carbs: 44, fat: 18 }
];

const tabOrder: Tab[] = ["home", "meals", "lifts", "recovery", "coach"];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [recovery, setRecovery] = useState<RecoveryEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [coachHistory, setCoachHistory] = useState<Insight[]>([]);
  const [lastInsight, setLastInsight] = useState<Insight | null>(null);
  const [focus, setFocus] = useState<Focus>({
    title: "Keep pre-lift fuel consistent",
    subtitle: "Coach updates after each insight refresh."
  });

  const [mealDraft, setMealDraft] = useState<MealDraft>(() => ({
    loggedAt: localDateTimeValue(new Date()),
    slot: "lunch",
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  }));

  const [sessionDraft, setSessionDraft] = useState<SessionDraft>(() => ({
    date: todayYmd(),
    name: ""
  }));

  const [exerciseDraft, setExerciseDraft] = useState("");

  const [recoveryDraft, setRecoveryDraft] = useState<RecoveryDraft>(() => ({
    date: todayYmd(),
    sleepHours: "",
    energy: "",
    soreness: "",
    stress: ""
  }));

  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft>(() => ({
    date: todayYmd(),
    exercise: "",
    feltStrength: "",
    jointPain: "",
    notes: ""
  }));

  const today = todayYmd();

  const todayMeals = useMemo(
    () => meals.filter((entry) => entry.loggedAt.slice(0, 10) === today).sort((a, b) => asDate(a.loggedAt).getTime() - asDate(b.loggedAt).getTime()),
    [meals, today]
  );

  const mealTotals = useMemo(() => macroTotals(todayMeals), [todayMeals]);

  const insight = useMemo(() => lastInsight || buildInsight({ meals, sessions, recovery, feedback }), [lastInsight, meals, sessions, recovery, feedback]);

  const weekSplit = useMemo(() => splitByWeek(sessions, (entry) => asDate(entry.date)), [sessions]);
  const currentVolume = useMemo(() => sumVolume(weekSplit.current), [weekSplit]);
  const previousVolume = useMemo(() => sumVolume(weekSplit.previous), [weekSplit]);
  const volumeDelta = percentageChange(currentVolume, previousVolume);
  const readiness = calculateReadiness(latestByDate(recovery, (entry) => entry.date));
  const streak = trainingStreak(sessions);

  const timeline = useMemo(() => {
    const mealItems = todayMeals.map((meal) => ({
      time: formatTime(meal.loggedAt),
      title: meal.name,
      meta: `${Math.round(meal.calories)} kcal`
    }));

    const sessionItems = sessions
      .filter((session) => session.date === today)
      .map((session) => ({ time: "18:00", title: `Workout • ${session.name}`, meta: `${session.exercises.length} exercises` }));

    return [...mealItems, ...sessionItems].sort((a, b) => a.time.localeCompare(b.time));
  }, [todayMeals, sessions, today]);

  const previousExerciseMap = useMemo(() => buildPreviousExerciseMap(sessions), [sessions]);

  const recentSessions = useMemo(
    () => sessions.slice().sort((a, b) => asDate(b.date).getTime() - asDate(a.date).getTime()).slice(0, 8),
    [sessions]
  );

  const recentRecovery = useMemo(
    () => recovery.slice().sort((a, b) => asDate(b.date).getTime() - asDate(a.date).getTime()).slice(0, 8),
    [recovery]
  );

  const recentFeedback = useMemo(
    () => feedback.slice().sort((a, b) => asDate(b.date).getTime() - asDate(a.date).getTime()).slice(0, 8),
    [feedback]
  );

  const insightHistory = useMemo(
    () => coachHistory.slice().sort((a, b) => asDate(b.createdAt).getTime() - asDate(a.createdAt).getTime()).slice(0, 8),
    [coachHistory]
  );

  const calorieProgress = clamp((mealTotals.calories / GOALS.calories) * 100, 0, 140);
  const caloriesRemaining = Math.round(GOALS.calories - mealTotals.calories);

  function handleLoadDemo() {
    const demo = buildDemoState();
    setMeals(demo.meals);
    setSessions(demo.sessions);
    setRecovery(demo.recovery);
    setFeedback(demo.feedback);
    setActiveSession(null);
    const seeded = buildInsight(demo);
    setLastInsight(seeded);
    setCoachHistory([seeded]);
    applyFocus(seeded);
    setActiveTab("home");
  }

  function handleReset() {
    setMeals([]);
    setSessions([]);
    setRecovery([]);
    setFeedback([]);
    setActiveSession(null);
    setLastInsight(null);
    setCoachHistory([]);
    setFocus({
      title: "Keep pre-lift fuel consistent",
      subtitle: "Coach updates after each insight refresh."
    });
    setMealDraft({ loggedAt: localDateTimeValue(new Date()), slot: "lunch", name: "", calories: "", protein: "", carbs: "", fat: "" });
    setSessionDraft({ date: todayYmd(), name: "" });
    setRecoveryDraft({ date: todayYmd(), sleepHours: "", energy: "", soreness: "", stress: "" });
    setFeedbackDraft({ date: todayYmd(), exercise: "", feltStrength: "", jointPain: "", notes: "" });
    setActiveTab("home");
  }

  function handleAddMeal() {
    if (!mealDraft.name.trim()) return;

    setMeals((current) => [
      ...current,
      {
        id: uid(),
        loggedAt: mealDraft.loggedAt,
        slot: mealDraft.slot,
        name: mealDraft.name.trim(),
        calories: num(mealDraft.calories),
        protein: num(mealDraft.protein),
        carbs: num(mealDraft.carbs),
        fat: num(mealDraft.fat)
      }
    ]);

    setMealDraft((draft) => ({ ...draft, loggedAt: localDateTimeValue(new Date()), name: "", calories: "", protein: "", carbs: "", fat: "" }));
  }

  function handleQuickFood(food: Omit<MealEntry, "id" | "loggedAt">) {
    setMeals((current) => [
      ...current,
      { ...food, id: uid(), loggedAt: localDateTimeValue(new Date()) }
    ]);
  }

  function handleStartOrUpdateSession() {
    if (!sessionDraft.name.trim()) return;

    setActiveSession((current) => {
      if (!current) {
        return {
          id: uid(),
          date: sessionDraft.date,
          name: sessionDraft.name.trim(),
          exercises: []
        };
      }

      return {
        ...current,
        date: sessionDraft.date,
        name: sessionDraft.name.trim()
      };
    });
  }

  function handleAddExercise() {
    const exerciseName = exerciseDraft.trim();
    if (!exerciseName) return;

    setActiveSession((current) => {
      const session = current || { id: uid(), date: todayYmd(), name: "Untitled Session", exercises: [] as ExerciseBlock[] };
      return {
        ...session,
        exercises: [...session.exercises, { id: uid(), name: exerciseName, sets: [createSet()] }]
      };
    });

    setExerciseDraft("");
  }

  function handleUpdateSet(exerciseId: string, setId: string, field: keyof LiftSet, value: string | boolean) {
    setActiveSession((current) => {
      if (!current) return current;

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise;

          return {
            ...exercise,
            sets: exercise.sets.map((set) => {
              if (set.id !== setId) return set;

              if (field === "done") {
                return { ...set, done: Boolean(value) };
              }

              const numeric = typeof value === "string" ? num(value) : 0;
              return { ...set, [field]: numeric };
            })
          };
        })
      };
    });
  }

  function handleAddSet(exerciseId: string) {
    setActiveSession((current) => {
      if (!current) return current;

      return {
        ...current,
        exercises: current.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise;
          const previous = exercise.sets[exercise.sets.length - 1];
          return {
            ...exercise,
            sets: [...exercise.sets, createSet(previous)]
          };
        })
      };
    });
  }

  function handleRemoveExercise(exerciseId: string) {
    setActiveSession((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId)
      };
    });
  }

  function handleFinishSession() {
    if (!activeSession || !activeSession.exercises.length) return;

    setSessions((current) => {
      const next = [...current, structuredClone(activeSession)];
      next.sort((a, b) => asDate(a.date).getTime() - asDate(b.date).getTime());
      return next;
    });

    setActiveSession(null);
    setSessionDraft({ date: todayYmd(), name: "" });

    const insightResult = buildInsight({ meals, sessions: [...sessions, activeSession], recovery, feedback });
    setLastInsight(insightResult);
    setCoachHistory((current) => [...current, insightResult].slice(-20));
    applyFocus(insightResult);
  }

  function handleSaveRecovery() {
    setRecovery((current) => [
      ...current,
      {
        id: uid(),
        date: recoveryDraft.date,
        sleepHours: num(recoveryDraft.sleepHours),
        energy: num(recoveryDraft.energy),
        soreness: num(recoveryDraft.soreness),
        stress: num(recoveryDraft.stress)
      }
    ]);

    setRecoveryDraft({ date: todayYmd(), sleepHours: "", energy: "", soreness: "", stress: "" });
  }

  function handleSaveFeedback() {
    if (!feedbackDraft.exercise.trim()) return;

    setFeedback((current) => [
      ...current,
      {
        id: uid(),
        date: feedbackDraft.date,
        exercise: feedbackDraft.exercise.trim(),
        feltStrength: num(feedbackDraft.feltStrength),
        jointPain: num(feedbackDraft.jointPain),
        notes: feedbackDraft.notes.trim()
      }
    ]);

    setFeedbackDraft({ date: todayYmd(), exercise: "", feltStrength: "", jointPain: "", notes: "" });
  }

  function handleGenerateInsight() {
    const nextInsight = buildInsight({ meals, sessions, recovery, feedback });
    setLastInsight(nextInsight);
    setCoachHistory((current) => [...current, nextInsight].slice(-20));
    applyFocus(nextInsight);
  }

  function applyFocus(nextInsight: Insight) {
    if (nextInsight.confidence < 0.45) {
      setFocus({
        title: "Increase logging consistency",
        subtitle: "Add meals, sessions, and recovery logs for sharper recommendations."
      });
      return;
    }

    setFocus({
      title: firstSentence(nextInsight.recommendation),
      subtitle: `Confidence ${Math.round(nextInsight.confidence * 100)}% • refreshed ${formatDateTime(nextInsight.createdAt)}`
    });
  }

  function renderHome() {
    return (
      <View style={styles.screenContainer}>
        <View style={[styles.card, styles.homeCard]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.overline}>Calories Remaining</Text>
              <Text style={styles.bigNumber}>{caloriesRemaining}</Text>
              <Text style={styles.muted}>{Math.round(mealTotals.calories)} consumed of {GOALS.calories}</Text>
            </View>
            <View style={styles.ringWrap}>
              <View style={styles.ringTrack}>
                <View style={[styles.ringFill, { height: `${Math.min(calorieProgress, 100)}%` }]} />
              </View>
              <Text style={styles.ringLabel}>{Math.round(calorieProgress)}%</Text>
            </View>
          </View>

          <MacroBar label="Protein" value={mealTotals.protein} goal={GOALS.protein} />
          <MacroBar label="Carbs" value={mealTotals.carbs} goal={GOALS.carbs} />
          <MacroBar label="Fat" value={mealTotals.fat} goal={GOALS.fat} />
        </View>

        <View style={[styles.card, styles.homeCard]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <QuickAction label="Add Meal" onPress={() => setActiveTab("meals")} />
            <QuickAction label="Start Lift" onPress={() => setActiveTab("lifts")} />
            <QuickAction label="Recovery" onPress={() => setActiveTab("recovery")} />
            <QuickAction label="Coach" onPress={() => setActiveTab("coach")} />
          </View>
          <View style={styles.metricGrid}>
            <MetricBlock
              label="Weekly Volume"
              value={Math.round(currentVolume).toString()}
              note={Number.isFinite(volumeDelta) ? `${signed(volumeDelta)}% vs last week` : "Need baseline"}
              tone={valueTone(volumeDelta)}
            />
            <MetricBlock
              label="Readiness"
              value={Math.round(readiness.score).toString()}
              note={readiness.note}
              tone={valueTone(readiness.score - 65)}
            />
            <MetricBlock
              label="Streak"
              value={`${streak}d`}
              note={streak ? "Consistency building" : "Start session"}
            />
          </View>
        </View>

        <View style={[styles.card, styles.homeCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Today Timeline</Text>
            <Text style={styles.muted}>{timeline.length} entries</Text>
          </View>
          {timeline.length ? timeline.map((entry, index) => (
            <ListItem key={`${entry.time}-${index}`} text={`${entry.time} • ${entry.title} • ${entry.meta}`} />
          )) : <ListItem text="No entries yet." />}
        </View>

        <View style={[styles.card, styles.homeCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Coach Snapshot</Text>
            <Text style={styles.muted}>{Math.round(insight.confidence * 100)}% confidence</Text>
          </View>
          <Text style={styles.bodyText}>{insight.summary}</Text>
          {insight.drivers.slice(0, 3).map((driver) => (
            <ListItem key={driver} text={driver} compact />
          ))}
        </View>
      </View>
    );
  }

  function renderMeals() {
    return (
      <View style={styles.screenContainer}>
        <View style={[styles.card, styles.panel]}>
          <Text style={styles.sectionTitle}>Nutrition Diary</Text>
          <Text style={styles.muted}>{Math.round(mealTotals.calories)} kcal • {todayMeals.length} foods today</Text>
          {MEAL_SLOTS.map((slot) => {
            const slotMeals = todayMeals.filter((entry) => entry.slot === slot);
            const slotTotal = macroTotals(slotMeals);
            return (
              <View key={slot} style={styles.slotCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.slotTitle}>{slotLabel(slot)}</Text>
                  <Text style={styles.slotMeta}>{Math.round(slotTotal.calories)} kcal</Text>
                </View>
                {slotMeals.length ? slotMeals.map((entry) => (
                  <ListItem
                    key={entry.id}
                    text={`${formatTime(entry.loggedAt)} • ${entry.name} • ${Math.round(entry.calories)} kcal • P${Math.round(entry.protein)}/C${Math.round(entry.carbs)}/F${Math.round(entry.fat)}`}
                    compact
                  />
                )) : <ListItem text="No foods logged." compact />}
              </View>
            );
          })}
        </View>

        <View style={[styles.card, styles.panel]}>
          <Text style={styles.sectionTitle}>Add Food</Text>
          <View style={styles.formRow}>
            <Field label="Time">
              <TextInput
                value={mealDraft.loggedAt}
                onChangeText={(value) => setMealDraft((draft) => ({ ...draft, loggedAt: value }))}
                placeholder="YYYY-MM-DDTHH:mm"
                placeholderTextColor="#7f8792"
                style={styles.input}
              />
            </Field>
            <Field label="Meal Slot">
              <View style={styles.slotChips}>
                {MEAL_SLOTS.map((slot) => (
                  <Pressable
                    key={slot}
                    style={[styles.slotChip, mealDraft.slot === slot && styles.slotChipActive]}
                    onPress={() => setMealDraft((draft) => ({ ...draft, slot }))}
                  >
                    <Text style={[styles.slotChipText, mealDraft.slot === slot && styles.slotChipTextActive]}>{slotLabel(slot)}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          </View>

          <Field label="Food Name">
            <TextInput
              value={mealDraft.name}
              onChangeText={(value) => setMealDraft((draft) => ({ ...draft, name: value }))}
              placeholder="Greek yogurt + berries"
              placeholderTextColor="#7f8792"
              style={styles.input}
            />
          </Field>

          <View style={styles.formGridTwo}>
            <Field label="Calories"><TextInput keyboardType="numeric" value={mealDraft.calories} onChangeText={(value) => setMealDraft((draft) => ({ ...draft, calories: value }))} style={styles.input} /></Field>
            <Field label="Protein"><TextInput keyboardType="numeric" value={mealDraft.protein} onChangeText={(value) => setMealDraft((draft) => ({ ...draft, protein: value }))} style={styles.input} /></Field>
            <Field label="Carbs"><TextInput keyboardType="numeric" value={mealDraft.carbs} onChangeText={(value) => setMealDraft((draft) => ({ ...draft, carbs: value }))} style={styles.input} /></Field>
            <Field label="Fat"><TextInput keyboardType="numeric" value={mealDraft.fat} onChangeText={(value) => setMealDraft((draft) => ({ ...draft, fat: value }))} style={styles.input} /></Field>
          </View>

          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleAddMeal}>
            <Text style={styles.buttonPrimaryText}>Add to Diary</Text>
          </Pressable>

          <Text style={styles.overline}>Quick Add</Text>
          <View style={styles.quickChipWrap}>
            {FOOD_CATALOG.map((food) => (
              <Pressable key={food.name} style={styles.quickChip} onPress={() => handleQuickFood(food)}>
                <Text style={styles.quickChipText}>{food.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }

  function renderLifts() {
    return (
      <View style={styles.screenContainer}>
        <View style={[styles.card, styles.panel]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Live Session</Text>
            <Text style={styles.muted}>{activeSession ? `${activeSession.name} • ${activeSession.exercises.length} exercises` : "No active workout"}</Text>
          </View>

          <View style={styles.formGridTwo}>
            <Field label="Date">
              <TextInput
                value={sessionDraft.date}
                onChangeText={(value) => setSessionDraft((draft) => ({ ...draft, date: value }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#7f8792"
                style={styles.input}
              />
            </Field>
            <Field label="Session Name">
              <TextInput
                value={sessionDraft.name}
                onChangeText={(value) => setSessionDraft((draft) => ({ ...draft, name: value }))}
                placeholder="Upper Strength A"
                placeholderTextColor="#7f8792"
                style={styles.input}
              />
            </Field>
          </View>

          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleStartOrUpdateSession}>
            <Text style={styles.buttonPrimaryText}>Start / Update Session</Text>
          </Pressable>

          <View style={styles.formRowAlignEnd}>
            <Field label="Add Exercise" style={styles.flexField}>
              <TextInput
                value={exerciseDraft}
                onChangeText={setExerciseDraft}
                placeholder="Barbell Bench Press"
                placeholderTextColor="#7f8792"
                style={styles.input}
              />
            </Field>
            <Pressable style={[styles.button, styles.buttonMuted]} onPress={handleAddExercise}>
              <Text style={styles.buttonMutedText}>Add</Text>
            </Pressable>
          </View>

          {activeSession?.exercises.length ? activeSession.exercises.map((exercise) => {
            const previousSets = previousExerciseMap.get(exercise.name) || [];
            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                  <Pressable onPress={() => handleRemoveExercise(exercise.id)}>
                    <Text style={styles.linkText}>Remove</Text>
                  </Pressable>
                </View>

                <View style={styles.setHeaderRow}>
                  <Text style={styles.setHead}>Set</Text>
                  <Text style={styles.setHead}>Prev</Text>
                  <Text style={styles.setHead}>Weight</Text>
                  <Text style={styles.setHead}>Reps</Text>
                  <Text style={styles.setHead}>RPE</Text>
                  <Text style={styles.setHead}>Done</Text>
                </View>

                {exercise.sets.map((set, index) => {
                  const previous = previousSets[index];
                  const previousText = previous ? `${Math.round(previous.weight)} x ${Math.round(previous.reps)}` : "-";
                  return (
                    <View style={styles.setRow} key={set.id}>
                      <Text style={styles.setCell}>{index + 1}</Text>
                      <Text style={styles.setCell}>{previousText}</Text>
                      <TextInput
                        style={[styles.input, styles.setInput]}
                        keyboardType="numeric"
                        value={String(set.weight)}
                        onChangeText={(value) => handleUpdateSet(exercise.id, set.id, "weight", value)}
                      />
                      <TextInput
                        style={[styles.input, styles.setInput]}
                        keyboardType="numeric"
                        value={String(set.reps)}
                        onChangeText={(value) => handleUpdateSet(exercise.id, set.id, "reps", value)}
                      />
                      <TextInput
                        style={[styles.input, styles.setInput]}
                        keyboardType="numeric"
                        value={String(set.rpe)}
                        onChangeText={(value) => handleUpdateSet(exercise.id, set.id, "rpe", value)}
                      />
                      <Pressable
                        style={[styles.checkBox, set.done && styles.checkBoxOn]}
                        onPress={() => handleUpdateSet(exercise.id, set.id, "done", !set.done)}
                      >
                        <Text style={styles.checkText}>{set.done ? "✓" : ""}</Text>
                      </Pressable>
                    </View>
                  );
                })}

                <Pressable style={[styles.button, styles.buttonMuted, styles.smallButton]} onPress={() => handleAddSet(exercise.id)}>
                  <Text style={styles.buttonMutedText}>Add Set</Text>
                </Pressable>
              </View>
            );
          }) : <ListItem text="Add exercises to start logging working sets." />}

          <Pressable style={[styles.button, styles.buttonPrimary, styles.fullButton]} onPress={handleFinishSession}>
            <Text style={styles.buttonPrimaryText}>Finish Session</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.panel]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <Text style={styles.muted}>{sessions.length} logged</Text>
          </View>
          {recentSessions.length ? recentSessions.map((session) => (
            <ListItem
              key={session.id}
              text={`${session.date} • ${session.name} • ${session.exercises.length} exercises • ${Math.round(sessionVolume(session))} volume`}
            />
          )) : <ListItem text="No sessions logged yet." />}
        </View>
      </View>
    );
  }

  function renderRecovery() {
    return (
      <View style={styles.screenContainer}>
        <View style={[styles.card, styles.panel]}>
          <Text style={styles.sectionTitle}>Daily Recovery</Text>
          <View style={styles.formGridTwo}>
            <Field label="Date"><TextInput value={recoveryDraft.date} onChangeText={(value) => setRecoveryDraft((draft) => ({ ...draft, date: value }))} style={styles.input} /></Field>
            <Field label="Sleep (hours)"><TextInput keyboardType="numeric" value={recoveryDraft.sleepHours} onChangeText={(value) => setRecoveryDraft((draft) => ({ ...draft, sleepHours: value }))} style={styles.input} /></Field>
            <Field label="Energy (1-10)"><TextInput keyboardType="numeric" value={recoveryDraft.energy} onChangeText={(value) => setRecoveryDraft((draft) => ({ ...draft, energy: value }))} style={styles.input} /></Field>
            <Field label="Soreness (1-10)"><TextInput keyboardType="numeric" value={recoveryDraft.soreness} onChangeText={(value) => setRecoveryDraft((draft) => ({ ...draft, soreness: value }))} style={styles.input} /></Field>
            <Field label="Stress (1-10)"><TextInput keyboardType="numeric" value={recoveryDraft.stress} onChangeText={(value) => setRecoveryDraft((draft) => ({ ...draft, stress: value }))} style={styles.input} /></Field>
          </View>

          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleSaveRecovery}>
            <Text style={styles.buttonPrimaryText}>Save Recovery</Text>
          </Pressable>

          {recentRecovery.length ? recentRecovery.map((entry) => (
            <ListItem
              key={entry.id}
              text={`${entry.date} • sleep ${entry.sleepHours}h • energy ${entry.energy}/10 • soreness ${entry.soreness}/10 • stress ${entry.stress}/10`}
            />
          )) : <ListItem text="No recovery check-ins yet." />}
        </View>

        <View style={[styles.card, styles.panel]}>
          <Text style={styles.sectionTitle}>Lift Feel Journal</Text>
          <View style={styles.formGridTwo}>
            <Field label="Date"><TextInput value={feedbackDraft.date} onChangeText={(value) => setFeedbackDraft((draft) => ({ ...draft, date: value }))} style={styles.input} /></Field>
            <Field label="Exercise"><TextInput value={feedbackDraft.exercise} onChangeText={(value) => setFeedbackDraft((draft) => ({ ...draft, exercise: value }))} style={styles.input} /></Field>
            <Field label="Felt Strength (-2 to +2)"><TextInput keyboardType="numeric" value={feedbackDraft.feltStrength} onChangeText={(value) => setFeedbackDraft((draft) => ({ ...draft, feltStrength: value }))} style={styles.input} /></Field>
            <Field label="Joint Pain (0-10)"><TextInput keyboardType="numeric" value={feedbackDraft.jointPain} onChangeText={(value) => setFeedbackDraft((draft) => ({ ...draft, jointPain: value }))} style={styles.input} /></Field>
          </View>
          <Field label="Notes">
            <TextInput
              value={feedbackDraft.notes}
              onChangeText={(value) => setFeedbackDraft((draft) => ({ ...draft, notes: value }))}
              multiline
              style={[styles.input, styles.noteInput]}
            />
          </Field>

          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleSaveFeedback}>
            <Text style={styles.buttonPrimaryText}>Save Feedback</Text>
          </Pressable>

          {recentFeedback.length ? recentFeedback.map((entry) => (
            <ListItem
              key={entry.id}
              text={`${entry.date} • ${entry.exercise} • strength ${signed(entry.feltStrength)} • pain ${entry.jointPain}/10${entry.notes ? ` • ${entry.notes}` : ""}`}
            />
          )) : <ListItem text="No lift feedback entries yet." />}
        </View>
      </View>
    );
  }

  function renderCoach() {
    return (
      <View style={styles.screenContainer}>
        <View style={[styles.card, styles.panel]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Iron Coach Insight</Text>
            <Pressable style={[styles.button, styles.buttonPrimary, styles.inlineButton]} onPress={handleGenerateInsight}>
              <Text style={styles.buttonPrimaryText}>Generate</Text>
            </Pressable>
          </View>

          <Text style={styles.bodyText}>{insight.summary}</Text>

          <View style={styles.signalRow}>
            <Signal label="Performance" value={insight.stats.performance} tone={valueTone(insight.stats.performanceRaw)} />
            <Signal label="Pre-Lift Carbs" value={insight.stats.carbs} tone={valueTone(insight.stats.carbsRaw)} />
            <Signal label="Sleep Shift" value={insight.stats.sleep} tone={valueTone(insight.stats.sleepRaw)} />
          </View>

          {insight.drivers.map((driver) => (
            <ListItem key={driver} text={driver} compact />
          ))}

          <Text style={styles.recommendation}>{insight.recommendation}</Text>
        </View>

        <View style={[styles.card, styles.panel]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Insight History</Text>
            <Text style={styles.muted}>{coachHistory.length} generated</Text>
          </View>
          {insightHistory.length ? insightHistory.map((entry) => (
            <ListItem
              key={entry.id}
              text={`${formatDateTime(entry.createdAt)} • ${entry.summary} • ${Math.round(entry.confidence * 100)}%`}
            />
          )) : <ListItem text="No insights generated yet." />}
        </View>
      </View>
    );
  }

  function renderActiveTab() {
    if (activeTab === "home") return renderHome();
    if (activeTab === "meals") return renderMeals();
    if (activeTab === "lifts") return renderLifts();
    if (activeTab === "recovery") return renderRecovery();
    return renderCoach();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.appShell}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerOverline}>Performance Journal</Text>
              <Text style={styles.headerTitle}>Iron Diary</Text>
              <Text style={styles.headerFocus}>{focus.title}</Text>
              <Text style={styles.headerFocusSub}>{focus.subtitle}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={[styles.button, styles.buttonMuted]} onPress={handleLoadDemo}>
                <Text style={styles.buttonMutedText}>Load Demo</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonDanger]} onPress={handleReset}>
                <Text style={styles.buttonDangerText}>Reset</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>{renderActiveTab()}</ScrollView>

          <View style={styles.bottomNav}>
            {tabOrder.map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tabLabel(tab)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MacroBar({ label, value, goal }: { label: string; value: number; goal: number }) {
  const progress = clamp((value / goal) * 100, 0, 160);

  return (
    <View style={styles.macroRow}>
      <View style={styles.rowBetween}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroMeta}>{Math.round(value)} / {goal}g</Text>
      </View>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${Math.min(progress, 100)}%` }]} />
      </View>
    </View>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickButton} onPress={onPress}>
      <Text style={styles.quickButtonText}>{label}</Text>
    </Pressable>
  );
}

function MetricBlock({
  label,
  value,
  note,
  tone
}: {
  label: string;
  value: string;
  note: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={[styles.metricNote, tone === "positive" && styles.positive, tone === "negative" && styles.negative]}>{note}</Text>
    </View>
  );
}

function Signal({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <View style={styles.signalCard}>
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={[styles.signalValue, tone === "positive" && styles.positive, tone === "negative" && styles.negative]}>{value}</Text>
    </View>
  );
}

function ListItem({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <View style={[styles.listItem, compact && styles.listItemCompact]}>
      <Text style={[styles.listText, compact && styles.listTextCompact]}>{text}</Text>
    </View>
  );
}

function Field({
  label,
  children,
  style
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function tabLabel(tab: Tab): string {
  if (tab === "home") return "Home";
  if (tab === "meals") return "Meals";
  if (tab === "lifts") return "Lifts";
  if (tab === "recovery") return "Recovery";
  return "Coach";
}

function valueTone(value: number): "positive" | "negative" | "neutral" {
  if (!Number.isFinite(value)) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function buildPreviousExerciseMap(sessions: WorkoutSession[]): Map<string, LiftSet[]> {
  const map = new Map<string, LiftSet[]>();
  const ordered = sessions.slice().sort((a, b) => asDate(b.date).getTime() - asDate(a.date).getTime());

  ordered.forEach((session) => {
    session.exercises.forEach((exercise) => {
      if (!map.has(exercise.name)) map.set(exercise.name, exercise.sets);
    });
  });

  return map;
}

function macroTotals(meals: MealEntry[]) {
  return meals.reduce(
    (total, meal) => {
      total.calories += meal.calories;
      total.protein += meal.protein;
      total.carbs += meal.carbs;
      total.fat += meal.fat;
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function sessionVolume(session: WorkoutSession) {
  return session.exercises.reduce(
    (sessionTotal, exercise) =>
      sessionTotal +
      exercise.sets.reduce((setTotal, set) => setTotal + set.weight * set.reps, 0),
    0
  );
}

function sumVolume(sessions: WorkoutSession[]) {
  return sessions.reduce((total, session) => total + sessionVolume(session), 0);
}

function performanceScore(sessions: WorkoutSession[]) {
  if (!sessions.length) return 0;

  return sessions.reduce(
    (sessionTotal, session) =>
      sessionTotal +
      session.exercises.reduce(
        (exerciseTotal, exercise) =>
          exerciseTotal +
          exercise.sets.reduce((setTotal, set) => {
            const e1rm = set.weight * (1 + set.reps / 30);
            return setTotal + e1rm * (set.rpe / 10 || 0.8);
          }, 0),
        0
      ),
    0
  );
}

function buildInsight(input: {
  meals: MealEntry[];
  sessions: WorkoutSession[];
  recovery: RecoveryEntry[];
  feedback: FeedbackEntry[];
}): Insight {
  const week = splitByWeek(input.sessions, (entry) => asDate(entry.date));
  const currentPerf = performanceScore(week.current);
  const previousPerf = performanceScore(week.previous);
  const perfDelta = percentageChange(currentPerf, previousPerf);

  const currentDates = unique(week.current.map((entry) => entry.date));
  const previousDates = unique(week.previous.map((entry) => entry.date));

  const carbsDelta = avgPreWorkoutCarbs(input.meals, currentDates) - avgPreWorkoutCarbs(input.meals, previousDates);

  const recoveryWeek = splitByWeek(input.recovery, (entry) => asDate(entry.date));
  const sleepDelta = avg(recoveryWeek.current, (entry) => entry.sleepHours) - avg(recoveryWeek.previous, (entry) => entry.sleepHours);

  const priorDelta = avgPriorDayVolume(input.sessions, currentDates) - avgPriorDayVolume(input.sessions, previousDates);

  const feedbackWeek = splitByWeek(input.feedback, (entry) => asDate(entry.date));
  const feltDelta = avg(feedbackWeek.current, (entry) => entry.feltStrength) - avg(feedbackWeek.previous, (entry) => entry.feltStrength);

  const drivers: string[] = [];
  if (Math.abs(carbsDelta) >= 8) drivers.push(`Likely driver: Pre-lift carbs shifted ${signed(carbsDelta)}g`);
  if (Math.abs(sleepDelta) >= 0.25) drivers.push(`Likely driver: Sleep changed ${signed(sleepDelta)}h`);
  if (Math.abs(priorDelta) >= 150) drivers.push(`Likely driver: Prior-day load moved ${signed(-priorDelta)}`);
  if (Math.abs(feltDelta) >= 0.3) drivers.push(`Likely driver: Self-rated strength moved ${signed(feltDelta)}`);

  const confidence = insightConfidence({
    workoutCount: week.current.length + week.previous.length,
    recoveryCount: recoveryWeek.current.length + recoveryWeek.previous.length,
    mealCount: input.meals.length,
    driverCount: drivers.length
  });

  if (!Number.isFinite(perfDelta)) {
    return {
      id: uid(),
      createdAt: new Date().toISOString(),
      summary: "Log at least two weeks of sessions to unlock trend explanations.",
      drivers: [
        "Need one previous week of sessions",
        "Tag pre-workout meals for fuel attribution",
        "Add recovery check-ins to improve confidence"
      ],
      recommendation: "Keep logging this week and refresh insight after your next cycle.",
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
    id: uid(),
    createdAt: new Date().toISOString(),
    summary: `Performance ${signed(perfDelta)}% vs last week.`,
    drivers: drivers.length ? drivers : ["No dominant drivers yet."],
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
}) {
  if (input.perfDelta > 0 && input.carbsDelta > 0 && input.sleepDelta > 0) {
    return "Keep pre-lift carbs and sleep timing stable. Add one controlled back-off set next week.";
  }
  if (input.perfDelta < 0 && input.sleepDelta < 0) {
    return "Recovery likely capped output. Hold intensity and trim accessory volume 10-15% for one week.";
  }
  if (input.perfDelta < 0 && input.priorDelta > 0) {
    return "Fatigue from prior-day loading appears elevated. Separate heavy work from high-volume days by 24h.";
  }
  if (input.feltDelta < 0) {
    return "Subjective readiness dropped. Extend warm-up and cap top sets at RPE 8 this week.";
  }
  return "Trend is stable. Keep logging consistently for sharper recommendations.";
}

function buildDemoState() {
  const meals: MealEntry[] = [];
  const sessions: WorkoutSession[] = [];
  const recovery: RecoveryEntry[] = [];
  const feedback: FeedbackEntry[] = [];

  const currentStart = weekStart(new Date());
  const previousStart = shiftDays(currentStart, -7);

  const templates = [
    {
      name: "Lower Strength",
      day: 0,
      exercises: [
        { name: "Back Squat", sets: [[225, 5, 8], [235, 5, 8.5], [245, 4, 9]] },
        { name: "Romanian Deadlift", sets: [[205, 8, 8], [215, 8, 8.5]] }
      ]
    },
    {
      name: "Upper Strength",
      day: 2,
      exercises: [
        { name: "Bench Press", sets: [[165, 6, 8], [175, 5, 8.5], [180, 4, 9]] },
        { name: "Weighted Pull-Up", sets: [[45, 6, 8], [55, 5, 8.5]] }
      ]
    },
    {
      name: "Lower Power",
      day: 4,
      exercises: [
        { name: "Deadlift", sets: [[275, 4, 8], [295, 4, 8.5], [305, 3, 9]] },
        { name: "Pause Front Squat", sets: [[165, 6, 8], [175, 6, 8.5]] }
      ]
    }
  ];

  [previousStart, currentStart].forEach((weekStartDate, index) => {
    for (let i = 0; i < 7; i += 1) {
      const date = toYmd(shiftDays(weekStartDate, i));
      meals.push({ id: uid(), loggedAt: `${date}T08:00`, slot: "breakfast", name: "Egg Whites + Oats", calories: 520, protein: 38, carbs: 56, fat: 12 });
      meals.push({ id: uid(), loggedAt: `${date}T12:30`, slot: "lunch", name: "Chicken Rice Bowl", calories: 650, protein: 49, carbs: 72, fat: 16 });
      meals.push({ id: uid(), loggedAt: `${date}T19:30`, slot: "dinner", name: "Steak + Potatoes", calories: 740, protein: 52, carbs: 58, fat: 30 });

      recovery.push({
        id: uid(),
        date,
        sleepHours: index === 0 ? 6.8 + (i % 2) * 0.2 : 7.6 + (i % 2) * 0.25,
        energy: index === 0 ? 6 : 7,
        soreness: index === 0 ? 6 : 5,
        stress: index === 0 ? 6 : 5
      });
    }

    templates.forEach((template) => {
      const date = toYmd(shiftDays(weekStartDate, template.day));
      meals.push({
        id: uid(),
        loggedAt: `${date}T15:30`,
        slot: "preworkout",
        name: index === 0 ? "Banana + Whey" : "Cream of Rice + Whey",
        calories: index === 0 ? 290 : 430,
        protein: index === 0 ? 26 : 34,
        carbs: index === 0 ? 34 : 72,
        fat: index === 0 ? 3 : 4
      });

      sessions.push({
        id: uid(),
        date,
        name: template.name,
        exercises: template.exercises.map((exercise) => ({
          id: uid(),
          name: exercise.name,
          sets: exercise.sets.map(([weight, reps, rpe]) => ({
            id: uid(),
            weight: index === 0 ? weight : Math.round(weight * 1.04),
            reps,
            rpe,
            done: true
          }))
        }))
      });

      feedback.push({
        id: uid(),
        date,
        exercise: template.exercises[0].name,
        feltStrength: index === 0 ? 0 : 1,
        jointPain: index === 0 ? 3 : 2,
        notes: index === 0 ? "Solid but average bar speed." : "Bar speed and setup felt cleaner."
      });
    });
  });

  return {
    meals,
    sessions,
    recovery,
    feedback
  };
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

function avgPreWorkoutCarbs(meals: MealEntry[], workoutDates: string[]) {
  if (!workoutDates.length) return 0;

  const matching = meals.filter(
    (meal) => workoutDates.includes(meal.loggedAt.slice(0, 10)) && meal.slot === "preworkout"
  );

  return avg(matching, (entry) => entry.carbs);
}

function avgPriorDayVolume(sessions: WorkoutSession[], workoutDates: string[]) {
  if (!workoutDates.length) return 0;

  let total = 0;
  let count = 0;

  workoutDates.forEach((dateText) => {
    const previous = toYmd(shiftDays(asDate(dateText), -1));
    const priorSessions = sessions.filter((session) => session.date === previous);
    if (!priorSessions.length) return;
    total += sumVolume(priorSessions);
    count += 1;
  });

  return count ? total / count : 0;
}

function calculateReadiness(entry: RecoveryEntry | null) {
  if (!entry) {
    return { score: 0, note: "No recent check-in" };
  }

  const sleep = clamp(entry.sleepHours / 8, 0, 1);
  const energy = clamp(entry.energy / 10, 0, 1);
  const soreness = clamp(1 - entry.soreness / 10, 0, 1);
  const stress = clamp(1 - entry.stress / 10, 0, 1);

  const score = (sleep * 0.35 + energy * 0.35 + soreness * 0.15 + stress * 0.15) * 100;

  return {
    score,
    note: score >= 78 ? "High readiness" : score >= 63 ? "Moderate readiness" : "Low readiness"
  };
}

function trainingStreak(sessions: WorkoutSession[]) {
  const dateSet = new Set(unique(sessions.map((session) => session.date)));
  if (!dateSet.size) return 0;

  let streak = 0;
  let cursor = asDate(todayYmd());

  if (!dateSet.has(toYmd(cursor))) {
    cursor = shiftDays(cursor, -1);
  }

  while (dateSet.has(toYmd(cursor))) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }

  return streak;
}

function latestByDate<T>(entries: T[], getDate: (entry: T) => string): T | null {
  if (!entries.length) return null;
  return entries.reduce((latest, entry) => (asDate(getDate(entry)).getTime() > asDate(getDate(latest)).getTime() ? entry : latest));
}

function insightConfidence(input: {
  workoutCount: number;
  recoveryCount: number;
  mealCount: number;
  driverCount: number;
}) {
  const workoutFactor = Math.min(input.workoutCount / 8, 1) * 0.42;
  const recoveryFactor = Math.min(input.recoveryCount / 10, 1) * 0.26;
  const mealFactor = Math.min(input.mealCount / 35, 1) * 0.22;
  const driverFactor = Math.min(input.driverCount / 4, 1) * 0.1;
  return Math.min(workoutFactor + recoveryFactor + mealFactor + driverFactor, 1);
}

function createSet(previous?: LiftSet): LiftSet {
  return {
    id: uid(),
    weight: previous ? previous.weight : 0,
    reps: previous ? previous.reps : 8,
    rpe: previous ? previous.rpe : 8,
    done: false
  };
}

function firstSentence(text: string) {
  const marker = text.indexOf(".");
  if (marker < 0) return text;
  return text.slice(0, marker + 1);
}

function weekStart(reference: Date) {
  const date = new Date(reference);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function localDateTimeValue(date: Date) {
  return `${toYmd(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function todayYmd() {
  return toYmd(new Date());
}

function toYmd(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTime(value: string) {
  const date = asDate(value);
  return `${toYmd(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(value: string) {
  const date = asDate(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function asDate(value: string | Date) {
  if (value instanceof Date) return value;
  if (value.length === 10) return new Date(`${value}T12:00:00`);
  return new Date(value);
}

function avg<T>(entries: T[], valueOf: (entry: T) => number) {
  if (!entries.length) return 0;
  return entries.reduce((total, entry) => total + valueOf(entry), 0) / entries.length;
}

function percentageChange(current: number, previous: number) {
  if (!previous) return Number.NaN;
  return ((current - previous) / previous) * 100;
}

function slotLabel(slot: MealSlot) {
  if (slot === "preworkout") return "Pre-Workout";
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

function num(value: string | number | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function signed(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#101217"
  },
  flex: {
    flex: 1
  },
  appShell: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
    backgroundColor: "#11141a"
  },
  header: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#1a1e26",
    padding: 12,
    gap: 8
  },
  headerOverline: {
    color: "#8ec7ff",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  headerTitle: {
    color: "#f0f4f8",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2
  },
  headerFocus: {
    color: "#f0f4f8",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600"
  },
  headerFocusSub: {
    color: "#9ea8b5",
    fontSize: 12,
    marginTop: 2
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  scrollContent: {
    paddingBottom: 96
  },
  screenContainer: {
    gap: 10
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#1b2029"
  },
  homeCard: {
    padding: 12
  },
  panel: {
    padding: 12,
    gap: 8
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  overline: {
    color: "#94a0ad",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  bigNumber: {
    color: "#f0f4f8",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 2
  },
  muted: {
    color: "#9ea8b5",
    fontSize: 12
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 74
  },
  ringTrack: {
    width: 22,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#2a313f",
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  ringFill: {
    width: "100%",
    backgroundColor: "#8ec7ff"
  },
  ringLabel: {
    color: "#8ec7ff",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "700"
  },
  macroRow: {
    marginTop: 8,
    gap: 4
  },
  macroLabel: {
    color: "#d8dee5",
    fontSize: 12,
    fontWeight: "600"
  },
  macroMeta: {
    color: "#9ea8b5",
    fontSize: 11
  },
  macroTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#2b3341",
    overflow: "hidden"
  },
  macroFill: {
    height: "100%",
    backgroundColor: "#8ec7ff"
  },
  sectionTitle: {
    color: "#f0f4f8",
    fontSize: 17,
    fontWeight: "700"
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2
  },
  quickButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#252d3a",
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  quickButtonText: {
    color: "#eef2f7",
    fontSize: 13,
    fontWeight: "600"
  },
  metricGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  metricBlock: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#232b39",
    padding: 8
  },
  metricLabel: {
    color: "#9ea8b5",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  metricValue: {
    color: "#f0f4f8",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2
  },
  metricNote: {
    color: "#9ea8b5",
    fontSize: 11,
    marginTop: 2
  },
  bodyText: {
    color: "#dbe2ea",
    fontSize: 14,
    lineHeight: 20
  },
  listItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#232a35",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8
  },
  listItemCompact: {
    paddingVertical: 7,
    marginTop: 6
  },
  listText: {
    color: "#dbe2ea",
    fontSize: 12,
    lineHeight: 18
  },
  listTextCompact: {
    fontSize: 11
  },
  slotCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#222a36",
    padding: 10,
    marginTop: 8
  },
  slotTitle: {
    color: "#f0f4f8",
    fontSize: 14,
    fontWeight: "700"
  },
  slotMeta: {
    color: "#9ea8b5",
    fontSize: 11
  },
  formRow: {
    gap: 8
  },
  formGridTwo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  formRowAlignEnd: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8
  },
  flexField: {
    flex: 1
  },
  field: {
    gap: 4,
    minWidth: "48%"
  },
  fieldLabel: {
    color: "#9ea8b5",
    fontSize: 11
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#141922",
    color: "#f1f5f8",
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13
  },
  noteInput: {
    minHeight: 84,
    textAlignVertical: "top"
  },
  slotChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  slotChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#242c3a"
  },
  slotChipActive: {
    backgroundColor: "#8ec7ff",
    borderColor: "transparent"
  },
  slotChipText: {
    color: "#dbe2ea",
    fontSize: 11,
    fontWeight: "600"
  },
  slotChipTextActive: {
    color: "#10151c"
  },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonPrimary: {
    backgroundColor: "#8ec7ff"
  },
  buttonPrimaryText: {
    color: "#10151c",
    fontWeight: "700",
    fontSize: 13
  },
  buttonMuted: {
    backgroundColor: "#2a3342",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  buttonMutedText: {
    color: "#e4ebf3",
    fontWeight: "600",
    fontSize: 12
  },
  buttonDanger: {
    backgroundColor: "#f3a3ae"
  },
  buttonDangerText: {
    color: "#291116",
    fontWeight: "700",
    fontSize: 12
  },
  inlineButton: {
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  fullButton: {
    marginTop: 12
  },
  quickChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8
  },
  quickChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#242c3a",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  quickChipText: {
    color: "#dbe2ea",
    fontSize: 11,
    fontWeight: "600"
  },
  exerciseCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#212937",
    padding: 10,
    marginTop: 10,
    gap: 6
  },
  exerciseTitle: {
    color: "#f0f4f8",
    fontSize: 15,
    fontWeight: "700"
  },
  linkText: {
    color: "#9ea8b5",
    fontSize: 12
  },
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 4
  },
  setHead: {
    flex: 1,
    color: "#8f99a8",
    fontSize: 10,
    textTransform: "uppercase"
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  setCell: {
    flex: 1,
    color: "#dbe2ea",
    fontSize: 11
  },
  setInput: {
    flex: 1,
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 6,
    textAlign: "center"
  },
  checkBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#141922",
    height: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  checkBoxOn: {
    backgroundColor: "#8ec7ff",
    borderColor: "transparent"
  },
  checkText: {
    color: "#10151c",
    fontWeight: "800"
  },
  smallButton: {
    alignSelf: "flex-start",
    marginTop: 4
  },
  signalRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  signalCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#222a37",
    padding: 8
  },
  signalLabel: {
    color: "#9ea8b5",
    fontSize: 10,
    textTransform: "uppercase"
  },
  signalValue: {
    color: "#f0f4f8",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 3
  },
  recommendation: {
    color: "#c7e4ff",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8
  },
  positive: {
    color: "#9de9bb"
  },
  negative: {
    color: "#f3a3ae"
  },
  bottomNav: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#1c2230",
    flexDirection: "row",
    padding: 6,
    gap: 6
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "#2a3240"
  },
  tabBtnActive: {
    backgroundColor: "#8ec7ff"
  },
  tabText: {
    color: "#dbe2ea",
    fontSize: 11,
    fontWeight: "700"
  },
  tabTextActive: {
    color: "#10151c"
  }
});
