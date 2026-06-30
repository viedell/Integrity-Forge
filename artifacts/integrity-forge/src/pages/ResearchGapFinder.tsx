import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListGapAnalyses,
  useCreateGapAnalysis,
  useDeleteGapAnalysis,
  getListGapAnalysesQueryKey,
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
  Lightbulb,
  TrendingUp,
  Layers,
  Sparkles,
  Copy,
  ChevronRight,
  Globe,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface Paper {
  id?: string;
  filename?: string;
  title: string;
  abstract: string;
}

export default function ResearchGapFinder() {
  const { data: analyses = [], isLoading: loadingAnalyses } = useListGapAnalyses();
  const createGapAnalysis = useCreateGapAnalysis();
  const deleteGapAnalysis = useDeleteGapAnalysis();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [savedProjectName, setSavedProjectName] = useState("");

  // Paper Entry Form State
  const [paperTitle, setPaperTitle] = useState("");
  const [paperAbstract, setPaperAbstract] = useState("");
  const [paperFilename, setPaperFilename] = useState("");
  const [papersList, setPapersList] = useState<Paper[]>([]);

  // Selected Analysis
  const selectedProject = analyses.find(a => a.id.toString() === selectedProjectId);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    // Save the project name before clearing the form (used as domain hint for the analyzer)
    setSavedProjectName(newProjectName.trim());
    // Reset forms and list
    setPapersList([]);
    setNewProjectName("");
    setNewProjectOpen(false);
    setSelectedProjectId("new-temp"); // indicates we are configuring a new project
  };

  const handleAddPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperTitle.trim() || !paperAbstract.trim()) return;

    const newPaper: Paper = {
      title: paperTitle,
      abstract: paperAbstract,
      filename: paperFilename || `paper_${papersList.length + 1}.txt`,
    };

    setPapersList(prev => [...prev, newPaper]);
    setPaperTitle("");
    setPaperAbstract("");
    setPaperFilename("");

    toast({ title: "Paper added", description: "Added to the local collection." });
  };

  // Simulating dragging or uploading files
  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const formattedTitle = nameWithoutExt
      .split(/[-_]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Simulating abstract extraction
    const mockAbstracts = [
      `This paper examines key methodologies in ${formattedTitle}. We conduct an empirical study validating efficiency gains, though future research is needed to audit scalability and security aspects.`,
      `We propose a novel framework for ${formattedTitle} in resource-constrained environments. While performance metrics are positive, ethical implications and algorithmic fairness remain underexplored.`,
      `An analytical evaluation of ${formattedTitle} implementations. Our longitudinal survey highlights core benefits, but fails to address transferability to adjacent target domains.`
    ];
    const randomAbstract = mockAbstracts[Math.floor(Math.random() * mockAbstracts.length)];

    const newPaper: Paper = {
      title: formattedTitle,
      abstract: randomAbstract,
      filename: file.name,
    };

    setPapersList(prev => [...prev, newPaper]);
    toast({ title: "File processed", description: `Extracted meta-data from ${file.name}` });
  };

  const handleRunAnalysis = () => {
    if (papersList.length === 0) return;

    const projectName = selectedProjectId === "new-temp" ? (savedProjectName || "My Research Collection") : (selectedProject?.projectName || "Research Project");

    createGapAnalysis.mutate({
      data: {
        projectName,
        papers: papersList
      }
    }, {
      onSuccess: (data) => {
        toast({ title: "Analysis complete", description: "Research gaps and topic clusters identified!" });
        queryClient.invalidateQueries({ queryKey: getListGapAnalysesQueryKey() });
        setSelectedProjectId(data.id.toString());
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to generate research gap analysis.", variant: "destructive" });
      }
    });
  };

  const handleDeleteProject = (id: number) => {
    if (!confirm("Are you sure you want to delete this research project?")) return;

    deleteGapAnalysis.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Project deleted", description: "The gap analysis has been removed." });
        queryClient.invalidateQueries({ queryKey: getListGapAnalysesQueryKey() });
        setSelectedProjectId("");
      }
    });
  };

  const handleCopyQuestion = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Research question copied to clipboard." });
  };

  return (
    <AppLayout title="Research Gap Finder" subtitle="Discover what hasn't been researched yet" role="student">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Project Manager */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">My Research Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingAnalyses ? (
                <div className="space-y-2">
                  <div className="h-9 bg-secondary/50 rounded animate-pulse"></div>
                  <div className="h-9 bg-secondary/50 rounded animate-pulse"></div>
                </div>
              ) : analyses.length === 0 && selectedProjectId !== "new-temp" ? (
                <p className="text-xs text-muted-foreground py-2">No projects created yet.</p>
              ) : (
                <div className="space-y-1">
                  {analyses.map(a => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedProjectId(a.id.toString())}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm cursor-pointer transition-colors flex items-center justify-between group ${
                        selectedProjectId === a.id.toString()
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary/80 text-foreground"
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">{a.projectName}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(a.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all ${
                          selectedProjectId === a.id.toString() ? "text-primary-foreground hover:text-primary-foreground" : ""
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {selectedProjectId === "new-temp" && (
                    <div className="px-3 py-2 rounded-md text-sm bg-secondary text-foreground border border-dashed font-medium">
                      Configure New Project
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full gap-2 mt-4"
                onClick={() => setNewProjectOpen(true)}
              >
                <Plus className="w-4 h-4" /> New Collection
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          
          {/* New Project Setup Form (Dialog style) */}
          {newProjectOpen && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Create New Research Collection</CardTitle>
                <CardDescription>Name your capstone or thesis area to start grouping research papers.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateProject}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projName">Research Topic / Title</Label>
                    <Input
                      id="projName"
                      placeholder="e.g. Artificial Intelligence in Special Education"
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setNewProjectOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!newProjectName.trim()}>Start Collection</Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Configuration View (New temp project or configuring papers) */}
          {selectedProjectId === "new-temp" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Paper Adder Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Research Papers</CardTitle>
                  <CardDescription>
                    Add at least 2 papers (by abstract) to cluster topics and identify underexplored areas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPaper} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Paper Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Deep Learning for Dyslexia Detection"
                        value={paperTitle}
                        onChange={e => setPaperTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filename">Filename (Optional)</Label>
                      <Input
                        id="filename"
                        placeholder="e.g. study_2024.pdf"
                        value={paperFilename}
                        onChange={e => setPaperFilename(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="abstract">Abstract / Main Content</Label>
                      <Textarea
                        id="abstract"
                        placeholder="Paste the abstract, summary, or introduction here..."
                        rows={6}
                        value={paperAbstract}
                        onChange={e => setPaperAbstract(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="border-t pt-4">
                      <Label className="block mb-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Or Simulated PDF Upload
                      </Label>
                      <Input
                        type="file"
                        accept=".txt,.pdf"
                        onChange={handleSimulatedUpload}
                        className="cursor-pointer"
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={!paperTitle || !paperAbstract}>
                      <Plus className="w-4 h-4" /> Add Paper
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Papers Queue */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Papers Collection</span>
                    <Badge variant="secondary">{papersList.length} Added</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 overflow-y-auto max-h-[350px]">
                  {papersList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-48 text-muted-foreground border border-dashed rounded-lg p-6">
                      <FileText className="w-8 h-8 mb-2" />
                      <p className="text-sm font-semibold">No papers added yet</p>
                      <p className="text-xs">Type manually or select a PDF above to simulate paper extraction.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {papersList.map((paper, idx) => (
                        <div key={idx} className="p-3 border rounded-md relative group bg-secondary/20">
                          <button
                            onClick={() => setPapersList(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <p className="text-sm font-semibold truncate pr-6">{paper.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{paper.filename}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 italic">
                            {paper.abstract}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 bg-secondary/10">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={papersList.length < 2 || createGapAnalysis.isPending}
                    onClick={handleRunAnalysis}
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    {createGapAnalysis.isPending ? "Analyzing Papers..." : "Analyze & Discover Gaps"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : selectedProject ? (
            
            // Project Results View
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-card p-4 border rounded-lg shadow-sm">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{selectedProject.projectName}</h2>
                  <p className="text-xs text-muted-foreground">Generated on {new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Analysis Up-to-Date</Badge>
              </div>

              <Tabs defaultValue="domain" className="space-y-6">
                <TabsList className="bg-secondary/50 p-1 flex-wrap h-auto gap-1">
                  <TabsTrigger value="domain" className="gap-1.5">
                    <Globe className="w-4 h-4" /> Domain
                  </TabsTrigger>
                  <TabsTrigger value="gaps" className="gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Research Gaps
                  </TabsTrigger>
                  <TabsTrigger value="topics" className="gap-1.5">
                    <Layers className="w-4 h-4" /> Topic Clusters
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Trend Metrics
                  </TabsTrigger>
                  <TabsTrigger value="papers" className="gap-1.5">
                    <BookOpen className="w-4 h-4" /> Papers ({selectedProject.papers.length})
                  </TabsTrigger>
                </TabsList>

                {/* Domain Classification Tab */}
                <TabsContent value="domain" className="space-y-6">
                  {/* Detected Domains */}
                  {(selectedProject.analysis as any).detectedDomains?.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> Detected Research Domains</CardTitle>
                        <CardDescription>Confidence scores based on keyword frequency matching across uploaded papers.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {((selectedProject.analysis as any).detectedDomains as Array<{domainKey: string; displayName: string; confidence: number}>).map((d, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm font-semibold">
                              <span>{d.displayName}</span>
                              <span className="font-mono text-muted-foreground">{d.confidence}%</span>
                            </div>
                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${i === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'}`} style={{ width: `${d.confidence}%` }} />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                      <CardContent className="flex items-center gap-3 pt-4">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">Domain classification is not available for this project. Re-run the analysis to generate domain detection results.</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Coverage Analysis */}
                  {(selectedProject.analysis as any).coverageAnalysis?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Literature Coverage Analysis</CardTitle>
                        <CardDescription>Per-topic breakdown of what existing research covers, partially explores, and leaves missing.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {((selectedProject.analysis as any).coverageAnalysis as Array<{topic: string; covered: string; partial: string; missing: string}>).map((c, i) => (
                          <div key={i} className="border rounded-lg overflow-hidden">
                            <div className="bg-secondary/40 px-4 py-2 font-bold text-sm">{c.topic}</div>
                            <div className="divide-y">
                              <div className="flex gap-3 p-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded h-fit shrink-0">Covered</span>
                                <p className="text-xs text-foreground/80 leading-relaxed">{c.covered}</p>
                              </div>
                              <div className="flex gap-3 p-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded h-fit shrink-0">Partial</span>
                                <p className="text-xs text-foreground/80 leading-relaxed">{c.partial}</p>
                              </div>
                              <div className="flex gap-3 p-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded h-fit shrink-0">Missing</span>
                                <p className="text-xs text-foreground/80 leading-relaxed">{c.missing}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Validation Notes */}
                  {(selectedProject.analysis as any).validationNotes?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /> Validation Log</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {((selectedProject.analysis as any).validationNotes as string[]).map((note, i) => (
                            <li key={i} className={`text-xs font-mono px-2 py-1 rounded ${
                              note.includes('FAIL') ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                              note.includes('WARN') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            }`}>{note}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Research Gaps Tab */}
                <TabsContent value="gaps" className="space-y-6">
                  {selectedProject.analysis.gaps.map((gap, idx) => (
                    <Card key={idx} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg text-primary flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                            {gap.title}
                          </CardTitle>
                          {(gap as any).confidence !== undefined && (
                            <div className="flex flex-col items-end shrink-0">
                              <span className={`text-sm font-bold ${(gap as any).confidence >= 80 ? 'text-emerald-600' : (gap as any).confidence >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                {(gap as any).confidence}% Confidence
                              </span>
                              <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden mt-1">
                                <div className={`h-full rounded-full transition-all ${(gap as any).confidence >= 80 ? 'bg-emerald-500' : (gap as any).confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${(gap as any).confidence}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                        {(gap as any).categories && (gap as any).categories.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap pt-2">
                            {(gap as any).categories.map((cat: string, cidx: number) => (
                              <Badge key={cidx} variant="secondary" className="text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">{cat}</Badge>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm leading-relaxed text-foreground/90">{gap.description}</p>
                        
                        {/* New Methodology Recommendation Section */}
                        {(gap as any).methodologyRecommendation && (
                          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Suggested Methodology
                            </h4>
                            <div className="flex gap-2 flex-wrap mb-2">
                              {(gap as any).methodologyRecommendation.recommendedMethods.map((m: string, midx: number) => (
                                <Badge key={midx} variant="outline" className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-black/20">{m}</Badge>
                              ))}
                            </div>
                            <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                              {(gap as any).methodologyRecommendation.reason}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Suggested Capstone/Thesis Research Questions
                          </p>
                          <div className="space-y-2">
                            {gap.questions.map((q, qidx) => (
                              <div key={qidx} className="flex justify-between items-center p-3 border rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors group">
                                <span className="text-sm font-medium text-foreground">{q}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleCopyQuestion(q)}
                                  title="Copy to clipboard"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Expandable Evidence & Validation Details */}
                        {((gap as any).evidence || (gap as any).validation) && (
                          <details className="group border rounded-lg overflow-hidden mt-4">
                            <summary className="text-xs font-semibold bg-secondary/30 px-4 py-2 cursor-pointer hover:bg-secondary/50 flex justify-between items-center transition-colors">
                              <span>Traceability & Validation Details</span>
                              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                            </summary>
                            <div className="p-4 space-y-4 bg-card text-xs">
                              {(gap as any).evidence && (
                                <div className="space-y-2">
                                  <h4 className="font-bold border-b pb-1">Evidence Sources</h4>
                                  <div><span className="font-semibold text-muted-foreground">Reason:</span> {(gap as any).evidence.reason}</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                      <span className="font-semibold text-muted-foreground block mb-1">Source Papers:</span>
                                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                        {(gap as any).evidence.papers.map((p: string, pidx: number) => <li key={pidx} className="truncate" title={p}>{p}</li>)}
                                      </ul>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-muted-foreground block mb-1">Extracted Limitations:</span>
                                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                        {(gap as any).evidence.limitations.map((l: string, lidx: number) => <li key={lidx} className="line-clamp-2" title={l}>{l}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {(gap as any).validation && (
                                <div className="space-y-2 pt-2 border-t">
                                  <h4 className="font-bold border-b pb-1 flex justify-between items-center">
                                    Validation Result
                                    {(gap as any).validation.passed ? (
                                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">PASSED</Badge>
                                    ) : (
                                      <Badge variant="destructive">WARNING</Badge>
                                    )}
                                  </h4>
                                  <ul className="space-y-1 mt-2">
                                    {(gap as any).validation.notes.map((note: string, nidx: number) => (
                                      <li key={nidx} className={`font-mono px-2 py-1 rounded ${
                                        note.includes('FAIL') || note.includes('WARNING') ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                                        note.includes('WARN') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      }`}>{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </CardContent>
                      <CardFooter className="bg-secondary/10 py-3 text-xs flex gap-2 items-center flex-wrap">
                        <span className="font-semibold text-muted-foreground">Supported Gaps from:</span>
                        {gap.papers.map((p, pidx) => (
                          <Badge key={pidx} variant="outline" className="font-mono text-[10px] truncate max-w-[200px]" title={p}>
                            {p}
                          </Badge>
                        ))}
                      </CardFooter>
                    </Card>
                  ))}
                </TabsContent>

                {/* Topic Clusters Tab */}
                <TabsContent value="topics">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedProject.analysis.topics.map((topic, idx) => (
                      <Card key={idx}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-bold text-foreground">{topic.name}</CardTitle>
                            <Badge>{topic.count} Papers</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Contributing Documents
                          </p>
                          <div className="space-y-1.5">
                            {topic.papers.map((p, pidx) => (
                              <div key={pidx} className="flex items-center gap-2 text-sm text-foreground/80 py-1 border-b last:border-0">
                                <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="truncate">{p}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Trend Metrics Tab */}
                <TabsContent value="trends" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Research Term Densities</CardTitle>
                      <CardDescription>
                        Visualizing term prevalence in your uploaded paper collection. Higher density suggests dominant topics.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedProject.analysis.trends.map((trend, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-foreground">{trend.name}</span>
                            <span className="text-muted-foreground font-mono">{trend.score}% Density</span>
                          </div>
                          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              style={{ width: `${trend.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Papers List Tab */}
                <TabsContent value="papers" className="space-y-4">
                  {selectedProject.papers.map((paper, idx) => (
                    <Card key={idx} className="hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">{paper.title}</CardTitle>
                        <CardDescription className="font-mono text-xs">{paper.filename}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Extracted Abstract
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/10 p-3 rounded border font-sans">
                          {paper.abstract}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            
            // Empty State (No project selected/configuring)
            <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed rounded-lg bg-card shadow-sm p-8">
              <BookOpen className="w-16 h-16 text-muted-foreground/60 mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold tracking-tight mb-2">Research Gap Finder</h2>
              <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                Create a new research collection to cluster uploaded papers, visualize key trends, discover underexplored areas, and generate capstone research questions.
              </p>
              <Button size="lg" className="gap-2" onClick={() => setNewProjectOpen(true)}>
                <Plus className="w-5 h-5" /> Start First Project
              </Button>
            </div>
          )}

        </div>

      </div>
    </AppLayout>
  );
}
