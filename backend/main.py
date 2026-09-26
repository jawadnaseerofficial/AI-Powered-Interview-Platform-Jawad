import json
import os
import time

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel
from pypdf import PdfReader
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import io

# =====================================================
# App Setup
# =====================================================

app = FastAPI(title="AI Interview Platform API", version="0.7.0")

# Production-safe origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    # Add your Vercel domain after deployment:
    # "https://your-app.vercel.app",
]

# =====================================================
# CORS Middleware
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    expose_headers=["X-Request-ID"],
    max_age=600,
)

# =====================================================
# Security Headers Middleware
# =====================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains"
        )
        # Hide server info
        if "server" in response.headers:
            del response.headers["server"]
        return response

app.add_middleware(SecurityHeadersMiddleware)

# =====================================================
# CSRF Middleware (Origin validation)
# =====================================================

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only check state-changing methods
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            origin = request.headers.get("origin")

            # Allow requests with no origin (same-origin fetch, mobile apps, Postman)
            if origin and origin not in ALLOWED_ORIGINS:
                return JSONResponse(
                    status_code=403,
                    content={"error": "Origin not allowed"},
                )

        return await call_next(request)

app.add_middleware(CSRFMiddleware)

# =====================================================
# Request Size Limit Middleware
# =====================================================

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
        return JSONResponse(
            status_code=413,
            content={"error": "Request too large (max 10MB)"},
        )
    return await call_next(request)

# =====================================================
# Rate Limiting
# =====================================================

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Too many requests",
            "message": "Please wait a moment before trying again.",
            "retry_after": exc.detail,
        },
    )

# =====================================================
# Gemini Setup
# =====================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-3.6-flash"

client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

# =====================================================
# Models
# =====================================================

class QuestionRequest(BaseModel):
    job_title: str
    job_description: str
    tech_stack: list[str] = []
    interview_type: str = "questions"
    cv_summary: str = ""
    num_questions: int = 30


class QuestionResponse(BaseModel):
    questions: list[str]
    source: str
    message: str = ""


class EvaluateRequest(BaseModel):
    job_title: str
    question: str
    answer: str


class EvaluateResponse(BaseModel):
    score: int
    dimensions: dict[str, int]
    strengths: list[str]
    weaknesses: list[str]
    feedback: str
    source: str


class CVParseResponse(BaseModel):
    name: str
    email: str
    skills: list[str]
    source: str

# =====================================================
# Fallbacks
# =====================================================

