import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import { requireUser, type AuthenticatedRequest } from "../middleware/auth";

const SEED_TASKS = [
  {
    title: "Recommend a Barber near Dwarka Sec 21",
    type: "recommendation",
    status: "active",
    location: "Dwarka Sec 21, New Delhi",
    dueDate: "Jun 10, 2025",
    coins: 80,
    icon: "cut-outline",
  },
  {
    title: "Submit Bid — Cycle Service Booking",
    type: "bid",
    status: "active",
    location: "Dwarka Sec 21, New Delhi",
    dueDate: "Jun 15, 2025",
    coins: 120,
    icon: "bicycle-outline",
  },
  {
    title: "Recommend a Bike Mechanic — Royal Enfield",
    type: "recommendation",
    status: "active",
    location: "Dwarka, New Delhi",
    dueDate: "Jun 12, 2025",
    coins: 95,
    icon: "construct-outline",
  },
  {
    title: "Find a Plumber in Rohini",
    type: "recommendation",
    status: "accepted",
    location: "Rohini, New Delhi",
    dueDate: "Jun 8, 2025",
    coins: 60,
    icon: "water-outline",
  },
  {
    title: "Rate a Local Electrician — Janakpuri",
    type: "survey",
    status: "active",
    location: "Janakpuri, New Delhi",
    dueDate: "Jun 20, 2025",
    coins: 40,
    icon: "flash-outline",
  },
] as const;

const router: IRouter = Router();

router.get("/tasks", requireUser, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    let rows = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId));

    if (rows.length === 0) {
      await db.insert(tasksTable).values(
        SEED_TASKS.map((t) => ({ ...t, userId })),
      );
      rows = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId));
    }

    res.json(
      rows.map((t) => ({
        id: t.id,
        userId: t.userId,
        title: t.title,
        type: t.type,
        status: t.status,
        location: t.location,
        dueDate: t.dueDate,
        coins: t.coins,
        icon: t.icon,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "GET /tasks failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/tasks/:id", requireUser, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const id = String(req.params["id"] ?? "");
  const { status } = req.body as { status?: string };

  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  try {
    await db
      .update(tasksTable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));

    const rows = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const t = rows[0]!;
    res.json({
      id: t.id,
      userId: t.userId,
      title: t.title,
      type: t.type,
      status: t.status,
      location: t.location,
      dueDate: t.dueDate,
      coins: t.coins,
      icon: t.icon,
    });
  } catch (err) {
    req.log.error({ err }, "PATCH /tasks/:id failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
