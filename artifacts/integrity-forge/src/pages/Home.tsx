import { Link } from "wouter";
import { ShieldAlert, User, Presentation, Database, LogIn, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-16 w-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter mb-4 text-foreground">IntegrityForge</h1>
          <p className="text-xl text-muted-foreground max-w-xl font-light mb-8">
            Academic integrity analysis platform for universities — AI detection, plagiarism scoring, and a full dispute pipeline.
          </p>

          <div className="flex items-center gap-3 mb-12">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Create account
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-5 font-medium uppercase tracking-wider">Available portals</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="h-full border-border/60">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-secondary/50 p-4 rounded-full mb-3">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Student Portal</CardTitle>
              <CardDescription>Submit assignments for pre-check, view AI and plagiarism scores, and file disputes for false-positive flags.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="h-full border-border/60">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-secondary/50 p-4 rounded-full mb-3">
                <Presentation className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Instructor</CardTitle>
              <CardDescription>Review submissions, analyze collusion graphs, approve or reject disputes, and manage skeleton code templates.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="h-full border-border/60">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-secondary/50 p-4 rounded-full mb-3">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-lg">System Admin</CardTitle>
              <CardDescription>Global dashboard with Recharts stats, complete audit activity feed, and the full submissions list.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
