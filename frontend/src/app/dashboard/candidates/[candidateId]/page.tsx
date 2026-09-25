import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Users,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { interviewResults, jobs } from "@/lib/db/schema";
import { getCurrentCompany } from "@/lib/company";

type StoredEvaluation = {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  source: string;
} | null;

function scoreBadgeClass(score: number | null) {
  if (score === null)
    return "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-300";
  if (score >= 75)
    return "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400";
  if (score >= 50)
    return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400";
}

export default async function ScorecardPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const id = Number(candidateId);
  const company = await getCurrentCompany();

  const result =
    !company || Number.isNaN(id)
      ? undefined
      : await db
          .select()
          .from(interviewResults)
          .where(
            and(
              eq(interviewResults.id, id),
              eq(interviewResults.companyId, company.id)
            )
          )
          .then((rows) => rows[0]);

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Scorecard not found</p>
        <p className="text-sm text-muted-foreground">
          This interview result does not exist in your workspace.
        </p>
        <Button
          variant="outline"
          render={<Link href="/dashboard/candidates" />}
        >
          Back to Candidates
        </Button>
      </div>
    );
  }

  const job =
    result.jobId !== null
      ? await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, result.jobId))
          .then((rows) => rows[0])
      : undefined;

  const questionList =
    result.questions.length > 0
      ? result.questions
      : result.answers.map((_, index) => `Question ${index + 1}`);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/dashboard/candidates" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {result.candidateName}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {result.candidateEmail ?? "No email provided"}
            {" • "}
            {job?.title ?? "General Interview"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: overall score */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall AI Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-violet-500/20">
                <span className="text-4xl font-bold">
                  {result.overallScore}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {new Date(result.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: question-by-question AI analysis */}
        <div className="space-y-6 lg:grid-cols-1 lg:col-span-2">
          {questionList.map((question, index) => {
            const evaluation: StoredEvaluation =
              result.evaluations[index] ?? null;
            const score =
              evaluation?.score ?? result.questionScores[index] ?? null;

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base leading-relaxed">
                      Q{index + 1}: {question}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={scoreBadgeClass(score)}
                    >
                      {score !== null ? `${score}/100` : "—"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evaluation && (
                    <>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {evaluation.feedback}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          {evaluation.strengths.map((item, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {evaluation.weaknesses.map((item, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Candidate Answer
                    </p>
                    <p className="text-sm leading-relaxed">
                      {result.answers[index] || "No answer recorded."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}