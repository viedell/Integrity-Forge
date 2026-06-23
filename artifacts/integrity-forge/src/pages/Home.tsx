import { Link } from "wouter";
import { ShieldAlert, User, Presentation, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="h-16 w-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter mb-4 text-foreground">IntegrityForge</h1>
          <p className="text-xl text-muted-foreground max-w-xl font-light">
            Academic integrity analysis platform. Select your operational context to proceed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/student">
            <Card className="cursor-pointer hover:border-primary transition-all duration-300 hover:shadow-md h-full hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-secondary/50 p-4 rounded-full mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Student Portal</CardTitle>
                <CardDescription>Submit assignments for pre-check and view analysis results.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/instructor">
            <Card className="cursor-pointer hover:border-primary transition-all duration-300 hover:shadow-md h-full hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-secondary/50 p-4 rounded-full mb-4">
                  <Presentation className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Instructor</CardTitle>
                <CardDescription>Review submissions, analyze collusion graphs, and manage disputes.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="cursor-pointer hover:border-primary transition-all duration-300 hover:shadow-md h-full hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-secondary/50 p-4 rounded-full mb-4">
                  <Database className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">System Admin</CardTitle>
                <CardDescription>Global dashboard, system metrics, and complete audit trails.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
