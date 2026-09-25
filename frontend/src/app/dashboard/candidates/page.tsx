"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, Crown, Eye, Inbox, Search, Users } from "lucide-react";

type ResultRow = {
  id: number;
  jobId: number | null;
  candidateName: string;
  candidateEmail: string | null;
  overallScore: number;
  questionScores: number[];
  answers: string[];
  createdAt: string;
};

type Job = { id: number; title: string };

type Row = ResultRow & { jobTitle: string; rank: number };

function statusFor(score: number) {
  if (score >= 80)
    return {
      label: "Shortlisted",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
    };
  if (score >= 60)
    return {
      label: "Under Review",
      className:
        "bg-amber-50 text-amber-700 ring-amber-200/60",
    };
  return {
    label: "Not Selected",
    className:
      "bg-rose-50 text-rose-700 ring-rose-200/60",
  };
}

function scorePill(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200/60";
  if (score >= 60) return "bg-amber-50 text-amber-700 ring-amber-200/60";
  return "bg-rose-50 text-rose-700 ring-rose-200/60";
}

function rankBadge(rank: number) {
  if (rank === 1)
    return "bg-gradient-to-br from-amber-300 to-amber-500 text-white ring-2 ring-amber-200 shadow-sm shadow-amber-500/30";
  if (rank === 2)
    return "bg-gradient-to-br from-slate-300 to-slate-500 text-white ring-2 ring-slate-200";
  if (rank === 3)
    return "bg-gradient-to-br from-orange-300 to-orange-500 text-white ring-2 ring-orange-200";
  return "bg-white text-slate-600 ring-1 ring-slate-200";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CandidatesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [resultsRes, jobsRes] = await Promise.all([
        fetch("/api/results"),
        fetch("/api/jobs"),
      ]);
      if (!resultsRes.ok || !jobsRes.ok) throw new Error("load failed");
      const resultsData = await resultsRes.json();
      const jobsData = await jobsRes.json();

      const jobTitles = new Map<number, string>(
        jobsData.jobs.map((job: Job) => [job.id, job.title])
      );

      const sorted = [...resultsData.results].sort(
        (a: ResultRow, b: ResultRow) => b.overallScore - a.overallScore
      );

      setRows(
        sorted.map((result: ResultRow, index: number) => ({
          ...result,
          jobTitle:
            result.jobId !== null
              ? jobTitles.get(result.jobId) ?? "General Interview"
              : "General Interview",
          rank: index + 1,
        }))
      );
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(
    (row) =>
      row.candidateName.toLowerCase().includes(query.toLowerCase()) ||
      row.jobTitle.toLowerCase().includes(query.toLowerCase()) ||
      (row.candidateEmail ?? "").toLowerCase().includes(query.toLowerCase())
  );

  // Stats
  const total = rows.length;
  const shortlisted = rows.filter((r) => r.overallScore >= 80).length;
  const avgScore = total
    ? Math.round(rows.reduce((sum, r) => sum + r.overallScore, 0) / total)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600">
            AI-Ranked Applicants
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Candidates
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review AI-scored applicants across all your jobs.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Candidates</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {total}
              </p>
              <p className="mt-1 text-xs text-slate-400">Interviews completed</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200/60">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Shortlisted</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {shortlisted}
              </p>
              <p className="mt-1 text-xs text-slate-400">Score ≥ 80</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
              <Crown className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Score</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {avgScore}
              </p>
              <p className="mt-1 text-xs text-slate-400">Across all candidates</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <Crown className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Search + Table card */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        {/* Search bar */}
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, job, or email..."
              className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-400 focus:ring-violet-400/20"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {/* Error */}
        {!isLoading && loadError && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-300 bg-rose-50">
              <Inbox className="h-5 w-5 text-rose-600" />
            </div>
            <p className="font-medium text-rose-600">Could not load candidates</p>
            <Button variant="outline" onClick={load}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !loadError && rows.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 ring-1 ring-violet-200/60">
              <Users className="h-6 w-6 text-violet-600" />
            </div>
            <p className="font-semibold text-slate-900">No interview results yet</p>
            <p className="text-sm text-slate-500 max-w-sm">
              When candidates complete an interview, they appear here ranked by AI score.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !loadError && rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="w-16 pl-6">Rank</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied Job</TableHead>
                <TableHead className="text-right">AI Score</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-24 pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const status = statusFor(row.overallScore);
                return (
                  <TableRow
                    key={row.id}
                    className="group border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <TableCell className="pl-6">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${rankBadge(
                          row.rank
                        )}`}
                      >
                        {row.rank <= 3 ? (
                          <Crown className="h-4 w-4" />
                        ) : (
                          `#${row.rank}`
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-1 ring-violet-200/60">
                          <AvatarFallback className="bg-violet-50 text-sm font-semibold text-violet-700">
                            {getInitials(row.candidateName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {row.candidateName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.candidateEmail ?? "No email provided"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {row.jobTitle}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scorePill(
                          row.overallScore
                        )}`}
                      >
                        {row.overallScore}
                        <span className="font-normal opacity-70">/100</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={`rounded-full border-0 ring-1 ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/dashboard/candidates/${row.id}`} />}
                        className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View
                        <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && rows.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        No candidates match your search
                      </p>
                      <p className="text-xs text-slate-500">
                        Try a different name, job, or email.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}