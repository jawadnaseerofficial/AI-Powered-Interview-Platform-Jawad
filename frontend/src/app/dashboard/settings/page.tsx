"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  Code,
  MessageSquare,
  Mic,
  Plus,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const roleStyles: Record<string, string> = {
  Owner: "bg-violet-50 text-violet-700 ring-violet-200/60",
  Recruiter: "bg-blue-50 text-blue-700 ring-blue-200/60",
  Interviewer: "bg-amber-50 text-amber-700 ring-amber-200/60",
};

const roleIcons: Record<string, string> = {
  Owner: "bg-violet-50 text-violet-600 ring-violet-200/60",
  Recruiter: "bg-blue-50 text-blue-600 ring-blue-200/60",
  Interviewer: "bg-amber-50 text-amber-600 ring-amber-200/60",
};

const weightLabels: Record<string, string> = {
  technical: "Technical Knowledge",
  communication: "Communication",
  problemSolving: "Problem Solving",
  cultureFit: "Culture Fit",
};

const interviewTypeIcons = {
  questions: MessageSquare,
  audio: Mic,
  coding: Code,
};

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("TechNova");
  const [domain, setDomain] = useState("technova.com");
  const [description, setDescription] = useState(
    "A fast-growing product company building developer tools."
  );

  const [defaultType, setDefaultType] = useState("questions");
  const [defaultDuration, setDefaultDuration] = useState("30");
  const [weights, setWeights] = useState({
    technical: 40,
    communication: 20,
    problemSolving: 25,
    cultureFit: 15,
  });

  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Jawad Naseer", email: "jawad@technova.com", role: "Owner" },
    { id: 2, name: "Mina Ali", email: "mina@technova.com", role: "Recruiter" },
    { id: 3, name: "Danish Iqbal", email: "danish@technova.com", role: "Interviewer" },
  ]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Recruiter");

  const [deleteOpen, setDeleteOpen] = useState(false);

  const weightsTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);

  function handleWeightChange(key: keyof typeof weights, value: string) {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setWeights({ ...weights, [key]: Math.max(0, Math.min(100, num)) });
  }

  function handleSaveProfile() {
    toast.success("Company profile saved", {
      description: "Changes will appear on your public job pages.",
    });
  }

  function handleSaveWeights() {
    if (weightsTotal !== 100) {
      toast.error("Weights must total 100%", {
        description: `Current total is ${weightsTotal}%.`,
      });
      return;
    }
    toast.success("Scoring weights saved", {
      description: "New interviews will be evaluated with these weights.",
    });
  }

  function handleInvite() {
    if (!inviteEmail.includes("@")) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address.",
      });
      return;
    }
    setMembers([
      ...members,
      {
        id: Date.now(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
      },
    ]);
    toast.success("Invitation sent", {
      description: `${inviteEmail} was invited as ${inviteRole}.`,
    });
    setInviteEmail("");
    setInviteOpen(false);
  }

  function handleDeleteCompany() {
    setDeleteOpen(false);
    toast.error("Action blocked", {
      description: "Company deletion requires owner email confirmation (backend phase).",
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-violet-600">
          Workspace Configuration
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your company workspace, interview defaults, and team.
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-2 rounded-xl bg-slate-100 p-1">
          <TabsTrigger
            value="company"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger
            value="interviews"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Interviews</span>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Danger</span>
          </TabsTrigger>
        </TabsList>

        {/* ========== COMPANY TAB ========== */}
        <TabsContent value="company">
          <Card className="overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200/60">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Company Profile
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    This information is shown to candidates on job pages.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-sm font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-domain" className="text-sm font-medium">
                    Website Domain
                  </Label>
                  <Input
                    id="company-domain"
                    value={domain}
                    onChange={(event) => setDomain(event.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-desc" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="company-desc"
                  className="min-h-24 resize-none"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                className="shadow-md shadow-violet-600/20"
              >
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== INTERVIEW DEFAULTS TAB ========== */}
        <TabsContent value="interviews">
          <Card className="overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Interview Defaults
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Applied to every new job unless overridden. Scoring weights must total 100%.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Default Interview Type</Label>
                  <Select
                    value={defaultType}
                    onValueChange={(value) => {
                      if (value) setDefaultType(value);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="questions">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Interview Questions
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Audio Call
                        </div>
                      </SelectItem>
                      <SelectItem value="coding">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Coding
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Default Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={defaultDuration}
                    onChange={(event) => setDefaultDuration(event.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-5 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Scoring Weights</h3>
                  <Badge
                    variant="outline"
                    className={`rounded-full border-0 ring-1 ${
                      weightsTotal === 100
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                        : "bg-rose-50 text-rose-700 ring-rose-200/60"
                    }`}
                  >
                    Total: {weightsTotal}%
                  </Badge>
                </div>

                {Object.keys(weightLabels).map((key) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-slate-700">{weightLabels[key]}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="h-8 w-20 text-right"
                          value={weights[key as keyof typeof weights]}
                          onChange={(event) =>
                            handleWeightChange(
                              key as keyof typeof weights,
                              event.target.value
                            )
                          }
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    </div>
                    <Progress
                      value={weights[key as keyof typeof weights]}
                      className="h-1.5"
                    />
                  </div>
                ))}

                <Button
                  onClick={handleSaveWeights}
                  className="shadow-md shadow-violet-600/20"
                >
                  Save Weights
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TEAM TAB ========== */}
        <TabsContent value="team">
          <Card className="overflow-hidden rounded-2xl border-slate-200/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/60">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Team Members
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    People who can access this company workspace.
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => setInviteOpen(true)}
                className="shadow-md shadow-violet-600/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => {
                const initials = member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div
                    key={member.id}
                    className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-1 ring-slate-200">
                        <AvatarFallback
                          className={`${roleIcons[member.role] ?? "bg-slate-100 text-slate-600 ring-slate-200"} text-sm font-semibold`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-full border-0 ring-1 ${roleStyles[member.role] ?? ""}`}
                    >
                      {member.role}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== DANGER ZONE TAB ========== */}
        <TabsContent value="danger">
          <Card className="overflow-hidden rounded-2xl border-rose-500/40 bg-gradient-to-b from-white to-rose-50/30 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/60">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-rose-700">
                    Delete Company
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Permanently remove your company, jobs, candidates, and interview data.
                    This action cannot be undone.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Delete Company
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== INVITE DIALOG ========== */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              Invite team member
            </DialogTitle>
            <DialogDescription>
              They will receive an email invitation to join your company workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value) => {
                  if (value) setInviteRole(value);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recruiter">Recruiter</SelectItem>
                  <SelectItem value="Interviewer">Interviewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              className="shadow-md shadow-violet-600/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DELETE CONFIRM DIALOG ========== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Are you absolutely sure?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your company and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              Yes, delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}