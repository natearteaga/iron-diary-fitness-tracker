import type { Request } from "express";

export function getUserId(req: Request): string {
  if (!req.userId) {
    throw new Error("Missing request user context");
  }
  return req.userId;
}

export function asDate(value: string): Date {
  if (value.length === 10) {
    return new Date(`${value}T12:00:00`);
  }
  return new Date(value);
}
