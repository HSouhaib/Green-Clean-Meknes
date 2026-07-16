import { getDb } from "../queries/connection";
import { activityLogs } from "@db/schema";

interface LogActivityInput {
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: LogActivityInput) {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      userId: userId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      details: details ? JSON.stringify(details) : null,
      ipAddress: ipAddress ?? null,
    });
  } catch {
    // Fire-and-forget: don't let logging failures break the main operation
  }
}
