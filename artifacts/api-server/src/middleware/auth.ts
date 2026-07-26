import { Request, Response, NextFunction } from "express";
import { getFirebaseAuth } from "../lib/firebaseAdmin";

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail?: string;
  userDisplayName?: string;
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
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.userId = decoded.uid;
    // Custom claims set when the token was minted in /api/auth/google/callback.
    authenticatedReq.userEmail = typeof decoded.email === "string" ? decoded.email : undefined;
    authenticatedReq.userDisplayName = typeof decoded.name === "string" ? decoded.name : undefined;
    next();
  } catch (err) {
    req.log?.warn({ err }, "Failed to verify Firebase ID token");
    res.status(401).json({ error: "Unauthorized" });
  }
}
