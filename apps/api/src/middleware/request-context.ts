import type { NextFunction, Request, Response } from "express";

const USER_HEADER = "x-user-id";

export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.header(USER_HEADER) ?? "demo-user";
  req.userId = userId;
  next();
}
