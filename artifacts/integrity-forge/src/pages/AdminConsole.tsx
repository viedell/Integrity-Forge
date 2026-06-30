import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDashboardStats, useListActivity, useListSubmissions, useListAssignments, Submission, Assignment } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityItemType } from "@workspace/api-client-react";
import { Shield, FileText, CheckCircle, AlertTriangle, Scale, Activity, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function exportCsv(submissions: Submission[] | undefined, assignments: Assignment[] | undefined) {
  const rows = (submissions ?? []).map(sub => {
    const assignment = (assignments ?? []).find(a => a.id === sub.assignmentId);
    return [
      sub.id,
      sub.studentName,
      sub.studentEmail ?? "",
      assignment?.courseId ?? sub.assignmentId,
      assignment?.title ?? `Assignment ${sub.assignmentId}`,
      sub.aiScore,
      sub.plagiarismScore,
      sub.wordCount ?? "",
      sub.status,
      new Date(sub.createdAt).toISOString(),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  const header = ["ID","Student Name","Email","Course ID","Assignment","AI Score","Plagiarism Score","Word Count","Status","Submitted At"].join(",");
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `submissions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminConsole() {
  const { data: stats, isLoading: loadingStats } = useGetDashboardStats();
  const { data: activity = [], isLoading: loadingActivity } = useListActivity({ limit: 50 });
  const { data: submissions = [], isLoading: loadingSubmissions } = useListSubmissions();
  const { data: assignments = [], isLoading: loadingAssignments } = useListAssignments();

  // Mock data for the chart since the API doesn't provide time-series data
  const mockChartData = [
    { name: 'Mon', submissions: 120, flagged: 10 },
    { name: 'Tue', submissions: 150, flagged: 15 },
    { name: 'Wed', submissions: 200, flagged: 30 },
    { name: 'Thu', submissions: 180, flagged: 20 },
    { name: 'Fri', submissions: 250, flagged: 45 },
    { name: 'Sat', submissions: 300, flagged: 60 },
    { name: 'Sun', submissions: 350, flagged: 80 },
  ];

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'submission': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'dispute': return <Scale className="w-4 h-4 text-amber-500" />;
      case 'analysis': return <Activity className="w-4 h-4 text-purple-500" />;
      case 'template': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'clean': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80">Clean</Badge>;
      case 'flagged_ai': return <Badge variant="destructive">AI Flag</Badge>;
      case 'flagged_plagiarism': return <Badge variant="destructive">Plagiarism</Badge>;
      case 'disputed': return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Disputed</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <AppLayout title="System Administration" subtitle="Global overview and system activity monitor" role="admin">
      
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Card key={i} className="h-32 animate-pulse bg-secondary/20"></Card>)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground mt-1">Across {stats.totalAssignments} assignments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Detection Rate</CardTitle>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.aiDetectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.flaggedAiCount} submissions flagged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clean Rate</CardTitle>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {stats.totalSubmissions ? Math.round((stats.cleanCount / stats.totalSubmissions) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.cleanCount} clean submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Disputes</CardTitle>
              <Scale className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.disputesPending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.disputesApproved} approved, {stats.disputesRejected} rejected
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="activity">System Activity & Load</TabsTrigger>
          <TabsTrigger value="submissions">Global Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>System Load</CardTitle>
                  <CardDescription>Submission volume vs Flagged items (Last 7 Days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={mockChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Area type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSubmissions)" />
                        <Area type="monotone" dataKey="flagged" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFlagged)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Audit Log</CardTitle>
                  <CardDescription>Live system activity feed</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto max-h-[400px] pr-2 custom-scrollbar">
                  {loadingActivity ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/50 animate-pulse shrink-0"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-secondary/50 rounded animate-pulse w-full"></div>
                            <div className="h-3 bg-secondary/50 rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No activity recorded.</p>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {activity.map((item) => (
                        <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-background bg-secondary text-secondary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            {getActivityIcon(item.type)}
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-border bg-card shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">{item.type}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <p className="text-sm">{item.description}</p>
                            {item.studentName && (
                              <p className="text-xs text-muted-foreground mt-2 font-mono">User: {item.studentName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Global Submissions Database</CardTitle>
                  <CardDescription>Comprehensive view of all submissions across the entire institution</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                  disabled={loadingSubmissions || submissions.length === 0}
                  onClick={() => exportCsv(submissions, assignments)}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSubmissions || loadingAssignments ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-secondary/30 rounded animate-pulse"></div>)}
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  No submissions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium">Student</th>
                        <th className="px-4 py-3 font-medium">Course/Assignment</th>
                        <th className="px-4 py-3 font-medium text-right">AI %</th>
                        <th className="px-4 py-3 font-medium text-right">Sim %</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => {
                        const assignment = assignments.find(a => a.id === sub.assignmentId);
                        return (
                          <tr key={sub.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                            <td className="px-4 py-3 font-mono text-muted-foreground">#{sub.id}</td>
                            <td className="px-4 py-3 font-medium">{sub.studentName}</td>
                            <td className="px-4 py-3">
                              {assignment ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold">{assignment.courseId}</span>
                                  <span className="text-xs text-muted-foreground">{assignment.title}</span>
                                </div>
                              ) : (
                                `Assignment ${sub.assignmentId}`
                              )}
                            </td>
                            <td className={`px-4 py-3 text-right font-mono ${sub.aiScore > 70 ? 'text-destructive font-bold' : ''}`}>
                              {sub.aiScore}
                            </td>
                            <td className={`px-4 py-3 text-right font-mono ${sub.plagiarismScore > 70 ? 'text-destructive font-bold' : ''}`}>
                              {sub.plagiarismScore}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(sub.status)}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
    </AppLayout>
  );
}
