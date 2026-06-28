import { useState } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { ShieldAlert, User, Presentation, LogOut } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Role = "student" | "instructor" | "admin";

const roles: { key: Role; label: string; description: string; icon: React.ReactNode; dest: string }[] = [
  {
    key: "student",
    label: "Student",
    description: "Submit assignments for pre-check, view AI and plagiarism scores, and file disputes.",
    icon: <User className="w-8 h-8 text-primary" />,
    dest: "/student",
  },
  {
    key: "instructor",
    label: "Instructor",
    description: "Review submissions, analyze the collusion graph, manage disputes, and upload templates.",
    icon: <Presentation className="w-8 h-8 text-primary" />,
    dest: "/instructor",
  },
];

export default function Onboarding({ onRoleSet }: { onRoleSet?: (r: Role) => void }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const handleContinue = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selected,
          name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Unknown",
          email: user.primaryEmailAddress?.emailAddress || "",
        }),
      });
      onRoleSet?.(selected);
      setLocation(`/${selected}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-16 w-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mb-2 text-foreground">Welcome to IntegrityForge</h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Hi {user?.firstName || "there"}! What is your role? This determines which portal you can access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {roles.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelected(r.key)}
              className="text-left focus:outline-none"
            >
              <Card
                className={`h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                  selected === r.key
                    ? "border-primary ring-2 ring-primary shadow-md"
                    : "hover:border-primary/40"
                }`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto bg-secondary/50 p-4 rounded-full mb-3">
                    {r.icon}
                  </div>
                  <CardTitle className="text-lg">{r.label}</CardTitle>
                  <CardDescription className="text-sm">{r.description}</CardDescription>
                </CardHeader>
              </Card>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            className="w-full max-w-xs"
            size="lg"
            disabled={!selected || saving}
            onClick={handleContinue}
          >
            {saving ? "Saving…" : selected ? `Continue as ${roles.find((r) => r.key === selected)?.label}` : "Select your role"}
          </Button>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
