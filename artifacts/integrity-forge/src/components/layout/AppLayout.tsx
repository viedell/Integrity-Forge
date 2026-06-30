import { Link, useLocation } from "wouter";
import { ShieldAlert, LogOut } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppLayout({ children, title, subtitle, role }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  role: "student" | "instructor" | "admin";
}) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <Link href="/">
              <span className="font-bold text-lg cursor-pointer tracking-tight">IntegrityForge</span>
            </Link>
            <div className="ml-3 px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground text-xs font-mono font-medium uppercase tracking-wider">
              {role}
            </div>
          </div>

          <nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
            {role === "student" && (
              <>
                <Link href="/student">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location === "/student" ? "text-foreground" : ""}`}>
                    My Submissions
                  </span>
                </Link>
                <Link href="/student/gap-finder">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location.includes("gap-finder") ? "text-foreground" : ""}`}>
                    Research Gap Finder
                  </span>
                </Link>
              </>
            )}
            {role === "instructor" && (
              <>
                <Link href="/instructor">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location === "/instructor" ? "text-foreground" : ""}`}>
                    Dashboard
                  </span>
                </Link>
                <Link href="/instructor/templates">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location.includes("templates") ? "text-foreground" : ""}`}>
                    Templates
                  </span>
                </Link>
              </>
            )}
            {role === "admin" && (
              <>
                <Link href="/admin">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location === "/admin" ? "text-foreground" : ""}`}>
                    System Overview
                  </span>
                </Link>
                <Link href="/admin/activity">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location.includes("activity") ? "text-foreground" : ""}`}>
                    Audit Log
                  </span>
                </Link>
                <Link href="/admin/users">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location.includes("users") ? "text-foreground" : ""}`}>
                    Users
                  </span>
                </Link>
              </>
            )}

            <div className="h-4 w-px bg-border" />

            {user && (
              <span className="text-foreground font-medium max-w-[140px] truncate">
                {user.firstName || user.username || user.primaryEmailAddress?.emailAddress}
              </span>
            )}

            <button
              type="button"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-lg">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