def fallback_evaluation(request: EvaluateRequest) -> EvaluateResponse:
    words = len(request.answer.split())
    score = 40 if words < 15 else min(85, 55 + words // 5)
    return EvaluateResponse(
        score=score,
        dimensions={
            "technical_accuracy": score,
            "communication": score,
            "relevance": score,
        },
        strengths=["Answered within the time limit."],
        weaknesses=["Fallback heuristic used — no deep AI analysis available."],
        feedback="The AI evaluation service was unavailable, so a basic length-based score was applied.",
        source="fallback",
    )

# =====================================================
# Routes
# =====================================================

@app.get("/")
def read_root():
    return {"status": "ok", "service": "AI Interview Platform Backend"}


@app.get("/health")
def health_check():
    return {
        "message": "FastAPI is running and ready for AI!",
        "llm_connected": client is not None,
    }


@app.post("/ai/parse-cv", response_model=CVParseResponse)
@limiter.limit("5/minute")
async def parse_cv(request: Request, file: UploadFile = File(...)):
    if client is None:
        return CVParseResponse(name="", email="", skills=[], source="fallback")

    try:
        reader = PdfReader(io.BytesIO(await file.read()))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""

        text = text.strip()
        if not text:
            raise ValueError("No text found in PDF")

        prompt = f"""You are an expert resume parser.
Extract the candidate's full name, email address, and top 5 technical skills from this resume text.
If a field is missing, return an empty string or empty list.

Resume Text:
{text[:4000]}

Return ONLY a JSON object in this exact shape:
{{"name": "Full Name", "email": "email@example.com", "skills": ["Skill1", "Skill2"]}}
"""
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        data = json.loads(response.text)

        return CVParseResponse(
            name=data.get("name", ""),
            email=data.get("email", ""),
            skills=data.get("skills", []),
            source="llm",
        )
    except Exception as e:
        print("CV Parse Error:", e)
        return CVParseResponse(name="", email="", skills=[], source="fallback")


@app.post("/ai/generate-questions", response_model=QuestionResponse)
@limiter.limit("10/minute")
async def generate_questions(request: Request, req: QuestionRequest):
    num = max(5, min(50, req.num_questions))

    if client is None:
        return QuestionResponse(
            questions=[],
            source="unavailable",
            message="AI service not configured. Cannot generate personalized questions.",
        )

    tech_stack = ", ".join(req.tech_stack) or "Not specified"
    cv_context = req.cv_summary.strip() or "No candidate background provided — ask broadly about their experience and the role."

    if req.interview_type == "coding":
        style_guide = """This is a CODING interview. Focus on:
- Problem solving and algorithmic thinking
- Code design, readability, and trade-offs
- Debugging scenarios and edge cases
- System design for smaller components
- Code review mindset
Avoid pure trivia. Prefer "how would you design...", "walk me through your approach...", "debug this scenario..." style questions."""
        topic_mix = "Balance: 40% problem-solving, 30% code design, 20% debugging, 10% tooling."
    elif req.interview_type == "audio":
        style_guide = """This is an AUDIO / voice interview. Questions must be:
- Conversational and natural to speak aloud
- Open-ended to allow rich verbal answers
- Focused on communication, leadership, conflict resolution, career goals
- Warm and professional, like a senior manager chatting
Avoid hyper-technical syntax questions. Prefer situational and behavioral questions."""
        topic_mix = "Balance: 40% behavioral, 30% communication, 20% leadership/teamwork, 10% career vision."
    else:
        style_guide = """This is a standard QUESTIONS interview (text). Mix:
- Technical depth specific to the tech stack
- Behavioral and situational questions
- Problem-solving and architecture discussions
- Past project deep-dives
- Culture and collaboration fit
Vary the difficulty: warm-up → moderate → deep probe."""
        topic_mix = "Balance: 35% technical, 25% behavioral, 20% problem-solving, 10% projects, 10% culture."

    prompt = f"""You are an elite senior interviewer at a top-tier company known for exceptional hiring decisions.
Your style is professional, warm, curious, and probing — you ask follow-ups that reveal depth, not surface answers.

Generate EXACTLY {num} DISTINCT, high-quality interview questions.

=== ROLE ===
Title: {req.job_title}
Description: {req.job_description}
Tech Stack: {tech_stack}

=== CANDIDATE BACKGROUND ===
{cv_context}

=== INTERVIEW TYPE ===
{req.interview_type}

=== STYLE GUIDE ===
{style_guide}

=== TOPIC MIX ===
{topic_mix}

=== STRICT RULES ===
- Generate EXACTLY {num} questions. No more, no less.
- Each question must be SPECIFIC to this role, this tech stack, and this candidate's background.
- Reference the candidate's skills when relevant (e.g., "Given your experience with X, ...").
- No generic questions like "What are your strengths?" unless deeply contextualized.
- No duplicate or near-duplicate questions.
- Questions should feel like they were written by a human hiring manager, not a template.
- For coding interviews: ask about approaches, trade-offs, edge cases — not "write a function that...".
- For audio interviews: ask open-ended questions suitable for a spoken conversation.
- Return ONLY a JSON object in this exact shape:
{{"questions": ["q1", "q2", "q3", ...]}}
"""

    max_retries = 3
    last_error = None

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            data = json.loads(response.text)
            questions = data.get("questions", [])

            if not questions:
                return QuestionResponse(
                    questions=[],
                    source="error",
                    message="AI returned no questions. Please try again.",
                )

            questions = questions[:num]
            return QuestionResponse(questions=questions, source="llm")

        except Exception as e:
            last_error = e
            error_msg = str(e).lower()
            is_retryable = "503" in error_msg or "429" in error_msg or "unavailable" in error_msg or "high demand" in error_msg

            if is_retryable and attempt < max_retries - 1:
                wait = 2 ** attempt
                print(f"Gemini busy (attempt {attempt+1}), retrying in {wait}s...")
                time.sleep(wait)
                continue
            break

    print("generate_questions final error:", last_error)
    return QuestionResponse(
        questions=[],
        source="error",
        message="AI service is temporarily overloaded. Please try again in a moment.",
    )


@app.post("/ai/evaluate-answer", response_model=EvaluateResponse)
@limiter.limit("30/minute")
async def evaluate_answer(request: Request, req: EvaluateRequest):
    if client is None:
        return fallback_evaluation(req)

    prompt = f"""You are an expert interview evaluator for a hiring company.
Evaluate the candidate's answer fairly and constructively.

Job Title: {req.job_title}
Question: {req.question}
Candidate Answer: {req.answer}

Scoring guide:
- 0-40: irrelevant, empty, or clearly off-topic
- 41-60: vague, surface-level, missing key points
- 61-80: solid, relevant, some depth and examples
- 81-100: excellent depth, concrete examples, clear communication

Return ONLY a JSON object in this exact shape:
{{"score": 75, "dimensions": {{"technical_accuracy": 75, "communication": 70, "relevance": 80}}, "strengths": ["..."], "weaknesses": ["..."], "feedback": "2-3 sentence summary"}}
"""

    max_retries = 3
    last_error = None

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            data = json.loads(response.text)
            score = max(0, min(100, int(data.get("score", 0))))
            return EvaluateResponse(
                score=score,
                dimensions=data.get("dimensions", {}),
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", []),
                feedback=data.get("feedback", ""),
                source="llm",
            )
        except Exception as e:
            last_error = e
            error_msg = str(e).lower()
            is_retryable = "503" in error_msg or "429" in error_msg or "unavailable" in error_msg or "high demand" in error_msg

            if is_retryable and attempt < max_retries - 1:
                wait = 2 ** attempt
                print(f"Gemini busy (attempt {attempt+1}), retrying in {wait}s...")
                time.sleep(wait)
                continue
            break

    print("evaluate_answer final error:", last_error)
    return fallback_evaluation(req)