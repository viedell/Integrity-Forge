import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListSubmissions, useCreateSubmission, useListAssignments, useCreateAssignment, useCreateDispute, useDeleteSubmission, getListSubmissionsQueryKey } from "@workspace/api-client-react";
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
import { ChevronRight, AlertTriangle, CheckCircle2, Clock, Trash2 } from "lucide-react";

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
  grade?: string | null;
  feedback?: string | null;
};

const AI_PHRASES = [
  "it is worth noting",
  "it is important to note",
  "it is essential to",
  "in conclusion",
  "in summary",
  "to summarize",
  "furthermore",
  "moreover",
  "in addition",
  "it is crucial",
  "plays a crucial role",
  "plays a vital role",
  "plays an important role",
  "it is evident",
  "it is clear",
  "as mentioned",
  "as previously",
  "delve into",
  "dive into",
  "shed light",
  "in the realm of",
  "landscape of",
  "at its core",
  "at the heart of",
  "underpins",
  "underscores",
  "it goes without saying",
  "needless to say",
  "it should be noted",
  "it can be argued",
  "one must consider",
  "a myriad of",
  "multifaceted",
  "nuanced",
  "leverage",
  "utilize",
  "facilitate",
  "demonstrate",
  "robust",
  "comprehensive",
  "holistic",
  "paradigm",
  "synergy",
  "streamline",
  "cutting-edge",
  "state-of-the-art",
  "best practices",
];

const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+\w+ed\b/i,
  /\b(is|are|was|were)\s+\w+en\b/i,
];

function HighlightedText({ content }: { content: string }) {
  if (!content) return null;
  const sentences = content.split(/(?<=[.!?])\s+/);
  return (
    <>
      {sentences.map((sentence, idx) => {
        const lower = sentence.toLowerCase();
        const matchedPhrases = AI_PHRASES.filter(phrase => lower.includes(phrase));
        const isPassive = PASSIVE_PATTERNS.some(pat => pat.test(sentence));

        let highlightColor = "";
        let reason = "";

        if (matchedPhrases.length > 0) {
          highlightColor = "bg-amber-500/20 border-b border-dashed border-amber-500 hover:bg-amber-500/35 cursor-help";
          reason = `AI phrase detected: "${matchedPhrases.join('", "')}"`;
        } else if (isPassive) {
          highlightColor = "bg-blue-500/10 border-b border-dashed border-blue-500 hover:bg-blue-500/20 cursor-help";
          reason = "Passive voice pattern detected";
        }

        if (highlightColor) {
          return (
            <span
              key={idx}
              className={`${highlightColor} transition-colors px-0.5 rounded-sm inline`}
              title={reason}
            >
              {sentence}{" "}
            </span>
          );
        }
        return <span key={idx}>{sentence}{" "}</span>;
      })}
    </>
  );
}

function riskLevel(aiScore: number, plagiarismScore: number) {
  const max = Math.max(aiScore, plagiarismScore);
  if (max >= 70) return { label: "High Risk", color: "text-destructive", icon: <AlertTriangle className="w-4 h-4" /> };
  if (max >= 40) return { label: "Moderate Risk", color: "text-amber-600", icon: <Clock className="w-4 h-4" /> };
  return { label: "Low Risk", color: "text-emerald-600", icon: <CheckCircle2 className="w-4 h-4" /> };
}

