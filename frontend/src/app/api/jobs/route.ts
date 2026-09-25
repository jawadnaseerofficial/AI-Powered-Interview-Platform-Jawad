import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getCurrentCompany } from "@/lib/company";

export async function GET() {
  try {
    const company = await getCurrentCompany();

    // Signed-in recruiter  -> only THEIR company's jobs
    // Signed-out visitor   -> all open jobs (public job board)
    const rows = company
      ? await db
          .select()
          .from(jobs)
          .where(eq(jobs.companyId, company.id))
          .orderBy(desc(jobs.createdAt))
      : await db
          .select()
          .from(jobs)
          .where(eq(jobs.status, "Open"))
          .orderBy(desc(jobs.createdAt));

    return NextResponse.json({ jobs: rows });
  } catch (error) {
    console.error("GET /api/jobs failed:", error);
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const company = await getCurrentCompany();
    if (!company) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(jobs)
      .values({
        companyId: company.id,
        title,
        description: typeof body.description === "string" ? body.description : "",
        techStack: Array.isArray(body.techStack) ? body.techStack : [],
        interviewType:
          typeof body.interviewType === "string" ? body.interviewType : "questions",
        questions: Array.isArray(body.questions) ? body.questions : [],
      })
      .returning();

    return NextResponse.json({ job: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs failed:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}