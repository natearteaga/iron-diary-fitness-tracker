import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requestContext } from "./middleware/request-context.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(requestContext);

app.use("/api/v1", apiRouter);
app.get("/", (_req, res) => {
  res.json({
    name: "Iron Diary API",
    version: "0.1.0",
    docs: "See docs/roadmap.md and docs/apple-health-sync.md"
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Iron Diary API listening on http://localhost:${env.PORT}`);
});
