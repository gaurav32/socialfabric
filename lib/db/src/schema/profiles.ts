import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  email: text("email").notNull().default(""),
  referralCode: text("referral_code").notNull().default(""),
  socialScore: integer("social_score").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  kycStatus: text("kyc_status").notNull().default("pending"),
  invitedCount: integer("invited_count").notNull().default(0),
  joinedCount: integer("joined_count").notNull().default(0),
  ptsEarned: integer("pts_earned").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectProfileSchema = createSelectSchema(profilesTable);
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
