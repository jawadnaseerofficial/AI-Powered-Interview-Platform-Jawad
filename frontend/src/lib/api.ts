const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TIMEOUT_MS = 30000; // 30 second timeout for AI calls

// =====================================================
// Types
// =====================================================

export type QuestionRequest = {
  job_title: string;
  job_description: string;
  tech_stack: string[];
  interview_type: string;
  cv_summary?: string;
  num_questions?: number;
};

export type QuestionResponse = {
  questions: string[];
  source: string;
  message?: string;
};

export type EvaluateRequest = {
  job_title: string;
  question: string;
  answer: string;
};

export type Evaluation = {
  score: number;
  dimensions: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  source: string;
};

export type CVParseResponse = {
  name: string;
  email: string;
  skills: string[];
  source: string;
};

// =====================================================
// Secure Fetch with Timeout
// =====================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: "include",
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =====================================================
// API Functions
// =====================================================

export async function generateQuestions(
  payload: QuestionRequest
): Promise<QuestionResponse> {
  const response = await fetchWithTimeout(`${API_URL}/ai/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 429) {
    throw new Error("Too many requests. Please wait a moment before trying again.");
  }

  if (response.status === 413) {
    throw new Error("Request too large.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `AI service error: ${response.status}`
    );
  }

  return (await response.json()) as QuestionResponse;
}

export async function evaluateAnswer(
  payload: EvaluateRequest
): Promise<Evaluation> {
  const response = await fetchWithTimeout(`${API_URL}/ai/evaluate-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 429) {
    throw new Error("Too many requests. Please wait a moment before trying again.");
  }

  if (!response.ok) {
    throw new Error(`AI service error: ${response.status}`);
  }

  return (await response.json()) as Evaluation;
}

export async function parseCV(file: File): Promise<CVParseResponse> {
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  // Validate file type
  const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    throw new Error("Invalid file type. Please upload a PDF or Word document.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(`${API_URL}/ai/parse-cv`, {
    method: "POST",
    body: formData,
  });

  if (response.status === 429) {
    throw new Error("Too many CV uploads. Please wait a moment.");
  }

  if (response.status === 413) {
    throw new Error("File too large.");
  }

  if (!response.ok) {
    throw new Error("Failed to parse CV");
  }

  return (await response.json()) as CVParseResponse;
}