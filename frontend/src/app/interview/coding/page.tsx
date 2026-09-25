"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Play, Send, Terminal, Clock, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";

const problem = {
  title: "1. Two Sum",
  difficulty: "Easy",
  description:
    "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
  ],
  starterCode: {
    javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Write your code here\n    \n}`,
    python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        pass`,
  },
};

export default function CodingInterviewPage() {
  const [jobId, setJobId] = useState<number | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(problem.starterCode.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [output, setOutput] = useState<string[] | null>(null);
  
  const savedRef = useRef(false);

  // Read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get("jobId");
    if (rawId) setJobId(Number(rawId));
    
    const rawName = params.get("name");
    if (rawName) setCandidateName(rawName);

    const rawEmail = params.get("email");
    if (rawEmail) setCandidateEmail(rawEmail);
  }, []);

  // Save to database when finished
  useEffect(() => {
    if (!isFinished || savedRef.current) return;
    savedRef.current = true;

    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        candidateName: candidateName || "Anonymous",
        candidateEmail: candidateEmail || null,
        overallScore: 85, // Mock score for now
        questionScores: [85],
        questions: [problem.title],
        answers: [code], // Save the actual code they wrote!
        evaluations: [{
          score: 85,
          feedback: "Code submitted successfully. Time complexity looks optimal.",
          strengths: ["Clean syntax", "Good variable naming"],
          weaknesses: ["Missing edge case comments"],
          source: "llm"
        }],
      }),
    }).then(() => {
      toast.success("Code submitted & saved!", {
        description: "The recruiter can now view your code on the dashboard."
      });
    });
  }, [isFinished, jobId, candidateName, candidateEmail, code]);

  function handleLanguageChange(newLang: string | null) {
    if (!newLang) return;
    setLanguage(newLang);
    setCode(problem.starterCode[newLang as keyof typeof problem.starterCode]);
    setOutput(null);
  }

  function handleRun() {
    setIsRunning(true);
    setOutput(null);
    setTimeout(() => {
      setOutput([
        "Executing tests...",
        "✓ Test Case 1 passed",
        "✓ Test Case 2 passed",
        "✗ Test Case 3 failed: Expected [0,1], got undefined",
      ]);
      setIsRunning(false);
    }, 1500);
  }

  function handleSubmit() {
    setIsRunning(true);
    setOutput(null);
    setTimeout(() => {
      setOutput([
        "Submitting to AI evaluator...",
        "AI Review: Time complexity is O(n).",
        "Final Score: 85/100",
      ]);
      setIsRunning(false);
      setIsFinished(true); // Triggers the save to DB!
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3 bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/candidate" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Coding Interview</h1>
            <p className="text-xs text-muted-foreground">
              {candidateName || "Candidate"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            45:00
          </span>

          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning || isFinished} className="gap-2">
            {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Run
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isRunning || isFinished} className="gap-2">
            <Send className="h-3 w-3" />
            Submit
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-6 overflow-y-auto border-r">
          <h2 className="text-2xl font-bold mb-2">{problem.title}</h2>
          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mb-4">
            {problem.difficulty}
          </span>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {problem.description}
          </p>
          <h3 className="text-sm font-semibold mb-2">Example 1:</h3>
          <Card className="bg-muted/50 mb-6">
            <CardContent className="p-4 text-xs font-mono space-y-2">
              <div><span className="text-muted-foreground">Input:</span> {problem.examples[0].input}</div>
              <div><span className="text-muted-foreground">Output:</span> {problem.examples[0].output}</div>
              <div><span className="text-muted-foreground">Explanation:</span> {problem.examples[0].explanation}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col h-[calc(100vh-65px)] lg:h-auto">
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="100%"
              language={language === "javascript" ? "javascript" : "python"}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
            />
          </div>
          <div className="h-48 border-t bg-zinc-900 text-zinc-100 p-4 overflow-y-auto font-mono text-xs">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Terminal className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider">Console</span>
            </div>
            {isRunning && <p className="text-zinc-500">Running...</p>}
            {output === null && !isRunning && <p className="text-zinc-500">Click &quot;Run&quot; to test your code.</p>}
            {output && output.map((line, i) => (
              <p key={i} className={line.includes("✗") ? "text-red-400" : line.includes("✓") ? "text-green-400" : "text-zinc-300"}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}