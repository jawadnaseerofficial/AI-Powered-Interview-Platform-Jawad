"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AuthButtons } from "@/components/auth-buttons";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  Mic,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <img
                src="/logo.jpg"
                alt="InterviewAI Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-lg font-bold tracking-tight">AI Powered Interview Platform</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition">
              How it Works
            </a>
          </div>

          <AuthButtons />
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        {/* Animated Background Glows */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-20 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200"
          >
            <Sparkles className="h-4 w-4" />
            <span>The future of technical hiring is here</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-5xl font-bold tracking-tight md:text-7xl bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent"
          >
            Hire top talent with <br className="hidden md:block" />
            <span className="text-violet-400">AI-powered interviews.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl"
          >
            Stop spending hundreds of hours on initial screening. Let our AI
            conduct text, voice, and coding interviews, then rank candidates
            objectively.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-semibold transition hover:bg-violet-500 shadow-lg shadow-violet-600/20"
            >
              I am a Recruiter
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/candidate"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-slate-200 transition hover:bg-white/10 backdrop-blur"
            >
              I am a Candidate
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-6 text-sm text-slate-500"
          >
            No credit card required • Free for up to 10 interviews
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-slate-900/50 py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="mx-auto max-w-7xl px-6"
        >
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Time Saved per Hire", value: "14 hrs" },
              { label: "Candidate Satisfaction", value: "94%" },
              { label: "Bias Reduction", value: "85%" },
              { label: "Interviews Conducted", value: "50k+" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="text-center"
              >
                <p className="text-3xl font-bold text-white md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold md:text-4xl"
            >
              Three ways to interview
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-lg text-slate-400"
            >
              Choose the right assessment for every role.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {[
              {
                icon: MessageSquare,
                title: "Conversational AI",
                desc: "Deep-dive behavioral and technical questions tailored to the candidate's resume and your job description.",
                color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              },
              {
                icon: Mic,
                title: "Live Voice Calls",
                desc: "Natural, real-time voice conversations. Perfect for assessing communication skills and culture fit.",
                color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
              },
              {
                icon: Code,
                title: "Secure Coding",
                desc: "A fully featured IDE with automated test execution and AI code reviews for time complexity and readability.",
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="bg-slate-900 border-white/5 hover:border-white/10 transition h-full">
                  <CardContent className="p-8">
                    <div
                      className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl border ${feature.color}`}
                    >
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold md:text-4xl"
            >
              Hire in 3 simple steps
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-lg text-slate-400"
            >
              From job post to final ranking in minutes, not weeks.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-12 md:grid-cols-3"
          >
            {[
              {
                step: "01",
                title: "Post your job",
                desc: "Paste your job description. Our AI instantly generates a custom interview rubric and targeted questions.",
              },
              {
                step: "02",
                title: "Candidates interview",
                desc: "Applicants take the AI interview on their own time. Text, voice, or code — whatever you need.",
              },
              {
                step: "03",
                title: "Hire the best",
                desc: "Review AI-generated scorecards, listen to transcripts, and see candidates ranked objectively.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative"
              >
                <span className="text-6xl font-bold text-slate-800">
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl px-6 text-center"
        >
          <Card className="bg-gradient-to-br from-violet-600 to-blue-600 border-none p-12 shadow-2xl shadow-violet-600/20">
            <CardContent className="p-0">
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Ready to transform your hiring?
              </h2>
              <p className="mt-4 text-lg text-violet-100">
                Join hundreds of forward-thinking companies hiring better,
                faster.
              </p>
              <Link
                href="/sign-up"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:bg-slate-100 transition"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-white/5 py-12"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                <img
                  src="/logo.jpg"
                  alt="InterviewAI Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-lg font-bold tracking-tight">
                AI Powered Interview Platform
              </span>
            </div>
            <div className="flex gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition">
                Terms
              </a>
              <a href="#" className="hover:text-white transition">
                Contact
              </a>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 InterviewAI. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </main>
  );
}