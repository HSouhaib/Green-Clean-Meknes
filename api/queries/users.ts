import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";
export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}
export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}
export async function upsertUser(data: InsertUser) {
  const isOwner = !!env.ownerUnionId && data.unionId === env.ownerUnionId;
  const existing = await findUserByUnionId(data.unionId);
  if (existing) {
    // Existing account: refresh profile fields only. The role is never
    // changed here — elevation/demotion goes exclusively through the
    // admin-gated user.updateRole mutation. Sole exception: the configured
    // owner is always kept at super_admin.
    const updateSet: Partial<InsertUser> = {
      ...data,
      lastSignInAt: new Date(),
    };
    delete updateSet.role;
    if (isOwner) {
      updateSet.role = "super_admin";
    }
    await getDb()
      .update(schema.users)
      .set(updateSet)
      .where(eq(schema.users.id, existing.id));
  } else {
    // First-time account: always grant the base "user" role, whatever the
    // caller passed. The only exception is the configured owner.
    const values: InsertUser = {
      ...data,
      role: isOwner ? "super_admin" : "user",
    };
    await getDb().insert(schema.users).values(values);
  }
}
