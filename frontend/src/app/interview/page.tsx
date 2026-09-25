"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
} from "lucide-react";
import { evaluateAnswer, type Evaluation } from "@/lib/api";

const FALLBACK_QUESTIONS = [
  "Tell me about a project where you used React and Next.js. What was your exact role?",
  "How would you optimize a slow-loading page in a Next.js application?",
  "Describe a time you disagreed with a teammate about a technical decision. How did you resolve it?",
];

const TOTAL_SECONDS = 10 * 60;

type Stage = "intro" | "question" | "thinking" | "feedback" | "finished";

export default function InterviewPage() {
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState("Senior Frontend Engineer");
  const [questions, setQuestions] = useState<string[]>(FALLBACK_QUESTIONS);

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [stage, setStage] = useState<Stage>("intro");
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<(Evaluation | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const savedRef = useRef(false);

  // Read ?jobId=, ?name=, ?email= from the URL (Auto-fill from CV parser)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const rawId = params.get("jobId");
    if (rawId) {
      const id = Number(rawId);
      if (!Number.isNaN(id)) setJobId(id);
    }

    const rawName = params.get("name");
    if (rawName) setCandidateName(rawName);

    const rawEmail = params.get("email");
    if (rawEmail) setCandidateEmail(rawEmail);
  }, []);

  // Load the job and its saved AI questions
  useEffect(() => {
    if (jobId === null) return;
    fetch(`/api/jobs/${jobId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.job) {
          setJobTitle(data.job.title);
          if (
            Array.isArray(data.job.questions) &&
            data.job.questions.length > 0
          ) {
            setQuestions(data.job.questions.slice(0, 5));
          }
        }
      })
      .catch(() => {
        // silently keep fallback questions
      });
  }, [jobId]);

  // Countdown timer
  useEffect(() => {
    if (stage !== "question" && stage !== "thinking" && stage !== "feedback")
      return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Auto-finish when time runs out
  useEffect(() => {
    if (secondsLeft === 0 && stage !== "intro" && stage !== "finished") {
      setStage("finished");
    }
  }, [secondsLeft, stage]);

  // Save results exactly once when finished
  useEffect(() => {
    if (stage !== "finished" || savedRef.current || answers.length === 0)
      return;
    savedRef.current = true;

    const scored = evaluations.filter((e): e is Evaluation => e !== null);
    const overall = scored.length
      ? Math.round(
          scored.reduce((sum, e) => sum + e.score, 0) / scored.length
        )
      : 0;

    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        candidateName: candidateName.trim() || "Anonymous",
        candidateEmail: candidateEmail.trim() || null,
        overallScore: overall,
        questionScores: evaluations.map((e) => (e ? e.score : 0)),
        questions,
        answers,
        evaluations,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("save failed");
        toast.success("Results saved", {
          description: "Your scorecard is now visible to the recruiter.",
        });
      })
      .catch(() => {
        toast.error("Could not save results", {
          description: "Your scores remain visible only in this session.",
        });
      });
  }, [stage, evaluations, answers, jobId, candidateName, candidateEmail, questions]);

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (total % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function startInterview() {
    if (!candidateName.trim() || !candidateEmail.includes("@")) return;
    savedRef.current = false;
    setStage("question");
    setCurrent(0);
    setAnswers([]);
    setEvaluations([]);
    setSecondsLeft(TOTAL_SECONDS);
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    const currentAnswer = answer.trim();
    setAnswers((prev) => [...prev, currentAnswer]);
    setAnswer("");
    setStage("thinking");

    try {
      const evaluation = await evaluateAnswer({
        job_title: jobTitle,
        question: questions[current],
        answer: currentAnswer,
      });
      setEvaluations((prev) => [...prev, evaluation]);
    } catch {
      setEvaluations((prev) => [...prev, null]);
      toast.error("Evaluation service unreachable", {
        description: "Continuing without AI scoring for this answer.",
      });
    }
    setStage("feedback");
  }

  function continueInterview() {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      setStage("question");
    } else {
      setStage("finished");
    }
  }

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const latestEvaluation = evaluations[evaluations.length - 1] ?? null;
  const scored = evaluations.filter((e): e is Evaluation => e !== null);
  const overall = scored.length
    ? Math.round(scored.reduce((sum, e) => sum + e.score, 0) / scored.length)
    : null;

  const emailValid = candidateEmail.includes("@");

  const topBar = (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Question {current + 1} of {questions.length}
        </p>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            secondsLeft < 60
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatTime(secondsLeft)}
        </span>
      </div>
      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-violet-600 transition-all duration-500"
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>
    </>
  );

  // ---------- INTRO ----------
  if (stage === "intro") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-2xl">AI Interview — {jobTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">
              An AI interviewer will ask you {questions.length} questions and
              score each answer live.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidate-name">Your Full Name</Label>
              <Input
                id="candidate-name"
                placeholder="e.g. Ayesha Khan"
                value={candidateName}
                onChange={(event) => setCandidateName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-email">Email Address</Label>
              <Input
                id="candidate-email"
                type="email"
                placeholder="you@example.com"
                value={candidateEmail}
                onChange={(event) => setCandidateEmail(event.target.value)}
              />
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• You have {TOTAL_SECONDS / 60} minutes in total.</li>
              <li>• After each answer you will see AI feedback.</li>
              <li>• You cannot return to a previous question.</li>
            </ul>
            <Button
              className="w-full"
              onClick={startInterview}
              disabled={!candidateName.trim() || !emailValid}
            >
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ---------- FINISHED ----------
  if (stage === "finished") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-xl">
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            <div>
              <h1 className="text-2xl font-bold">Interview Complete!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {candidateName || "Anonymous"} — you answered {answers.length}{" "}
                of {questions.length} questions.
              </p>
            </div>

            <div>
              <div className="text-6xl font-bold text-violet-600 dark:text-violet-400">
                {overall !== null ? overall : "—"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Overall AI Score
              </p>
            </div>

            <div className="w-full space-y-2 text-left">
              {questions.map((question, index) => {
                const evaluation = evaluations[index];
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="truncate pr-4 text-muted-foreground">
                      Q{index + 1}: {question}
                    </span>
                    <span className="font-semibold">
                      {evaluation ? evaluation.score : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <Button render={<Link href="/candidate" />}>
              Back to Candidate Portal
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ---------- FEEDBACK ----------
  if (stage === "feedback") {
    const score = latestEvaluation?.score ?? null;
    const scoreColor =
      score === null
        ? "text-slate-400"
        : score >= 75
        ? "text-green-600 dark:text-green-400"
        : score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {topBar}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                AI Feedback — Question {current + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className={`text-5xl font-bold ${scoreColor}`}>
                  {score !== null ? score : "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {latestEvaluation?.source === "fallback"
                    ? "Fallback scoring (AI unavailable)"
                    : "Scored by Gemini"}
                </div>
              </div>

              {latestEvaluation && (
                <>
                  <p className="text-sm leading-relaxed">
                    {latestEvaluation.feedback}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      {latestEvaluation.strengths.map((item, index) => (
                        <div key={index} className="flex gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {latestEvaluation.weaknesses.map((item, index) => (
                        <div key={index} className="flex gap-2 text-sm">
                          <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button onClick={continueInterview} className="w-full">
                {current + 1 < questions.length
                  ? "Next Question"
                  : "Finish Interview"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // ---------- QUESTION / THINKING ----------
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        {topBar}

        {stage === "thinking" ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Bot className="h-10 w-10 animate-pulse text-violet-600 dark:text-violet-400" />
              <p className="font-medium">Gemini is evaluating your answer...</p>
              <p className="text-sm text-muted-foreground">
                Analyzing clarity, depth and relevance.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {questions[current]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your answer here..."
                className="min-h-40"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {wordCount} words
                </p>
                <Button onClick={submitAnswer} disabled={!answer.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}