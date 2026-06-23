import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListAssignments,
  useListTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  getListTemplatesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, Upload, FolderOpen } from "lucide-react";

export default function InstructorTemplates() {
  const { data: assignments = [], isLoading: loadingAssignments } = useListAssignments();
  const { data: templates = [], isLoading: loadingTemplates } = useListTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");

  const filteredTemplates = selectedAssignmentId
    ? templates.filter((t) => t.assignmentId.toString() === selectedAssignmentId)
    : templates;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !filename || !content) return;

    createTemplate.mutate(
      { data: { assignmentId: parseInt(selectedAssignmentId), filename, content } },
      {
        onSuccess: () => {
          toast({ title: "Template saved", description: `${filename} has been uploaded.` });
          setFilename("");
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        },
        onError: () => {
          toast({ title: "Upload failed", description: "Could not save the template.", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    deleteTemplate.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Template removed", description: `${name} has been deleted.` });
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        },
      }
    );
  };

  const getAssignmentLabel = (assignmentId: number) => {
    const a = assignments.find((x) => x.id === assignmentId);
    return a ? `${a.courseId}: ${a.title}` : `Assignment #${assignmentId}`;
  };

  return (
    <AppLayout
      title="Skeleton Code Templates"
      subtitle="Manage starter files that are excluded from plagiarism checks"
      role="instructor"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Upload form */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Template
              </CardTitle>
              <CardDescription>
                Upload skeleton code for an assignment. Students' submissions will be compared against this to avoid false plagiarism flags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment">Assignment</Label>
                  <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                    <SelectTrigger id="assignment" className="bg-background">
                      <SelectValue placeholder="Select assignment…" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAssignments ? (
                        <SelectItem value="loading" disabled>Loading…</SelectItem>
                      ) : assignments.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.courseId}: {a.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filename">Filename</Label>
                  <Input
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="e.g. main.py, BinaryTree.java"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Template Code</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste skeleton / starter code here…"
                    className="font-mono text-xs min-h-[220px] resize-y"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={createTemplate.isPending || !selectedAssignmentId || !filename || !content}
                >
                  <Upload className="w-4 h-4" />
                  {createTemplate.isPending ? "Saving…" : "Save Template"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Templates list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Uploaded Templates</h2>
              <p className="text-sm text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
                {selectedAssignmentId ? " for selected assignment" : " total"}
              </p>
            </div>
            {selectedAssignmentId && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedAssignmentId("")}>
                Show all
              </Button>
            )}
          </div>

          {loadingTemplates ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-secondary/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="border border-dashed rounded-lg p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <FolderOpen className="w-10 h-10 opacity-30" />
              <p className="font-medium">No templates yet</p>
              <p className="text-sm">Upload your first skeleton code file using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="group">
                  <CardContent className="flex items-start justify-between p-4 gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 p-2 bg-primary/10 rounded-md shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-semibold text-sm truncate">{template.filename}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {getAssignmentLabel(template.assignmentId)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {template.content.split("\n").length} lines
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Uploaded {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(template.id, template.filename)}
                      disabled={deleteTemplate.isPending}
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>

                  {/* Code preview */}
                  <div className="px-4 pb-4">
                    <pre className="text-[11px] font-mono bg-secondary/30 rounded-md p-3 overflow-x-auto max-h-28 text-muted-foreground leading-relaxed">
                      {template.content.slice(0, 400)}{template.content.length > 400 ? "\n…" : ""}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
