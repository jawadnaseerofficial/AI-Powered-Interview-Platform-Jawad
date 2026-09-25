"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { generateQuestions, parseCV, type CVParseResponse } from "@/lib/api";

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

const interviewTypeLabels: Record<Job["interviewType"], string> = {
  questions: "Questions",
  audio: "Audio Call",
  coding: "Coding",
};

const QUESTION_COUNTS: Record<Job["interviewType"], number> = {
  questions: 30,
  coding: 15,
  audio: 20,
};

export default function CandidatePortal() {
  const router = useRouter();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<CVParseResponse | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to load jobs");
      const data = await response.json();
      setJobs(data.jobs.filter((job: Job) => job.status === "Open"));
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function processFile(file: File) {
    setCvFile(file);
    setIsParsing(true);
    setParsedData(null);
    try {
      const data = await parseCV(file);
      setParsedData(data);
      if (data.source === "llm" && data.name) {
        toast.success("CV Analyzed by AI", {
          description: `Welcome, ${data.name}! We found your details.`,
        });
      } else {
        toast.info("CV Uploaded", {
          description: "Please enter your details manually in the next step.",
        });
      }
    } catch {
      toast.error("Could not parse CV", {
        description: "You can still apply, just fill in your details manually.",
      });
    } finally {
      setIsParsing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  async function handleApply(job: Job) {
    if (!cvFile) {
      toast.error("Upload your CV first", {
        description: "We need your resume to personalize the AI questions.",
      });
      return;
    }

    setApplyingJobId(job.id);

    try {
      const numQuestions = QUESTION_COUNTS[job.interviewType];

      // Build CV summary from parsed data
      const cvSummary =
        parsedData?.skills && parsedData.skills.length > 0
          ? `Candidate's known skills: ${parsedData.skills.join(", ")}. Name: ${parsedData.name || "Not provided"}. Tailor follow-ups to their background.`
          : "No detailed CV parsed. Ask broadly about their background and the role.";

      toast.info("AI is personalizing your interview...", {
        description: `Generating ${numQuestions} questions based on your CV and this role.`,
      });

      const ai = await generateQuestions({
        job_title: job.title,
        job_description: job.description,
        tech_stack: job.techStack,
        interview_type: job.interviewType,
        cv_summary: cvSummary,
        num_questions: numQuestions,
      });

      // Handle AI errors gracefully
      if (!ai.questions || ai.questions.length === 0) {
        toast.error("AI could not generate questions", {
          description: ai.message || "Please try again later.",
        });
        setApplyingJobId(null);
        return;
      }

      // Store personalized questions in sessionStorage for the interview room
      sessionStorage.setItem(
        `interview_session_${job.id}`,
        JSON.stringify({
          questions: ai.questions,
          candidateName: parsedData?.name || "",
          candidateEmail: parsedData?.email || "",
          source: ai.source,
        })
      );

      toast.success("Interview ready!", {
        description: `AI generated ${ai.questions.length} personalized questions.`,
      });

      // Build URL with parsed data
      const params = new URLSearchParams();
      params.set("jobId", job.id.toString());
      if (parsedData?.name) params.set("name", parsedData.name);
      if (parsedData?.email) params.set("email", parsedData.email);

      setTimeout(() => {
        if (job.interviewType === "coding") {
          router.push(`/interview/coding?${params.toString()}`);
        } else if (job.interviewType === "audio") {
          router.push(`/interview/audio?${params.toString()}`);
        } else {
          router.push(`/interview?${params.toString()}`);
        }
      }, 800);
    } catch {
      toast.error("Could not prepare interview", {
        description: "Check the backend is running and try again.",
      });
    } finally {
      setApplyingJobId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
            <Sparkles className="h-4 w-4" />
            Candidate Portal
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Find your next role.
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upload your resume, apply to open roles, and interview with AI.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - CV Upload */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-dashed border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload your CV
                </CardTitle>
                <CardDescription>
                  The AI will read this to ask you personalized questions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                      <p className="font-medium">AI is reading your CV...</p>
                    </div>
                  ) : cvFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                      <div>
                        <p className="font-semibold">{cvFile.name}</p>
                        {parsedData?.name && (
                          <p className="text-sm text-violet-600 dark:text-violet-400 font-medium mt-1">
                            Hello, {parsedData.name}!
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCvFile(null);
                          setParsedData(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          Drag & drop your PDF here
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or click to browse files
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleFileChange}
                    disabled={isParsing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Open Jobs from Database */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Briefcase className="h-5 w-5" /> Open Positions
            </h2>

            {isLoading && (
              <>
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </>
            )}

            {!isLoading && loadError && (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-rose-500/40 bg-rose-500/5 p-12 text-center">
                <p className="font-medium text-rose-600 dark:text-rose-400">
                  Could not load open positions
                </p>
                <Button variant="outline" onClick={loadJobs}>
                  Retry
                </Button>
              </div>
            )}

            {!isLoading && !loadError && jobs.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No open positions right now</p>
                <p className="text-sm text-muted-foreground">
                  Check back soon — new roles appear here instantly.
                </p>
              </div>
            )}

            {!isLoading &&
              !loadError &&
              jobs.length > 0 &&
              jobs.map((job) => {
                const isApplying = applyingJobId === job.id;
                return (
                  <Card
                    key={job.id}
                    className="overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {job.description || "No description provided."}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                        >
                          {interviewTypeLabels[job.interviewType]} •{" "}
                          {QUESTION_COUNTS[job.interviewType]} questions
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                      <div className="flex flex-wrap gap-2">
                        {job.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleApply(job)}
                        className="gap-2"
                        disabled={!cvFile || isParsing || isApplying}
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            AI personalizing...
                          </>
                        ) : (
                          <>Apply & Start Interview</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      </div>
    </main>
  );
}