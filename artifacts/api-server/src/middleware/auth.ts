import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (process.env.BYPASS_AUTH === "true") {
    (req as AuthenticatedRequest).userId = "dev-user";
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as AuthenticatedRequest).userId = authHeader.slice(7);
  next();
}
