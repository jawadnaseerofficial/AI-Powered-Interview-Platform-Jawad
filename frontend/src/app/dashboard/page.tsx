import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowRight,
  Briefcase,
  Inbox,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewResults, jobs } from "@/lib/db/schema";
import { getCurrentCompany } from "@/lib/company";

type Tone = "violet" | "blue" | "emerald" | "amber";

const toneStyles: Record<Tone, string> = {
  violet: "bg-violet-50 text-violet-600 ring-violet-200/60",
  blue: "bg-blue-50 text-blue-600 ring-blue-200/60",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
  amber: "bg-amber-50 text-amber-600 ring-amber-200/60",
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{hint}</p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneStyles[tone]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function scorePill(score: number) {
  if (score >= 80)
    return "bg-emerald-50 text-emerald-700 ring-emerald-200/60";
  if (score >= 60)
    return "bg-amber-50 text-amber-700 ring-amber-200/60";
  return "bg-rose-50 text-rose-700 ring-rose-200/60";
}

export default async function DashboardPage() {
  // Safe user retrieval alongside company query
  const [company, user] = await Promise.all([
    getCurrentCompany(),
    currentUser().catch((err) => {
      console.error("Clerk currentUser error on Dashboard:", err);
      return null;
    }),
  ]);

  if (!company) return null;
  const companyId = company.id;

  // Single-batch DB execution
  const [
    [openJobsRow],
    [candidateStatsRow],
    recentResults,
    companyJobs,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(jobs)
      .where(and(eq(jobs.companyId, companyId), eq(jobs.status, "Open"))),

    db
      .select({
        count: count(),
        avgScore: avg(interviewResults.overallScore),
      })
      .from(interviewResults)
      .where(eq(interviewResults.companyId, companyId)),

    db
      .select({
        id: interviewResults.id,
        candidateName: interviewResults.candidateName,
        candidateEmail: interviewResults.candidateEmail,
        overallScore: interviewResults.overallScore,
        createdAt: interviewResults.createdAt,
        jobId: interviewResults.jobId,
      })
      .from(interviewResults)
      .where(eq(interviewResults.companyId, companyId))
      .orderBy(desc(interviewResults.createdAt))
      .limit(5),

    db
      .select({
        id: jobs.id,
        title: jobs.title,
      })
      .from(jobs)
      .where(eq(jobs.companyId, companyId)),
  ]);

  const totalCandidatesCount = candidateStatsRow?.count ?? 0;
  const avgScore = candidateStatsRow?.avgScore
    ? Math.round(Number(candidateStatsRow.avgScore))
    : 0;

  const jobTitles = new Map(companyJobs.map((job) => [job.id, job.title]));
  const firstName = user?.firstName ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600">
            Welcome back{firstName ? `, ${firstName}` : ""} 👋
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Your hiring at a glance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening across your pipeline today.
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/jobs" />}
          className="shadow-md shadow-violet-600/20"
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Manage Jobs
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Candidates"
          value={totalCandidatesCount}
          hint="Interviews completed"
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="Open Jobs"
          value={openJobsRow?.count || 0}
          hint="Waiting for applicants"
          icon={Briefcase}
          tone="blue"
        />
        <StatCard
          label="Average AI Score"
          value={avgScore}
          hint="Across your candidates"
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="AI Evaluations"
          value={totalCandidatesCount}
          hint="Answers graded by Gemini"
          icon={Sparkles}
          tone="amber"
        />
      </div>

      {/* Recent Activity */}
      <Card className="rounded-2xl border-slate-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Recent Activity
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Latest AI interview results for your company
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dashboard/candidates" />}
            className="text-violet-600 hover:text-violet-700"
          >
            View all
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentResults.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50">
                <Inbox className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  No interviews yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Share a job link and candidates will appear here instantly.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/jobs" />}
              >
                Create your first job
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentResults.map((result) => (
                <Link
                  key={result.id}
                  href={`/dashboard/candidates/${result.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-slate-50/70 rounded-lg px-2 -mx-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold text-violet-700 ring-1 ring-violet-200/60">
                      {result.candidateName ? result.candidateName.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {result.candidateName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {result.jobId
                          ? jobTitles.get(result.jobId) ?? "General Interview"
                          : "General Interview"}
                        {" • "}
                        {result.candidateEmail || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scorePill(result.overallScore)}`}
                    >
                      {result.overallScore}/100
                    </span>
                    <span className="hidden text-xs text-slate-400 sm:block">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}