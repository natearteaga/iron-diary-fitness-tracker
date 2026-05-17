import { Router } from "express";

export const authRouter = Router();

authRouter.get("/session", (req, res) => {
  res.json({
    userId: req.userId,
    authMode: "header-placeholder",
    nextStep: "Replace x-user-id header with real JWT auth (Clerk/Firebase/Auth0)."
  });
});
