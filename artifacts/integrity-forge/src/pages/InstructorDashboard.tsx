import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useListAssignments, 
  useListSubmissions, 
  useGetSimilarityGraph, 
  useListDisputes,
  useUpdateDispute,
  useListTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useCreateAssignment,
  useDeleteAssignment,
  useDeleteSubmission,
  useUpdateSubmission,
  getListDisputesQueryKey,
  getListTemplatesQueryKey,
  getListAssignmentsQueryKey,
  getListSubmissionsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CollusionGraph } from "@/components/ui/CollusionGraph";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, Upload, Plus, Eye } from "lucide-react";

export default function InstructorDashboard() {
  const { data: assignments = [], isLoading: loadingAssignments } = useListAssignments();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  const { data: allSubmissions = [], isLoading: loadingSubmissions } = useListSubmissions({ 
    assignmentId: selectedAssignmentId ? parseInt(selectedAssignmentId) : undefined,
    includeDeleted: true
  }, { query: { enabled: !!selectedAssignmentId } as any });

  const submissions = allSubmissions.filter(sub => sub.deletedAt == null);
  const deletedSubmissions = allSubmissions.filter(sub => sub.deletedAt != null);

  const deleteSubmission = useDeleteSubmission();
  const updateSubmission = useUpdateSubmission();
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewStudent, setPreviewStudent] = useState<string>("");

  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
  const [gradingGrade, setGradingGrade] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingStudent, setGradingStudent] = useState("");

  const { data: graphData = { nodes: [], edges: [] }, isLoading: loadingGraph } = useGetSimilarityGraph({ 
    assignmentId: selectedAssignmentId ? parseInt(selectedAssignmentId) : undefined 
  }, { query: { enabled: !!selectedAssignmentId } as any });

  const { data: disputes = [], isLoading: loadingDisputes } = useListDisputes({ status: 'pending' });
  const updateDispute = useUpdateDispute();
  
  const { data: templates = [], isLoading: loadingTemplates } = useListTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const [instructorNote, setInstructorNote] = useState<Record<number, string>>({});

  // Template Form State
  const [templateFilename, setTemplateFilename] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  const handleDeleteAssignment = () => {
    if (!selectedAssignmentId) return;
    const assignment = assignments.find(a => a.id.toString() === selectedAssignmentId);
    if (!assignment) return;

    if (
      !confirm(
        `Are you sure you want to delete the assignment "${assignment.title}"? This will also permanently delete all related submissions and similarity reports.`
      )
    ) {
      return;
    }

    deleteAssignment.mutate(
      { id: parseInt(selectedAssignmentId, 10) },
      {
        onSuccess: () => {
          toast({ title: "Assignment deleted", description: "The assignment and all associated records have been removed." });
          setSelectedAssignmentId("");
          queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to delete assignment.", variant: "destructive" });
        }
      }
    );
  };

  const handleDeleteSubmission = (id: number) => {
    if (!confirm("Are you sure you want to remove this paper?")) return;
    deleteSubmission.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Paper removed", description: "The submission has been soft-deleted." });
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
      },
      onError: () => toast({ title: "Error", description: "Failed to remove submission.", variant: "destructive" }),
    });
  };

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;

    updateSubmission.mutate({
      id: gradingSubmissionId,
      data: {
        grade: gradingGrade,
        feedback: gradingFeedback,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Submission graded", description: `Grade and feedback saved for ${gradingStudent}.` });
        setGradingSubmissionId(null);
        setGradingGrade("");
        setGradingFeedback("");
        queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to grade submission.", variant: "destructive" });
      }
    });
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId || !newCourseName || !newTitle) return;
    createAssignment.mutate(
      { data: { courseId: newCourseId, courseName: newCourseName, title: newTitle, dueDate: newDueDate || undefined } },
      {
        onSuccess: (created) => {
          toast({ title: "Assignment created", description: `${created.courseId}: ${created.title} has been added.` });
          queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
          setSelectedAssignmentId(created.id.toString());
          setNewCourseId(""); setNewCourseName(""); setNewTitle(""); setNewDueDate("");
          setNewAssignmentOpen(false);
        },
        onError: () => toast({ title: "Error", description: "Failed to create assignment.", variant: "destructive" }),
      }
    );
  };

  const handleDisputeAction = (id: number, status: 'approved' | 'rejected') => {
    updateDispute.mutate({
      id,
      data: {
        status,
        instructorNote: instructorNote[id]
      }
    }, {
      onSuccess: () => {
        toast({ title: `Dispute ${status}`, description: "The dispute has been updated." });
        queryClient.invalidateQueries({ queryKey: getListDisputesQueryKey() });
        
        // Clean up note
        const newNotes = { ...instructorNote };
        delete newNotes[id];
        setInstructorNote(newNotes);
      }
    });
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !templateFilename || !templateContent) return;

    createTemplate.mutate({
      data: {
        assignmentId: parseInt(selectedAssignmentId),
        filename: templateFilename,
        content: templateContent
      }
    }, {
      onSuccess: () => {
        toast({ title: "Template added", description: "Skeleton code template has been saved." });
        setTemplateFilename("");
        setTemplateContent("");
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
      }
    });
  };

  const handleDeleteTemplate = (id: number) => {
    deleteTemplate.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Template deleted", description: "The template has been removed." });
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
      }
    });
  };

  const selectedAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId);
  const assignmentTemplates = templates.filter(t => t.assignmentId.toString() === selectedAssignmentId);

  return (
    <AppLayout title="Instructor Dashboard" subtitle="Monitor submissions and analyze integrity metrics" role="instructor">
      
      <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div className="w-full md:w-1/3 flex gap-2 items-center">
          <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
            <SelectTrigger className="bg-card flex-grow">
              <SelectValue placeholder="Select an assignment to view" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map(a => (
                <SelectItem key={a.id} value={a.id.toString()}>{a.courseId}: {a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAssignmentId && (
            <Button
              variant="destructive"
              size="icon"
              className="shrink-0"
              onClick={handleDeleteAssignment}
              disabled={deleteAssignment.isPending}
              title="Delete Assignment"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Dialog open={newAssignmentOpen} onOpenChange={setNewAssignmentOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
              <DialogDescription>Add a new assignment to the platform for students to submit against.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course ID</Label>
                  <Input id="courseId" value={newCourseId} onChange={e => setNewCourseId(e.target.value)} placeholder="CS101" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input id="courseName" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Introduction to CS" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignTitle">Assignment Title</Label>
                <Input id="assignTitle" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Final Essay" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input id="dueDate" type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setNewAssignmentOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAssignment.isPending || !newCourseId || !newCourseName || !newTitle}>
                  {createAssignment.isPending ? "Creating…" : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="overview" disabled={!selectedAssignmentId}>Assignment Overview</TabsTrigger>
          <TabsTrigger value="graph" disabled={!selectedAssignmentId}>Collusion Graph</TabsTrigger>
          <TabsTrigger value="templates" disabled={!selectedAssignmentId}>Templates</TabsTrigger>
          <TabsTrigger value="removed" disabled={!selectedAssignmentId}>
            Removed Papers
            {deletedSubmissions.length > 0 && (
              <Badge variant="outline" className="ml-2 px-1.5 py-0.5 text-[10px] bg-secondary/80 text-foreground">{deletedSubmissions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Pending Disputes 
            {disputes.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-[10px]">{disputes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {selectedAssignmentId ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Submissions</CardDescription>
                    <CardTitle className="text-4xl">{selectedAssignment?.submissionCount || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Flagged for Review</CardDescription>
                    <CardTitle className="text-4xl text-destructive">{selectedAssignment?.flaggedCount || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Due Date</CardDescription>
                    <CardTitle className="text-xl mt-2 font-mono">
                      {selectedAssignment?.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString() : 'N/A'}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSubmissions ? (
                    <div className="space-y-2">
                      <div className="h-10 bg-secondary/50 rounded animate-pulse"></div>
                      <div className="h-10 bg-secondary/50 rounded animate-pulse"></div>
                      <div className="h-10 bg-secondary/50 rounded animate-pulse"></div>
                    </div>
                  ) : submissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No submissions for this assignment.</p>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div>
                            <p className="font-medium">{sub.studentName}</p>
                            <p className="text-sm text-muted-foreground font-mono">{sub.studentEmail}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {sub.grade && (
                              <div className="text-right border-r pr-4 border-border">
                                <p className="text-xs text-muted-foreground">Grade</p>
                                <p className="font-bold text-primary font-mono">{sub.grade}</p>
                              </div>
                            )}
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">AI Score</p>
                              <p className={`font-mono ${sub.aiScore > 70 ? 'text-destructive font-bold' : ''}`}>{sub.aiScore}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Plagiarism</p>
                              <p className={`font-mono ${sub.plagiarismScore > 70 ? 'text-destructive font-bold' : ''}`}>{sub.plagiarismScore}%</p>
                            </div>
                            <Badge variant={sub.status === 'clean' ? 'outline' : sub.status.includes('flagged') ? 'destructive' : 'secondary'}>
                              {sub.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => {
                                  setGradingSubmissionId(sub.id);
                                  setGradingGrade(sub.grade || "");
                                  setGradingFeedback(sub.feedback || "");
                                  setGradingStudent(sub.studentName);
                                }}
                              >
                                Grade
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="Preview submission text"
                                onClick={() => {
                                  setPreviewContent(sub.content);
                                  setPreviewStudent(sub.studentName);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title="Remove paper"
                                onClick={() => handleDeleteSubmission(sub.id)}
                                disabled={deleteSubmission.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
              Please select an assignment to view its overview.
            </div>
          )}
        </TabsContent>

        <TabsContent value="graph">
          {selectedAssignmentId ? (
            <Card>
              <CardHeader>
                <CardTitle>Collusion Graph</CardTitle>
                <CardDescription>Visualizing similarities between student submissions. Thicker red lines indicate higher similarity.</CardDescription>
              </CardHeader>
              <CardContent className="h-[600px]">
                {loadingGraph ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground animate-pulse">Computing network layout...</p>
                  </div>
                ) : (
                  <CollusionGraph nodes={graphData.nodes || []} edges={graphData.edges || []} height={550} />
                )}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="templates">
          {selectedAssignmentId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skeleton Code Templates</CardTitle>
                  <CardDescription>These templates are ignored during plagiarism checks.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTemplates ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-12 bg-secondary/50 rounded"></div>
                      <div className="h-12 bg-secondary/50 rounded"></div>
                    </div>
                  ) : assignmentTemplates.length === 0 ? (
                    <div className="border border-dashed p-8 text-center text-muted-foreground rounded-lg">
                      No templates uploaded for this assignment.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignmentTemplates.map(template => (
                        <div key={template.id} className="flex justify-between items-center p-3 border rounded-md bg-secondary/10">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="font-mono text-sm font-medium">{template.filename}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deleteTemplate.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="filename">Filename</Label>
                      <Input 
                        id="filename" 
                        value={templateFilename} 
                        onChange={(e) => setTemplateFilename(e.target.value)} 
                        placeholder="e.g. main.py, interface.ts" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Template Code</Label>
                      <Textarea 
                        id="content" 
                        value={templateContent} 
                        onChange={(e) => setTemplateContent(e.target.value)} 
                        placeholder="Paste skeleton code here..." 
                        className="font-mono text-xs min-h-[150px]"
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={createTemplate.isPending || !templateFilename || !templateContent}>
                      <Upload className="w-4 h-4" />
                      {createTemplate.isPending ? "Uploading..." : "Save Template"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          {loadingDisputes ? (
            <p>Loading disputes...</p>
          ) : disputes.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
              No pending disputes require your attention.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {disputes.map(dispute => (
                <Card key={dispute.id} className="border-l-4 border-l-amber-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{dispute.studentName}</CardTitle>
                        <CardDescription>Submission #{dispute.submissionId} • Filed on {new Date(dispute.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending Review</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-secondary/30 p-4 rounded-md text-sm">
                      <p className="font-semibold mb-2">Student's Rationale:</p>
                      <p className="font-serif italic text-muted-foreground">{dispute.rationale}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Instructor Notes (Visible to student):</p>
                      <Textarea 
                        placeholder="Add your review notes here..." 
                        value={instructorNote[dispute.id] || ""}
                        onChange={(e) => setInstructorNote(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3 bg-secondary/10 pt-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDisputeAction(dispute.id, 'rejected')}
                      disabled={updateDispute.isPending}
                    >
                      Reject Dispute
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700" 
                      onClick={() => handleDisputeAction(dispute.id, 'approved')}
                      disabled={updateDispute.isPending}
                    >
                      Approve Dispute (Clear Flags)
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="removed" className="space-y-6">
          {selectedAssignmentId ? (
            <Card>
              <CardHeader>
                <CardTitle>Removed Submissions</CardTitle>
                <CardDescription>
                  Submissions that have been soft-deleted by students or instructors. Student-deleted submissions are cached here for verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubmissions ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-secondary/50 rounded animate-pulse"></div>
                    <div className="h-10 bg-secondary/50 rounded animate-pulse"></div>
                  </div>
                ) : deletedSubmissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No removed submissions for this assignment.</p>
                ) : (
                  <div className="space-y-4">
                    {deletedSubmissions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-4 border border-dashed rounded-md bg-secondary/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-muted-foreground line-through">{sub.studentName}</p>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              Removed by {sub.deletedBy || 'student'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{sub.studentEmail}</p>
                          {sub.deletedAt && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Removed on {new Date(sub.deletedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-muted-foreground">
                            <p className="text-xs">AI Score</p>
                            <p className="font-mono">{sub.aiScore}%</p>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <p className="text-xs">Plagiarism</p>
                            <p className="font-mono">{sub.plagiarismScore}%</p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setPreviewContent(sub.content);
                              setPreviewStudent(sub.studentName);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>

      <Dialog open={previewContent !== null} onOpenChange={(open) => !open && setPreviewContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Submission Preview</DialogTitle>
            <DialogDescription>
              Viewing submission text for {previewStudent}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-[300px] p-4 bg-secondary/30 rounded border border-border mt-4">
            <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {previewContent}
            </pre>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setPreviewContent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={gradingSubmissionId !== null} onOpenChange={(open) => !open && setGradingSubmissionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Assign a grade and feedback for {gradingStudent}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGradeSubmission} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={gradingGrade}
                onChange={e => setGradingGrade(e.target.value)}
                placeholder="e.g. A, B+, 92/100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradingFeedback}
                onChange={e => setGradingFeedback(e.target.value)}
                placeholder="Write student feedback here..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setGradingSubmissionId(null)}>Cancel</Button>
              <Button type="submit" disabled={updateSubmission.isPending}>
                {updateSubmission.isPending ? "Saving..." : "Save Grade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
