import { Link, useLocation } from "wouter";
import { ShieldAlert, BookOpen, Presentation, Database, Settings } from "lucide-react";

export function AppLayout({ children, title, subtitle, role }: { children: React.ReactNode, title: string, subtitle?: string, role: 'student' | 'instructor' | 'admin' }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <Link href="/">
                <span className="font-bold text-lg cursor-pointer tracking-tight">IntegrityForge</span>
              </Link>
            </div>
            <div className="ml-4 px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground text-xs font-mono font-medium uppercase tracking-wider">
              {role}
            </div>
          </div>
          
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {role === 'student' && (
              <Link href="/student">
                <span className={`cursor-pointer hover:text-foreground transition-colors ${location === '/student' ? 'text-foreground' : ''}`}>My Submissions</span>
              </Link>
            )}
            {role === 'instructor' && (
              <>
                <Link href="/instructor">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location === '/instructor' ? 'text-foreground' : ''}`}>Dashboard</span>
                </Link>
                <Link href="/instructor/templates">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location.includes('templates') ? 'text-foreground' : ''}`}>Templates</span>
                </Link>
              </>
            )}
            {role === 'admin' && (
              <>
                <Link href="/admin">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location === '/admin' ? 'text-foreground' : ''}`}>System Overview</span>
                </Link>
                <Link href="/admin/activity">
                  <span className={`cursor-pointer hover:text-foreground transition-colors ${location.includes('activity') ? 'text-foreground' : ''}`}>Audit Log</span>
                </Link>
              </>
            )}
            <div className="h-4 w-px bg-border mx-2"></div>
            <Link href="/">
              <span className="cursor-pointer hover:text-foreground transition-colors">Exit Role</span>
            </Link>
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
