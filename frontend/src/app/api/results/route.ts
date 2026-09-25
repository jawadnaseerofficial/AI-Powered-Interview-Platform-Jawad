import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewResults, jobs } from "@/lib/db/schema";
import { getCurrentCompany } from "@/lib/company";

export async function GET() {
  try {
    const company = await getCurrentCompany();
    if (!company) {
      return NextResponse.json({ results: [] });
    }

    const rows = await db
      .select()
      .from(interviewResults)
      .where(eq(interviewResults.companyId, company.id))
      .orderBy(desc(interviewResults.createdAt));

    return NextResponse.json({ results: rows });
  } catch (error) {
    console.error("GET /api/results failed:", error);
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const overallScore = Number(body.overallScore);
    if (Number.isNaN(overallScore)) {
      return NextResponse.json({ error: "overallScore is required" }, { status: 400 });
    }

    // The result belongs to the company that owns the job
    let companyId: number | null = null;
    if (typeof body.jobId === "number") {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, body.jobId))
        .limit(1);
      companyId = job?.companyId ?? null;
    }

    const [created] = await db
      .insert(interviewResults)
      .values({
        companyId,
        jobId: typeof body.jobId === "number" ? body.jobId : null,
        candidateName:
          typeof body.candidateName === "string" && body.candidateName.trim()
            ? body.candidateName.trim()
            : "Anonymous",
        candidateEmail:
          typeof body.candidateEmail === "string" && body.candidateEmail.trim()
            ? body.candidateEmail.trim()
            : null,
        overallScore: Math.max(0, Math.min(100, Math.round(overallScore))),
        questionScores: Array.isArray(body.questionScores) ? body.questionScores : [],
        questions: Array.isArray(body.questions) ? body.questions : [],
        answers: Array.isArray(body.answers) ? body.answers : [],
        evaluations: Array.isArray(body.evaluations) ? body.evaluations : [],
      })
      .returning();

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/results failed:", error);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}