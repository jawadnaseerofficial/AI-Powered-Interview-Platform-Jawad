import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, FileText, Mic, Play, Timer } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewResults, jobs } from "@/lib/db/schema";
import { getCurrentCompany } from "@/lib/company";

function scorePill(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200/60";
  if (score >= 60) return "bg-amber-50 text-amber-700 ring-amber-200/60";
  return "bg-rose-50 text-rose-700 ring-rose-200/60";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Static waveform heights (visual only)
const waveform = [12, 28, 18, 34, 24, 40, 30, 22, 36, 16, 26, 38, 20, 32, 14, 28, 34, 24, 18, 30];

export default async function AudioInterviewsPage() {
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

  const audioInterviews = allResults.filter((r) => {
    if (!r.jobId) return false;
    return jobMap.get(r.jobId)?.interviewType === "audio";
  });

  const avgScore = audioInterviews.length
    ? Math.round(
        audioInterviews.reduce((sum, item) => sum + item.overallScore, 0) /
          audioInterviews.length
      )
    : 0;

  const shortlisted = audioInterviews.filter((r) => r.overallScore >= 80).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600">
            Voice Pipeline
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Audio Interviews
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Voice interviews conducted by the AI interviewer.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-700">
          <Mic className="h-4 w-4" />
          Live Voice Analysis
        </span>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {audioInterviews.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">Voice interviews</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/60">
              <Mic className="h-5 w-5" />
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
              <p className="mt-1 text-xs text-slate-400">Across all audio</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
              <Timer className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Shortlisted</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {shortlisted}
              </p>
              <p className="mt-1 text-xs text-slate-400">Score ≥ 80</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200/60">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty */}
      {audioInterviews.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-200/60">
            <Mic className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">No audio interviews yet</p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              When candidates complete a voice interview, their recordings and transcripts appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {audioInterviews.map((item) => {
            const job = item.jobId ? jobMap.get(item.jobId) : null;
            return (
              <Card
                key={item.id}
                className="group overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                  {/* Candidate */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-11 w-11 ring-1 ring-violet-200/60">
                      <AvatarFallback className="bg-violet-50 text-sm font-semibold text-violet-700">
                        {getInitials(item.candidateName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {item.candidateName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {job?.title || "General Interview"}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Waveform */}
                  <div className="flex h-10 items-end gap-0.5">
                    {waveform.map((height, index) => (
                      <div
                        key={index}
                        className="w-1 rounded-full bg-gradient-to-t from-violet-500 to-violet-300 transition-all group-hover:from-violet-600 group-hover:to-violet-400"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>

                  {/* Play button */}
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 shrink-0 rounded-full border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-700"
                    onClick={() => {}}
                  >
                    <Play className="h-4 w-4" />
                  </Button>

                  {/* Score */}
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scorePill(
                      item.overallScore
                    )}`}
                  >
                    {item.overallScore}
                    <span className="font-normal opacity-70">/100</span>
                  </span>

                  {/* Status */}
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-0 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
                  >
                    Completed
                  </Badge>

                  {/* Transcript */}
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/dashboard/candidates/${item.id}`} />}
                    className="shrink-0 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Transcript
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