import { Router } from "express";

import { appleHealthRouter } from "./apple-health.js";
import { authRouter } from "./auth.js";
import { coachRouter } from "./coach.js";
import { healthRouter } from "./health.js";
import { liftsRouter } from "./lifts.js";
import { mealsRouter } from "./meals.js";
import { recoveryRouter } from "./recovery.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/meals", mealsRouter);
apiRouter.use("/lifts", liftsRouter);
apiRouter.use("/recovery", recoveryRouter);
apiRouter.use("/coach", coachRouter);
apiRouter.use("/apple-health", appleHealthRouter);
