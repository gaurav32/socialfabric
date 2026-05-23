import { Request, Response, NextFunction } from "express";

export function timestampMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader("X-Api-Called-At", new Date().toISOString());
  next();
}
