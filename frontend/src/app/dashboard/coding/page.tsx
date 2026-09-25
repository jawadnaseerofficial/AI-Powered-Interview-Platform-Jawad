import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Code,
  Eye,
  FileCode2,
  Terminal,
  XCircle,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewResults, jobs } from "@/lib/db/schema";
import { getCurrentCompany } from "@/lib/company";

const languageStyles: Record<string, string> = {
  JavaScript: "bg-amber-50 text-amber-700 ring-amber-200/60",
  Python: "bg-blue-50 text-blue-700 ring-blue-200/60",
  TypeScript: "bg-sky-50 text-sky-700 ring-sky-200/60",
  Java: "bg-orange-50 text-orange-700 ring-orange-200/60",
};

function scorePill(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200/60";
  if (score >= 60) return "bg-amber-50 text-amber-700 ring-amber-200/60";
  return "bg-rose-50 text-rose-700 ring-rose-200/60";
}

function statusFor(score: number) {
  if (score >= 70)
    return {
      label: "Passed",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
      icon: CheckCircle2,
    };
  return {
    label: "Review",
    className: "bg-amber-50 text-amber-700 ring-amber-200/60",
    icon: XCircle,
  };
}

export default async function CodingInterviewsPage() {
  const company = await getCurrentCompany();
  if (!company) return null;

  const allJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.companyId, company.id));
  const jobMap = new Map(allJobs.map((j) => [j.id, j]));

  const allResults = await db
    .select()
    .from(interviewResults)
    .where(eq(interviewResults.companyId, company.id));

  const codingSubmissions = allResults.filter((r) => {
    if (!r.jobId) return false;
    return jobMap.get(r.jobId)?.interviewType === "coding";
  });

  const avgScore = codingSubmissions.length
    ? Math.round(
        codingSubmissions.reduce((sum, sub) => sum + sub.overallScore, 0) /
          codingSubmissions.length
      )
    : 0;

  const passed = codingSubmissions.filter((s) => s.overallScore >= 70).length;
  const passRate = codingSubmissions.length
    ? Math.round((passed / codingSubmissions.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600">
            Secure Runner
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Coding Interviews
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Automated code evaluations and AI code reviews.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-700">
          <Terminal className="h-4 w-4" />
          Sandbox Active
        </span>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Submissions</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {codingSubmissions.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">Code reviews done</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200/60">
              <FileCode2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Score</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {avgScore}
              </p>
              <p className="mt-1 text-xs text-slate-400">Across submissions</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <Code className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Pass Rate</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {passRate}%
              </p>
              <p className="mt-1 text-xs text-slate-400">Score ≥ 70</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty */}
      {codingSubmissions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 ring-1 ring-violet-200/60">
            <Terminal className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">No coding submissions yet</p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              When candidates complete a coding interview, their code and AI reviews appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {codingSubmissions.map((sub) => {
            const job = sub.jobId ? jobMap.get(sub.jobId) : null;
            const status = statusFor(sub.overallScore);
            const StatusIcon = status.icon;
            return (
              <Card
                key={sub.id}
                className="group overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                  {/* Candidate */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
                      {sub.candidateName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {sub.candidateName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {job?.title || "Coding Assessment"}
                      </p>
                    </div>
                  </div>

                  {/* Language badge */}
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-0 bg-slate-100 text-slate-700 ring-1 ring-slate-200/60 font-mono text-xs"
                  >
                    code submitted
                  </Badge>

                  {/* Score */}
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scorePill(
                      sub.overallScore
                    )}`}
                  >
                    {sub.overallScore}
                    <span className="font-normal opacity-70">/100</span>
                  </span>

                  {/* Status */}
                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-full border-0 ring-1 ${status.className}`}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>

                  {/* View Code */}
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/dashboard/candidates/${sub.id}`} />}
                    className="shrink-0 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Code
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}