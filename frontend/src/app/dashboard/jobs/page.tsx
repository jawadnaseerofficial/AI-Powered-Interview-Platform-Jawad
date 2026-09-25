"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Briefcase,
  Code,
  ListChecks,
  Loader2,
  MessageSquare,
  Mic,
  MoreVertical,
  PlusCircle,
  Sparkles,
  Archive,
  Users,
  CheckCircle2,
} from "lucide-react";
import { generateQuestions } from "@/lib/api";

type Job = {
  id: number;
  title: string;
  description: string;
  techStack: string[];
  status: string;
  interviewType: "questions" | "audio" | "coding";
  questions: string[];
  createdAt: string;
};

const interviewTypes = [
  { id: "questions", label: "Questions", desc: "AI text Q&A (30 questions)", icon: MessageSquare, tone: "violet", count: 30 },
  { id: "audio", label: "Audio Call", desc: "Voice interview (20 questions)", icon: Mic, tone: "rose", count: 20 },
  { id: "coding", label: "Coding", desc: "Live code editor (15 questions)", icon: Code, tone: "emerald", count: 15 },
] as const;

const toneStyles: Record<string, string> = {
  violet: "bg-violet-50 text-violet-600 ring-violet-200/60",
  rose: "bg-rose-50 text-rose-600 ring-rose-200/60",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
  amber: "bg-amber-50 text-amber-600 ring-amber-200/60",
};

