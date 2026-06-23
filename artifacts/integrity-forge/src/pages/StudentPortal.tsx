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
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

    createSubmission.mutate({
      data: {
        assignmentId: parseInt(assignmentId),
        studentName,
        studentEmail,
        content
      }
    }, {
      onSuccess: () => {
        toast({ title: "Submission successful", description: "Your assignment has been submitted for pre-check." });
        setContent("");
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Submission failed", description: "There was an error submitting your assignment.", variant: "destructive" });
      }
    });
  };

  const handleDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeSubmissionId || !disputeRationale || !studentName) return;

    createDispute.mutate({
      data: {
        submissionId: disputeSubmissionId,
        studentName,
        rationale: disputeRationale
      }
    }, {
      onSuccess: () => {
        toast({ title: "Dispute filed", description: "Your dispute has been sent to the instructor." });
        setDisputeSubmissionId(null);
        setDisputeRationale("");
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Dispute failed", description: "There was an error filing your dispute.", variant: "destructive" });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'clean': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80">Clean</Badge>;
      case 'flagged_ai': return <Badge variant="destructive">Flagged: AI</Badge>;
      case 'flagged_plagiarism': return <Badge variant="destructive">Flagged: Plagiarism</Badge>;
      case 'disputed': return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Disputed</Badge>;
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
                  <Input 
                    id="studentName" 
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    placeholder="Jane Doe" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email (Optional)</Label>
                  <Input 
                    id="studentEmail" 
                    type="email" 
                    value={studentEmail} 
                    onChange={(e) => setStudentEmail(e.target.value)} 
                    placeholder="jane.doe@university.edu" 
                  />
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
                        assignments.map(a => (
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
                  {createSubmission.isPending ? "Analyzing..." : "Run Analysis"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold tracking-tight mb-4">My Submissions</h2>
          
          {loadingSubmissions ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32 pt-6"></CardContent>
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
              {submissions.map(sub => {
                const assignment = assignments.find(a => a.id === sub.assignmentId);
                const isFlagged = sub.status === 'flagged_ai' || sub.status === 'flagged_plagiarism';
                
                return (
                  <Card key={sub.id} className={isFlagged ? "border-destructive/50" : ""}>
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {assignment ? `${assignment.courseId}: ${assignment.title}` : `Assignment #${sub.assignmentId}`}
                        </CardTitle>
                        <CardDescription>Submitted on {new Date(sub.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      {getStatusBadge(sub.status)}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">AI Score</span>
                          <span className={`text-2xl font-mono ${sub.aiScore > 70 ? 'text-destructive' : ''}`}>{sub.aiScore}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Similarity</span>
                          <span className={`text-2xl font-mono ${sub.plagiarismScore > 70 ? 'text-destructive' : ''}`}>{sub.plagiarismScore}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Words</span>
                          <span className="text-2xl font-mono">{sub.wordCount || '--'}</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    {isFlagged && sub.status !== 'disputed' && (
                      <CardFooter className="pt-0 justify-end">
                        <Dialog open={disputeSubmissionId === sub.id} onOpenChange={(open) => !open && setDisputeSubmissionId(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setDisputeSubmissionId(sub.id)}>File Dispute</Button>
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