function SubmissionDetail({ sub, assignmentLabel }: { sub: Submission; assignmentLabel: string }) {
  const risk = riskLevel(sub.aiScore, sub.plagiarismScore);
  const [showAiBreakdown, setShowAiBreakdown] = useState(false);
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

      {sub.grade && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Instructor Grade</span>
            <Badge className="text-sm font-bold bg-primary text-primary-foreground">{sub.grade}</Badge>
          </div>
          {sub.feedback && (
            <div className="text-sm text-foreground mt-2 border-t pt-2 border-primary/10">
              <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Feedback</p>
              <p className="italic text-muted-foreground">{sub.feedback}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-muted-foreground uppercase tracking-wider">AI Probability</span>
            <span className={sub.aiScore >= 70 ? "text-destructive" : sub.aiScore >= 40 ? "text-amber-600" : "text-emerald-600"}>
              {sub.aiScore}%
            </span>
          </div>
          <Progress value={sub.aiScore} className="h-2" />
          
          <div className="mt-2 text-right">
            <Button
              variant="link"
              className="text-xs p-0 h-auto text-primary hover:underline"
              onClick={() => setShowAiBreakdown(!showAiBreakdown)}
            >
              {showAiBreakdown ? "Hide writing pattern analysis" : "How was this score calculated?"}
            </Button>
          </div>

          {showAiBreakdown && (
            <div className="mt-3 p-3.5 rounded-lg bg-secondary/50 border border-border text-xs leading-relaxed space-y-3">
              <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">AI Writing Heuristics Analyzed</p>
              
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <div>
                    <span className="font-semibold">AI Phrase Density (Max 30% contribution):</span>
                    <p className="text-muted-foreground mt-0.5">Detects excessive use of LLM filler transitions (e.g., "it is worth noting", "delve into", "moreover", "multifaceted").</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <div>
                    <span className="font-semibold">Contraction Scarcity (Max 20% contribution):</span>
                    <p className="text-muted-foreground mt-0.5">AI rarely writes naturally with contractions (don't, can't, it's). Formal academic texts with zero contractions score higher.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <div>
                    <span className="font-semibold">First-Person Pronoun Scarcity (Max 15% contribution):</span>
                    <p className="text-muted-foreground mt-0.5">AI avoids referring to itself. Human writers naturally include first-person self-references (I, we, our) in active voices.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <div>
                    <span className="font-semibold">Sentence Uniformity (Max 20% contribution):</span>
                    <p className="text-muted-foreground mt-0.5">AI generates sentences of very consistent length. Natural writing fluctuates dynamically between short and long phrases.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                  <div>
                    <span className="font-semibold">Passive Voice Density (Max 15% contribution):</span>
                    <p className="text-muted-foreground mt-0.5">Measures frequency of passive structure patterns (e.g., "was conducted", "were analyzed") typical of LLM formats.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-2 text-[10px] text-muted-foreground">
                💡 <span className="font-medium text-foreground">Tip:</span> If this is a false flag, make your writing more active by varying sentence lengths and utilizing personal pronouns.
              </div>
            </div>
          )}
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
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
          <span>Submission Content</span>
          <span className="text-[10px] lowercase normal-case tracking-normal text-muted-foreground flex gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/25 border border-dashed border-amber-500/50" /> AI phrase</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500/10 border border-dashed border-blue-500/30" /> Passive voice</span>
          </span>
        </p>
        <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto border border-border/20 rounded p-2.5 bg-background/50">
          <HighlightedText content={sub.content} />
        </div>
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
  const { user } = useUser();
  const { data: assignments = [], isLoading: loadingAssignments } = useListAssignments();
  const { data: submissions = [], isLoading: loadingSubmissions } = useListSubmissions();

  const createSubmission = useCreateSubmission();
  const createDispute = useCreateDispute();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clerkName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "";
  const clerkEmail = user?.primaryEmailAddress?.emailAddress || "";

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualCourse, setManualCourse] = useState("");
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [content, setContent] = useState("");

  const createAssignment = useCreateAssignment();
  const deleteSubmission = useDeleteSubmission();

  useEffect(() => {
    if (clerkName) setStudentName(clerkName);
    if (clerkEmail) setStudentEmail(clerkEmail);
  }, [clerkName, clerkEmail]);

  const [disputeSubmissionId, setDisputeSubmissionId] = useState<number | null>(null);
  const [disputeRationale, setDisputeRationale] = useState("");

  const isManual = useManualEntry || assignments.length === 0;

  const doSubmit = (resolvedAssignmentId: number) => {
    createSubmission.mutate(
      { data: { assignmentId: resolvedAssignmentId, studentName, studentEmail, content } },
      {
        onSuccess: () => {
          toast({ title: "Submission successful", description: "Your assignment has been submitted for pre-check." });
          setContent("");
          setManualTitle("");
          setManualCourse("");
          queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        },
        onError: () => {
          toast({ title: "Submission failed", description: "There was an error submitting your assignment.", variant: "destructive" });
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !content) return;

    if (isManual) {
      if (!manualTitle.trim() || !manualCourse.trim()) return;
      createAssignment.mutate(
        { data: { title: manualTitle.trim(), courseId: manualCourse.trim(), courseName: manualCourse.trim() } },
        {
          onSuccess: (newAssignment) => {
            doSubmit(newAssignment.id);
          },
          onError: () => {
            toast({ title: "Could not create assignment", description: "Please try again.", variant: "destructive" });
          },
        }
      );
    } else {
      if (!assignmentId) return;
      doSubmit(parseInt(assignmentId));
    }
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

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    deleteSubmission.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Submission deleted", description: "Your submission has been removed." });
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Deletion failed", description: "There was an error deleting your submission.", variant: "destructive" });
      }
    });
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
                  <Input id="studentName" value={studentName} readOnly className="bg-secondary/30 cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email</Label>
                  <Input id="studentEmail" type="email" value={studentEmail} readOnly className="bg-secondary/30 cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="assignment">Assignment</Label>
                    {assignments.length > 0 && (
                      <button
                        type="button"
                        className="text-xs text-primary underline-offset-2 hover:underline"
                        onClick={() => { setUseManualEntry(!useManualEntry); setAssignmentId(""); setManualTitle(""); setManualCourse(""); }}
                      >
                        {useManualEntry ? "Pick from list" : "Type manually"}
                      </button>
                    )}
                  </div>

                  {isManual ? (
                    <div className="space-y-2">
                      <Input
                        id="manualTitle"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Assignment title (e.g. Essay on Climate Change)"
                        required
                      />
                      <Input
                        id="manualCourse"
                        value={manualCourse}
                        onChange={(e) => setManualCourse(e.target.value)}
                        placeholder="Course name or code (e.g. CS101)"
                        required
                      />
                    </div>
                  ) : (
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
                  )}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    createSubmission.isPending ||
                    createAssignment.isPending ||
                    !studentName ||
                    !content ||
                    (isManual ? (!manualTitle.trim() || !manualCourse.trim()) : !assignmentId)
                  }
                >
                  {(createSubmission.isPending || createAssignment.isPending) ? "Analyzing…" : "Run Analysis"}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{assignmentLabel}</CardTitle>
                          {sub.grade && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                              Grade: {sub.grade}
                            </Badge>
                          )}
                        </div>
                        <CardDescription>Submitted on {new Date(sub.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(sub.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(sub.id)}
                          disabled={deleteSubmission.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
