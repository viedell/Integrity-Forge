import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListSubmissions, useCreateSubmission, useListAssignments, useCreateDispute, getListSubmissionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

type Submission = {
  id: number;
  assignmentId: number;
  studentName: string;
  studentEmail?: string | null;
  content: string;
  aiScore: number;
  plagiarismScore: number;
  wordCount?: number | null;
  status: string;
  createdAt: string;
};

function riskLevel(aiScore: number, plagiarismScore: number) {
  const max = Math.max(aiScore, plagiarismScore);
  if (max >= 70) return { label: "High Risk", color: "text-destructive", icon: <AlertTriangle className="w-4 h-4" /> };
  if (max >= 40) return { label: "Moderate Risk", color: "text-amber-600", icon: <Clock className="w-4 h-4" /> };
  return { label: "Low Risk", color: "text-emerald-600", icon: <CheckCircle2 className="w-4 h-4" /> };
}

function SubmissionDetail({ sub, assignmentLabel }: { sub: Submission; assignmentLabel: string }) {
  const risk = riskLevel(sub.aiScore, sub.plagiarismScore);
  return (
    <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
      <SheetHeader className="mb-6">
        <SheetTitle>{assignmentLabel}</SheetTitle>
        <SheetDescription>Submitted {new Date(sub.createdAt).toLocaleString()}</SheetDescription>
      </SheetHeader>

      <div className={`flex items-center gap-2 mb-6 font-semibold ${risk.color}`}>
        {risk.icon}
        {risk.label}
      </div>

      <div className="flex justify-around mb-8">
        <ScoreGauge value={sub.aiScore} label="AI Detection" size={100} />
        <ScoreGauge value={sub.plagiarismScore} label="Similarity" size={100} />
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full bg-secondary text-2xl font-bold font-mono">
            {sub.wordCount ?? "--"}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Word Count</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-muted-foreground uppercase tracking-wider">AI Probability</span>
            <span className={sub.aiScore >= 70 ? "text-destructive" : sub.aiScore >= 40 ? "text-amber-600" : "text-emerald-600"}>
              {sub.aiScore}%
            </span>
          </div>
          <Progress value={sub.aiScore} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-muted-foreground uppercase tracking-wider">Plagiarism Similarity</span>
            <span className={sub.plagiarismScore >= 70 ? "text-destructive" : sub.plagiarismScore >= 40 ? "text-amber-600" : "text-emerald-600"}>
              {sub.plagiarismScore}%
            </span>
          </div>
          <Progress value={sub.plagiarismScore} className="h-2" />
        </div>
      </div>

      <div className="rounded-lg bg-secondary/40 border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Submission Content</p>
        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">{sub.content}</pre>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-secondary/20 border border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Thresholds Applied</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">AI Flag Threshold</span>
            <span className="ml-2 font-mono font-semibold">70%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Similarity Threshold</span>
            <span className="ml-2 font-mono font-semibold">70%</span>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}

export default function StudentPortal() {
  const { data: assignments = [], isLoading: loadingAssignments } = useListAssignments();
  const { data: submissions = [], isLoading: loadingSubmissions } = useListSubmissions();

  const createSubmission = useCreateSubmission();
  const createDispute = useCreateDispute();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [content, setContent] = useState("");

  const [disputeSubmissionId, setDisputeSubmissionId] = useState<number | null>(null);
  const [disputeRationale, setDisputeRationale] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId || !studentName || !content) return;

    createSubmission.mutate(
      { data: { assignmentId: parseInt(assignmentId), studentName, studentEmail, content } },
      {
        onSuccess: () => {
          toast({ title: "Submission successful", description: "Your assignment has been submitted for pre-check." });
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        },
        onError: () => {
          toast({ title: "Submission failed", description: "There was an error submitting your assignment.", variant: "destructive" });
        },
      }
    );
  };

  const handleDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeSubmissionId || !disputeRationale || !studentName) return;

    createDispute.mutate(
      { data: { submissionId: disputeSubmissionId, studentName, rationale: disputeRationale } },
      {
        onSuccess: () => {
          toast({ title: "Dispute filed", description: "Your dispute has been sent to the instructor." });
          setDisputeSubmissionId(null);
          setDisputeRationale("");
          queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        },
        onError: () => {
          toast({ title: "Dispute failed", description: "There was an error filing your dispute.", variant: "destructive" });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "clean": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80">Clean</Badge>;
      case "flagged_ai": return <Badge variant="destructive">Flagged: AI</Badge>;
      case "flagged_plagiarism": return <Badge variant="destructive">Flagged: Plagiarism</Badge>;
      case "disputed": return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Disputed</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <AppLayout title="Student Portal" subtitle="Submit assignments and review integrity analysis" role="student">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>New Pre-Check Submission</CardTitle>
              <CardDescription>Submit your work for analysis before final grading.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Full Name</Label>
                  <Input id="studentName" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Jane Doe" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email (Optional)</Label>
                  <Input id="studentEmail" type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="jane.doe@university.edu" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment">Assignment</Label>
                  <Select value={assignmentId} onValueChange={setAssignmentId} required>
                    <SelectTrigger id="assignment">
                      <SelectValue placeholder="Select assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAssignments ? (
                        <SelectItem value="loading" disabled>Loading assignments...</SelectItem>
                      ) : (
                        assignments.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>{a.courseId} - {a.title}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Submission Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your essay or code here..."
                    className="min-h-[200px] font-mono text-sm"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createSubmission.isPending || !assignmentId || !studentName || !content}>
                  {createSubmission.isPending ? "Analyzing…" : "Run Analysis"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold tracking-tight mb-4">My Submissions</h2>

          {loadingSubmissions ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32 pt-6" />
                </Card>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10">
              <p>No submissions found.</p>
              <p className="text-sm">Submit your first assignment using the form.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const assignment = assignments.find((a) => a.id === sub.assignmentId);
                const isFlagged = sub.status === "flagged_ai" || sub.status === "flagged_plagiarism";
                const assignmentLabel = assignment ? `${assignment.courseId}: ${assignment.title}` : `Assignment #${sub.assignmentId}`;

                return (
                  <Card key={sub.id} className={isFlagged ? "border-destructive/50" : ""}>
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{assignmentLabel}</CardTitle>
                        <CardDescription>Submitted on {new Date(sub.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      {getStatusBadge(sub.status)}
                    </CardHeader>

                    <CardContent className="pb-3">
                      <div className="flex items-center gap-6 flex-wrap">
                        <ScoreGauge value={sub.aiScore} label="AI Detection" size={80} />
                        <ScoreGauge value={sub.plagiarismScore} label="Similarity" size={80} />
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-[80px] h-[80px] rounded-full bg-secondary flex items-center justify-center text-xl font-bold font-mono">
                            {sub.wordCount ?? "--"}
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Words</span>
                        </div>

                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto gap-1">
                              View Details <ChevronRight className="w-3 h-3" />
                            </Button>
                          </SheetTrigger>
                          <SubmissionDetail sub={sub as Submission} assignmentLabel={assignmentLabel} />
                        </Sheet>
                      </div>
                    </CardContent>

                    {isFlagged && sub.status !== "disputed" && (
                      <CardFooter className="pt-0 justify-end">
                        <Dialog open={disputeSubmissionId === sub.id} onOpenChange={(open) => !open && setDisputeSubmissionId(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setDisputeSubmissionId(sub.id)}>
                              File Dispute
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>File a Dispute</DialogTitle>
                              <DialogDescription>
                                Provide rationale for why this assignment was falsely flagged.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleDispute}>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Rationale</Label>
                                  <Textarea
                                    value={disputeRationale}
                                    onChange={(e) => setDisputeRationale(e.target.value)}
                                    placeholder="I used the following references..."
                                    required
                                    minLength={10}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setDisputeSubmissionId(null)}>Cancel</Button>
                                <Button type="submit" disabled={createDispute.isPending || !disputeRationale}>Submit Dispute</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
