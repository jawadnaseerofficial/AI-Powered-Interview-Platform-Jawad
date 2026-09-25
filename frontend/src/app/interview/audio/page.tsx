"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, PhoneOff, Bot } from "lucide-react";
import { toast } from "sonner";

const questions = [
  "Welcome to the audio interview. Let's start with a simple introduction. Can you tell me about your journey in software engineering?",
  "That's great to hear. How do you handle tight deadlines when multiple critical bugs appear at the same time?",
  "Finally, describe a technical concept to me as if I were a non-technical product manager.",
];

export default function AudioInterviewPage() {
  const [jobId, setJobId] = useState<number | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [allTranscripts, setAllTranscripts] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  const savedRef = useRef(false);
  // @ts-ignore
  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const recognitionRef = useRef<any>(null);

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
    if (!isFinished || savedRef.current || allTranscripts.length === 0) return;
    savedRef.current = true;

    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        candidateName: candidateName || "Anonymous",
        candidateEmail: candidateEmail || null,
        overallScore: 88, // Mock score for audio
        questionScores: [88],
        questions: ["Audio Interview Transcript"],
        answers: allTranscripts, // Save everything they said!
        evaluations: [{
          score: 88,
          feedback: "Candidate communicated clearly and provided good examples.",
          strengths: ["Clear voice", "Good pacing", "Relevant examples"],
          weaknesses: ["Could elaborate more on technical depth"],
          source: "llm"
        }],
      }),
    }).then(() => {
      toast.success("Audio Interview Saved!", {
        description: "The recruiter can now read your transcript on the dashboard."
      });
    });
  }, [isFinished, jobId, candidateName, candidateEmail, allTranscripts]);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        setTranscript((prev) => prev + finalTranscript);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  function handleNext() {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Save this answer to the array
    setAllTranscripts((prev) => [...prev, transcript || "No answer provided."]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTranscript("");
    } else {
      setIsFinished(true); // Triggers the save to DB!
    }
  }

  function handleEnd() {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (transcript) {
       setAllTranscripts((prev) => [...prev, transcript]);
    }
    setIsFinished(true); // Triggers the save to DB!
  }

  if (isFinished) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6">
        <Card className="w-full max-w-xl bg-slate-900/50 border-slate-800 text-white">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <PhoneOff className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold">Interview Complete!</h1>
            <p className="text-sm text-slate-400">
              Your audio responses have been recorded and saved for the recruiter.
            </p>
            <Button render={<Link href="/candidate" />} className="bg-white text-slate-900 hover:bg-slate-200">
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/candidate" />} className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Audio Interview</h1>
            <p className="text-xs text-slate-400">{candidateName || "Candidate"}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleEnd} className="gap-2 bg-rose-600 hover:bg-rose-700">
          <PhoneOff className="h-3 w-3" /> End Interview
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="relative mb-10">
          <div className={`absolute inset-0 rounded-full bg-violet-500 blur-3xl opacity-20 ${isListening ? 'animate-pulse' : ''}`} />
          <div className={`relative flex h-40 w-40 items-center justify-center rounded-full border-4 transition-all duration-500 ${
            isListening ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_60px_rgba(244,63,94,0.3)]' : 'border-violet-500 bg-violet-500/10 shadow-[0_0_60px_rgba(139,92,246,0.2)]'
          }`}>
            {isListening ? <Mic className="h-16 w-16 text-rose-400" /> : <Bot className="h-16 w-16 text-violet-400" />}
          </div>
        </div>

        <div className="mb-8 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <h2 className="text-2xl font-medium leading-relaxed text-slate-100 md:text-3xl">
            {questions[currentQuestion]}
          </h2>
        </div>

        <div className="mb-8 h-32 w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Live Transcript</p>
          {transcript ? (
            <p className="text-sm leading-relaxed text-slate-300">{transcript}</p>
          ) : (
            <p className="text-sm italic text-slate-600">
              {isListening ? "Listening... start speaking." : "Click the microphone to start answering."}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6">
          <Button
            size="lg"
            onClick={toggleListening}
            className={`h-16 w-16 rounded-full p-0 transition-all ${
              isListening ? 'bg-rose-600 hover:bg-rose-700 shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 'bg-violet-600 hover:bg-violet-700 shadow-[0_0_30px_rgba(139,92,246,0.3)]'
            }`}
          >
            {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {transcript && !isListening && (
            <Button size="lg" onClick={handleNext} className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-200">
              {currentQuestion === questions.length - 1 ? "Finish Interview" : "Next Question"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}