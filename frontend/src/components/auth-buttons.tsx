"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export function AuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();

  // While Clerk is checking the session, show an empty space to prevent layout shift
  if (!isLoaded) {
    return <div className="h-9 w-24" />;
  }

  return (
    <div className="flex items-center gap-4">
      {!isSignedIn ? (
        <>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
          >
            Get Started
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/dashboard"
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            Open Dashboard
          </Link>
          <UserButton />
        </>
      )}
    </div>
  );
}