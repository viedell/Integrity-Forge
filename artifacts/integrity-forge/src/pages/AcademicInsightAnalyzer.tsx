import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListAcademicInsights,
  useCreateAcademicInsight,
  useDeleteAcademicInsight,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  TrendingUp,
  Award,
  AlertTriangle,
  GitBranch,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Brain,
  History,
  FileSpreadsheet,
  Sparkles,
  Network,
  Zap
} from "lucide-react";

interface Paper {
  id?: string;
  filename?: string;
  title: string;
  abstract: string;
  year?: number;
}

export default function AcademicInsightAnalyzer() {
  const { data: insights = [], isLoading: loadingInsights } = useListAcademicInsights();
  const createInsight = useCreateAcademicInsight();
  const deleteInsight = useDeleteAcademicInsight();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Paper Entry Form State
  const [paperTitle, setPaperTitle] = useState("");
  const [paperAbstract, setPaperAbstract] = useState("");
  const [paperFilename, setPaperFilename] = useState("");
  const [paperYear, setPaperYear] = useState<string>("");
  const [papersList, setPapersList] = useState<Paper[]>([]);

  // Selected Insight Analysis
  const selectedInsight = insights.find(i => i.id.toString() === selectedProjectId);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setPapersList([]);
    setNewProjectName("");
    setNewProjectOpen(false);
    setSelectedProjectId("new-temp"); // indicates we are configuring a new project
  };

  const handleAddPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperTitle.trim() || !paperAbstract.trim()) return;

    const parsedYear = paperYear ? parseInt(paperYear, 10) : undefined;

    const newPaper: Paper = {
      title: paperTitle,
      abstract: paperAbstract,
      filename: paperFilename || `paper_${papersList.length + 1}.txt`,
      year: parsedYear && !isNaN(parsedYear) ? parsedYear : undefined
    };

    setPapersList(prev => [...prev, newPaper]);
    setPaperTitle("");
    setPaperAbstract("");
    setPaperFilename("");
    setPaperYear("");

    toast({ title: "Paper added", description: "Added to the local collection." });
  };

  const handleRunAnalysis = async () => {
    if (papersList.length === 0) {
      toast({ title: "No papers", description: "Please add at least one paper first.", variant: "destructive" });
      return;
    }

    try {
      const name = newProjectName || `Insight Project — ${new Date().toLocaleDateString()}`;
      const payload = {
        projectName: name,
        papers: papersList.map(p => ({
          filename: p.filename,
          title: p.title,
          abstract: p.abstract,
          year: p.year
        }))
      };

      const result = await createInsight.mutateAsync({ data: payload });
      toast({ title: "Success", description: "Insights generated successfully." });
      // Invalidate query to refetch list
      queryClient.invalidateQueries({ queryKey: ["/academic-insights"] });
      setSelectedProjectId(result.id.toString());
    } catch (err: any) {
      toast({ title: "Failed to generate insights", description: err.message || "An error occurred.", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteInsight.mutateAsync({ id });
      toast({ title: "Project deleted", description: "The project has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/academic-insights"] });
      if (selectedProjectId === id.toString()) {
        setSelectedProjectId("");
      }
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message || "Failed to delete.", variant: "destructive" });
    }
  };

  const getReliabilityBadgeVariant = (level: string) => {
    switch (level) {
      case "Exceptional": return "default";
      case "High": return "secondary";
      case "Medium": return "outline";
      default: return "destructive";
    }
  };

  return (
    <AppLayout title="Academic Insight Analyzer" subtitle="Deterministic research reliability, claim networks, and timeline evolution" role="student">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 container max-w-7xl mx-auto p-4 flex-1">
        {/* Sidebar Project List */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col min-h-[400px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Insight Projects</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewProjectOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription className="text-xs">Select or create an academic insight project.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-2 space-y-1">
              {loadingInsights ? (
                <div className="text-xs text-muted-foreground text-center py-8">Loading projects...</div>
              ) : insights.length === 0 && selectedProjectId !== "new-temp" ? (
                <div className="text-xs text-muted-foreground text-center py-8">No insight projects found. Click the + icon to start one.</div>
              ) : (
                <>
                  {selectedProjectId === "new-temp" && (
                    <div className="w-full flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20 text-xs font-medium">
                      <span className="truncate">New Configuration</span>
                      <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => setSelectedProjectId("")}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                  {insights.map(item => (
                    <div
                      key={item.id}
                      className={`group w-full flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                        selectedProjectId === item.id.toString() ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => setSelectedProjectId(item.id.toString())}
                    >
                      <span className="truncate font-medium">{item.projectName}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workspace Panels */}
        <div className="md:col-span-3">
          {newProjectOpen ? (
            <Card>
              <form onSubmit={handleCreateProject}>
                <CardHeader>
                  <CardTitle>Create Insight Project</CardTitle>
                  <CardDescription>Enter a project name to start configuring your literature collection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="e.g. LLM Reasoning System Insights"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setNewProjectOpen(false)}>Cancel</Button>
                  <Button type="submit">Configure Project</Button>
                </CardFooter>
              </form>
            </Card>
          ) : selectedProjectId === "new-temp" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paper Collector</CardTitle>
                  <CardDescription>Add academic papers to evaluate reliability, construct claim networks, and map chronological evolution.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPaper} className="space-y-4 border p-4 rounded-lg bg-card/50">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="paperTitle">Paper Title</Label>
                        <Input
                          id="paperTitle"
                          placeholder="e.g. Deep Neural Networks for Intrusion Detection"
                          value={paperTitle}
                          onChange={(e) => setPaperTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paperYear">Publication Year (Optional)</Label>
                        <Input
                          id="paperYear"
                          type="number"
                          min="1900"
                          max="2100"
                          placeholder="e.g. 2024"
                          value={paperYear}
                          onChange={(e) => setPaperYear(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paperAbstract">Abstract</Label>
                      <Textarea
                        id="paperAbstract"
                        placeholder="Paste abstract or core findings text here..."
                        rows={4}
                        value={paperAbstract}
                        onChange={(e) => setPaperAbstract(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paperFilename">Filename (Optional)</Label>
                      <Input
                        id="paperFilename"
                        placeholder="e.g. nids_evaluation_2024.txt"
                        value={paperFilename}
                        onChange={(e) => setPaperFilename(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full">Add Paper to Project</Button>
                  </form>

                  {papersList.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Papers in Collection ({papersList.length})</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {papersList.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground flex items-center gap-2">
                                <span>{p.title}</span>
                                {p.year && <Badge variant="outline">{p.year}</Badge>}
                              </p>
                              <p className="text-muted-foreground line-clamp-1">{p.abstract}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={() => setPapersList(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="ghost" onClick={() => setSelectedProjectId("")}>Discard</Button>
                  <Button onClick={handleRunAnalysis} disabled={papersList.length === 0}>Generate Insights & Analyze</Button>
                </CardFooter>
              </Card>
            </div>
          ) : selectedInsight ? (
            <Tabs defaultValue="reliability" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reliability" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Evidence Reliability
                </TabsTrigger>
                <TabsTrigger value="claim-network" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Claim Network
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Evolution Timeline
                </TabsTrigger>
                <TabsTrigger value="concepts" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Corpus Concepts
                </TabsTrigger>
              </TabsList>

              {/* Reliability Analyzer panel */}
              <TabsContent value="reliability" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evidence Reliability Assessment</CardTitle>
                    <CardDescription>Evaluating study design, methodology transparency, statistical evaluations, and benchmark metrics.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedInsight.analysis.reliability.map((item, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-4 bg-card">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-sm text-foreground">{item.paperTitle}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getReliabilityBadgeVariant(item.reliabilityLevel)}>
                                {item.reliabilityLevel} Reliability
                              </Badge>
                              <span className="text-xs text-muted-foreground">Confidence: {item.confidence}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{item.score}</span>
                            <span className="text-xs text-muted-foreground block">Score</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded leading-relaxed">{item.explanation}</p>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Supporting Signals Found</h4>
                          {item.supportingEvidence.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No key reliability signals detected in the text.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {item.supportingEvidence.map((ev, eIdx) => (
                                <div key={eIdx} className="flex items-start gap-2 text-xs border p-2 rounded bg-accent/20">
                                  <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-semibold block text-foreground">{ev.signal}</span>
                                    <p className="text-muted-foreground italic mt-0.5">"{ev.sentence}"</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {item.weaknesses.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-destructive">Gaps & Weaknesses</h4>
                            <ul className="space-y-1">
                              {item.weaknesses.map((w, wIdx) => (
                                <li key={wIdx} className="text-xs text-muted-foreground flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>              {/* Claim Network panel */}
              <TabsContent value="claim-network" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Claim &amp; Hypothesis Graph</CardTitle>
                    <CardDescription>Analyzing intersections, supports, extensions, and contradictions between extracted claim statements.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Nodes Summary */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extracted Claims</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedInsight.analysis.claimNetwork.nodes.map((node, idx) => (
                            <div key={idx} className="p-3 border rounded-lg bg-accent/10 flex items-center justify-between text-xs">
                              <div className="space-y-1">
                                <span className="font-mono text-muted-foreground uppercase">{node.id}</span>
                                <p className="font-medium text-foreground">"{node.label}"</p>
                                <p className="text-muted-foreground italic">Paper: "{node.paperTitle}"</p>
                              </div>
                              <Badge variant="outline">Claim Node</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Edges Summary — richer display */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deterministic Graph Edges</h4>
                        {selectedInsight.analysis.claimNetwork.edges.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic border p-6 rounded-lg text-center bg-card">
                            No distinct relationships or overlaps detected among paper claims.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {selectedInsight.analysis.claimNetwork.edges.map((edge, idx) => {
                              const semanticType = (edge as any).semanticType ?? edge.type;
                              const confidence = (edge as any).confidence as number | undefined;
                              const sharedConcepts = (edge as any).sharedConcepts as string[] | undefined;
                              const explanation = (edge as any).explanation as string | undefined;
                              return (
                                <div key={idx} className="p-4 border rounded-lg bg-card space-y-3 text-xs">
                                  {/* Header row: source → target + badge */}
                                  <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{edge.sourceClaimId}</span>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{edge.targetClaimId}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {/* Semantic type badge — richer label */}
                                      <Badge variant={
                                        edge.type === "contradicts" ? "destructive" :
                                        edge.type === "extends" ? "default" : "secondary"
                                      }>
                                        {semanticType.toUpperCase()}
                                      </Badge>
                                      {/* Confidence indicator */}
                                      {confidence !== undefined && (
                                        <span className="text-muted-foreground font-mono">{confidence}% confidence</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Explanation */}
                                  {explanation && (
                                    <div className="flex items-start gap-2 bg-muted/50 rounded p-2">
                                      <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                      <p className="text-muted-foreground leading-relaxed">{explanation}</p>
                                    </div>
                                  )}

                                  {/* Shared Concepts chips */}
                                  {sharedConcepts && sharedConcepts.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="text-muted-foreground font-semibold mr-1 flex items-center gap-1">
                                        <Network className="h-3 w-3" /> Shared:
                                      </span>
                                      {sharedConcepts.map((c, cIdx) => (
                                        <Badge key={cIdx} variant="outline" className="text-[10px] font-normal">{c}</Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* Evidence trace (collapsed by default) */}
                                  <details className="group">
                                    <summary className="cursor-pointer text-muted-foreground select-none hover:text-foreground transition-colors list-none flex items-center gap-1">
                                      <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                                      Trace Evidence
                                    </summary>
                                    <div className="mt-2 space-y-1 border-t pt-2">
                                      {edge.evidence.map((line, lIdx) => (
                                        <p key={lIdx} className="text-muted-foreground leading-relaxed">{line}</p>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Research Evolution Timeline panel */}
              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Research Evolution Timeline</CardTitle>
                    <CardDescription>Chronological visualization of emerging topics, methodologies, and findings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedInsight.analysis.timeline.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic text-center py-8">
                        No publication years found or parsed from the text.
                      </div>
                    ) : (
                      <div className="relative pl-6 border-l border-primary/20 space-y-6">
                        {selectedInsight.analysis.timeline.map((entry, idx) => (
                          <div key={idx} className="space-y-3 relative">
                            {/* Year Indicator Dot */}
                            <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-primary">{entry.year}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {entry.papers.map((p, pIdx) => (
                                  <Badge key={pIdx} variant="outline" className="text-xs max-w-[200px] truncate">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-lg bg-card/50 text-xs">
                              {/* Emerging Concepts */}
                              <div className="space-y-1">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <Brain className="h-3.5 w-3.5 text-blue-500" />
                                  Concepts
                                </span>
                                {entry.concepts.length === 0 ? (
                                  <p className="text-muted-foreground italic">None identified</p>
                                ) : (
                                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                                    {entry.concepts.map((c, cIdx) => <li key={cIdx}>{c}</li>)}
                                  </ul>
                                )}
                              </div>

                              {/* Methodologies */}
                              <div className="space-y-1">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <Layers className="h-3.5 w-3.5 text-purple-500" />
                                  Methodologies
                                </span>
                                {entry.methodologies.length === 0 ? (
                                  <p className="text-muted-foreground italic">None identified</p>
                                ) : (
                                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                                    {entry.methodologies.map((m, mIdx) => <li key={mIdx}>{m}</li>)}
                                  </ul>
                                )}
                              </div>

                              {/* Findings */}
                              <div className="space-y-1">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                  Dominant Findings
                                </span>
                                {entry.findings.length === 0 ? (
                                  <p className="text-muted-foreground italic">None identified</p>
                                ) : (
                                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                                    {entry.findings.map((f, fIdx) => <li key={fIdx} className="line-clamp-3">"{f}"</li>)}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Corpus Concepts panel */}
              <TabsContent value="concepts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Corpus-Level Scientific Concepts</CardTitle>
                    <CardDescription>
                      Top-ranked scientific concepts detected across all uploaded papers, ordered by deterministic taxonomy specificity score.
                      Only domain-specific terms from the scientific taxonomy catalog are included — generic words are filtered out.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!selectedInsight.analysis.rankedConcepts || selectedInsight.analysis.rankedConcepts.length === 0) ? (
                      <div className="text-xs text-muted-foreground italic text-center py-8">
                        No taxonomy-matched concepts found in the uploaded abstracts.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Concept chip cloud */}
                        <div className="flex flex-wrap gap-2">
                          {selectedInsight.analysis.rankedConcepts.map((concept, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="px-3 py-1 text-sm font-medium"
                              style={{
                                opacity: Math.max(0.45, 1 - idx * (0.55 / Math.max(selectedInsight.analysis.rankedConcepts.length - 1, 1))),
                                fontSize: `${Math.max(11, 15 - idx * 0.3)}px`
                              }}
                            >
                              <Sparkles className="h-3 w-3 mr-1.5 inline shrink-0" />
                              {concept}
                            </Badge>
                          ))}
                        </div>

                        {/* Ranked list with ordinal numbering */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ranked Taxonomy List</h4>
                          <ol className="space-y-1.5">
                            {selectedInsight.analysis.rankedConcepts.map((concept, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-xs p-2 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors">
                                <span className="text-muted-foreground font-mono w-5 text-right shrink-0">#{idx + 1}</span>
                                <Brain className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="font-medium text-foreground">{concept}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card/30">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-sm font-semibold">No Insight Project Selected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">Select an existing academic insight project from the sidebar, or click "+" to configure a new collection.</p>
              <Button size="sm" className="mt-4" onClick={() => setNewProjectOpen(true)}>Create Project</Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
