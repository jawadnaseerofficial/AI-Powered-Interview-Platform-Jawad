import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";

// Returns the signed-in user's company, creating it on first visit
export async function getCurrentCompany() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db
    .select()
    .from(companies)
    .where(eq(companies.clerkUserId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(companies)
    .values({ clerkUserId: userId })
    .returning();

  return created;
}