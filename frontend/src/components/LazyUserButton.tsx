"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Code-splitting Clerk's heavy UI component
const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  {
    ssr: false,
    loading: () => <Skeleton className="h-9 w-9 rounded-full bg-white/10" />,
  }
);

export function LazyUserButton() {
  return <ClerkUserButton />;
}