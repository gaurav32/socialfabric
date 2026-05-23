import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, profilesTable } from "@workspace/db";
import { requireUser, type AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/profile", requireUser, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    let rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      const shortId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
      await db.insert(profilesTable).values({
        userId,
        displayName: "Dev User",
        email: "dev@socialfabric.app",
        referralCode: `FABRIC-${shortId || "ADI202"}`,
        socialScore: 720,
        coins: 200,
        kycStatus: "pending",
        invitedCount: 12,
        joinedCount: 3,
        ptsEarned: 45,
      });
      rows = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);
    }

    const profile = rows[0]!;
    res.json({
      userId: profile.userId,
      displayName: profile.displayName,
      email: profile.email,
      referralCode: profile.referralCode,
      socialScore: profile.socialScore,
      coins: profile.coins,
      kycStatus: profile.kycStatus,
      invitedCount: profile.invitedCount,
      joinedCount: profile.joinedCount,
      ptsEarned: profile.ptsEarned,
    });
  } catch (err) {
    req.log.error({ err }, "GET /profile failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", requireUser, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { displayName, email } = req.body as {
    displayName?: string;
    email?: string;
  };

  try {
    await db
      .update(profilesTable)
      .set({
        ...(displayName !== undefined && { displayName }),
        ...(email !== undefined && { email }),
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.userId, userId));

    const rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const profile = rows[0]!;
    res.json({
      userId: profile.userId,
      displayName: profile.displayName,
      email: profile.email,
      referralCode: profile.referralCode,
      socialScore: profile.socialScore,
      coins: profile.coins,
      kycStatus: profile.kycStatus,
      invitedCount: profile.invitedCount,
      joinedCount: profile.joinedCount,
      ptsEarned: profile.ptsEarned,
    });
  } catch (err) {
    req.log.error({ err }, "PUT /profile failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
