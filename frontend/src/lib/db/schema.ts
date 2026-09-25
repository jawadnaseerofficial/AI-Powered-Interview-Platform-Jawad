import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type StoredEvaluation = {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  source: string;
};

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull().default("My Company"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
  interviewType: text("interview_type").notNull().default("questions"),
  questions: jsonb("questions").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("Open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviewResults = pgTable("interview_results", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  jobId: integer("job_id").references(() => jobs.id),
  candidateName: text("candidate_name").notNull().default("Anonymous"),
  candidateEmail: text("candidate_email"),
  overallScore: integer("overall_score").notNull(),
  questionScores: jsonb("question_scores").$type<number[]>().notNull().default([]),
  questions: jsonb("questions").$type<string[]>().notNull().default([]),
  answers: jsonb("answers").$type<string[]>().notNull().default([]),
  evaluations: jsonb("evaluations").$type<(StoredEvaluation | null)[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});