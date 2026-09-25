"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LazyUserButton } from "@/components/LazyUserButton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Briefcase,
  Code,
  Home,
  LogOut,
  Mic,
  Settings,
  User,
} from "lucide-react";

const menuItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Candidates", url: "/dashboard/candidates", icon: User },
  { title: "Audio Interviews", url: "/dashboard/audio", icon: Mic },
  { title: "Coding Interviews", url: "/dashboard/coding", icon: Code },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  // Clock state
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayName = user?.fullName ?? "Recruiter";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* ---------- Dark branded sidebar ---------- */}
        <Sidebar>
          <SidebarHeader className="px-4 pb-2 pt-4">
            <Link href="/dashboard" className="flex items-center gap-2 px-2">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                <img
                  src="/logo.jpg"
                  alt="AIP Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-lg font-bold leading-tight tracking-[-0.025em] text-white">
                AI Powered <br /> Interview Platform
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          render={<Link href={item.url} />}
                          isActive={isActive}
                          className="h-11 rounded-xl px-3 text-[15px] font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white data-active:bg-violet-600 data-active:text-white data-active:shadow-lg data-active:shadow-violet-600/30"
                        >
                          <item.icon
                            className={
                              isActive ? "text-white" : "text-slate-500"
                            }
                          />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-4 pb-5">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="h-10 rounded-xl px-3 text-slate-400 hover:bg-white/5 hover:text-rose-400"
                >
                  <LogOut className="text-slate-500" />
                  <span>Log out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ---------- Clean workspace ---------- */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-violet-600 px-6 backdrop-blur">
            {/* Left: Sidebar toggle */}
            <div className="flex items-center">
              <SidebarTrigger />
            </div>

            {/* Middle: Time clock */}
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-white/5 px-4 py-1.5 ring-1 ring-white/10">
                <span className="font-mono text-sm font-semibold tracking-wider text-slate-200">
                  {currentTime || "--:--:-- --"}
                </span>
              </div>
            </div>

            {/* Right: Lazy Loaded Clerk UserButton */}
            <div className="flex items-center">
              <LazyUserButton />
            </div>
          </header>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}