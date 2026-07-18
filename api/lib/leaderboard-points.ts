import { getDb } from "../queries/connection";
import { volunteerPoints, siteSettings } from "@db/schema";
import { eq, and } from "drizzle-orm";

async function getPointValue(key: string, fallback: number): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  if (!row?.value) return fallback;
  const parsed = parseInt(row.value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export async function awardRegistrationPoints(
  userId: number,
  campaignId: number
): Promise<void> {
  const db = getDb();
  const points = await getPointValue("points_registration", 1);
  await db.insert(volunteerPoints).values({
    userId,
    campaignId,
    points,
    reason: "registration",
  });
}

export async function removeRegistrationPoints(
  userId: number,
  campaignId: number
): Promise<void> {
  const db = getDb();
  await db
    .delete(volunteerPoints)
    .where(
      and(
        eq(volunteerPoints.userId, userId),
        eq(volunteerPoints.campaignId, campaignId),
        eq(volunteerPoints.reason, "registration")
      )
    );
}

export async function hasAttendancePoints(
  userId: number,
  campaignId: number
): Promise<boolean> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(volunteerPoints)
    .where(
      and(
        eq(volunteerPoints.userId, userId),
        eq(volunteerPoints.campaignId, campaignId),
        eq(volunteerPoints.reason, "attendance")
      )
    )
    .limit(1);
  return !!existing;
}

export async function awardAttendancePoints(
  userId: number,
  campaignId: number
): Promise<void> {
  const db = getDb();
  const points = await getPointValue("points_attendance", 5);
  await db.insert(volunteerPoints).values({
    userId,
    campaignId,
    points,
    reason: "attendance",
  });
}