const badgeStyles: Record<string, string> = {
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const interviewTypeLabels: Record<Job["interviewType"], string> = {
  questions: "Questions",
  audio: "Audio Call",
  coding: "Coding",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [open, setOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [techStack, setTechStack] = useState("");
  const [description, setDescription] = useState("");
  const [interviewType, setInterviewType] =
    useState<Job["interviewType"]>("questions");

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to load jobs");
      const data = await response.json();
      setJobs(data.jobs);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      const techList = techStack
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);

      // Get question count based on interview type
      const typeConfig = interviewTypes.find((t) => t.id === interviewType);
      const numQuestions = typeConfig?.count || 30;

      const ai = await generateQuestions({
        job_title: title.trim(),
        job_description: description.trim(),
        tech_stack: techList,
        interview_type: interviewType,
        cv_summary: "No candidate yet — generate general role-specific questions.",
        num_questions: numQuestions,
      });

      // Handle AI errors
      if (!ai.questions || ai.questions.length === 0) {
        toast.error("AI could not generate questions", {
          description: ai.message || "Please try again later.",
        });
        setIsCreating(false);
        return;
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          techStack: techList,
          interviewType,
          questions: ai.questions,
        }),
      });

      if (!response.ok) throw new Error("Failed to save job");

      toast.success("Job created", {
        description: `AI generated ${ai.questions.length} personalized questions.`,
      });

      setTitle("");
      setTechStack("");
      setDescription("");
      setInterviewType("questions");
      setOpen(false);
      await loadJobs();
    } catch {
      toast.error("Could not create job", {
        description: "Check that the backend and database are reachable.",
      });
    } finally {
      setIsCreating(false);
    }
  }

  function openQuestions(job: Job) {
    setSelectedJob(job);
    setQuestionsOpen(true);
  }

  // Stats derived from real jobs
  const totalJobs = jobs.length;
  const openCount = jobs.filter((j) => j.status === "Open").length;
  const closedCount = jobs.filter((j) => j.status === "Closed").length;
  const aiQuestionsCount = jobs.reduce((sum, j) => sum + j.questions.length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600">
            Recruiter Workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your open positions and track applicants across every pipeline.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="shadow-md shadow-violet-600/20"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Jobs", value: totalJobs, hint: "All positions", icon: Briefcase, tone: "violet" },
          { label: "Open", value: openCount, hint: "Accepting applicants", icon: CheckCircle2, tone: "emerald" },
          { label: "Closed", value: closedCount, hint: "No longer hiring", icon: Archive, tone: "rose" },
          { label: "AI Questions", value: aiQuestionsCount, hint: "Generated by AI", icon: Sparkles, tone: "amber" },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                    toneStyles[stat.tone as keyof typeof toneStyles] ?? toneStyles.violet
                  }`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl border-slate-200/60">
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="mt-3 h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && loadError && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-rose-500/40 bg-rose-50/50 p-16 text-center">
          <p className="font-medium text-rose-600">Could not load jobs</p>
          <p className="text-sm text-slate-500">
            Check your database connection and try again.
          </p>
          <Button variant="outline" onClick={loadJobs}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !loadError && jobs.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 ring-1 ring-violet-200/60">
            <Briefcase className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">No jobs yet</p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Create your first job and the AI will generate interview questions for it in seconds.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="shadow-md shadow-violet-600/20">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      )}

      {/* Jobs grid */}
      {!isLoading && !loadError && jobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const typeConfig = interviewTypes.find((t) => t.id === job.interviewType) ?? interviewTypes[0];
            const Icon = typeConfig.icon;
            return (
              <Card
                key={job.id}
                className="group flex flex-col overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                          toneStyles[typeConfig.tone]
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg font-semibold text-slate-900">
                          {job.title}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 text-xs">
                          {job.description || "No description provided."}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {job.techStack.length === 0 ? (
                      <span className="text-xs text-slate-400">No tech stack</span>
                    ) : (
                      job.techStack.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                        >
                          {tech}
                        </span>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openQuestions(job)}
                    className="flex w-fit items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {job.questions.length} AI questions
                  </button>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          job.status === "Open"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                            : "bg-slate-100 text-slate-600 ring-slate-200/60"
                        }`}
                      >
                        {job.status}
                      </span>
                      <Badge
                        variant="outline"
                        className={badgeStyles[typeConfig.tone]}
                      >
                        {interviewTypeLabels[job.interviewType]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(job.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Job Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-violet-600" />
              Create a new job
            </DialogTitle>
            <DialogDescription>
              Define the role and how the AI should interview candidates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="job-title" className="text-sm font-medium">
                Job Title
              </Label>
              <Input
                id="job-title"
                placeholder="e.g. Senior React Developer"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-tech" className="text-sm font-medium">
                Tech Stack
              </Label>
              <Input
                id="job-tech"
                placeholder="React, Next.js, Tailwind CSS"
                value={techStack}
                onChange={(event) => setTechStack(event.target.value)}
                className="h-10"
              />
              <p className="text-xs text-slate-500">Comma-separated list of technologies.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-desc" className="text-sm font-medium">
                Job Description
              </Label>
              <Textarea
                id="job-desc"
                placeholder="Describe responsibilities, requirements, expectations..."
                className="min-h-24 resize-none"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Interview Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {interviewTypes.map((type) => {
                  const Icon = type.icon;
                  const selected = interviewType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setInterviewType(type.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm transition ${
                        selected
                          ? "border-violet-500 bg-violet-500/5 text-violet-700 ring-2 ring-violet-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${
                          selected
                            ? "bg-violet-500 text-white ring-violet-500"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{type.label}</span>
                      <span className="text-[10px] text-slate-500">
                        {type.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || isCreating}
                className="shadow-md shadow-violet-600/20"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating AI questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Job
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Questions Dialog */}
      <Dialog open={questionsOpen} onOpenChange={setQuestionsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-violet-600" />
              AI Interview Questions
            </DialogTitle>
            <DialogDescription>
              Generated for <span className="font-semibold text-slate-900">{selectedJob?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <ol className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
            {selectedJob && selectedJob.questions.length > 0 ? (
              selectedJob.questions.map((question, index) => (
                <li
                  key={index}
                  className="flex gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-violet-300 hover:shadow-md"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600 ring-1 ring-violet-200/60">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-slate-700">
                    {question}
                  </p>
                </li>
              ))
            ) : (
              <li className="py-8 text-center text-sm text-slate-500">
                No questions generated for this job yet.
              </li>
            )}
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  );
}