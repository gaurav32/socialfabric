import { Request, Response, NextFunction } from "express";
import { getFirebaseAuth } from "../lib/firebaseAdmin";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (process.env.BYPASS_AUTH === "true") {
    (req as AuthenticatedRequest).userId = "dev-user";
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const idToken = authHeader.slice(7);
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(idToken);
    (req as AuthenticatedRequest).userId = decoded.uid;
    next();
  } catch (err) {
    req.log?.warn({ err }, "Failed to verify Firebase ID token");
    res.status(401).json({ error: "Unauthorized" });
  }
}
