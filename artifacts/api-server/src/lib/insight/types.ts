export interface PaperInsightInput {
  id: string;
  title: string;
  abstract: string;
  filename?: string;
  year?: number;
}

export interface EvidenceReliability {
  paperId: string;
  paperTitle: string;
  score: number; // 0-100
  reliabilityLevel: "Low" | "Medium" | "High" | "Exceptional";
  supportingEvidence: Array<{ signal: string; sentence: string }>;
  weaknesses: string[];
  confidence: number; // 0-100
  explanation: string;
}

export interface ClaimNode {
  id: string;
  label: string; // the cleaned claim statement
  paperId: string;
  paperTitle: string;
}

export interface ClaimEdge {
  sourceClaimId: string;
  targetClaimId: string;
  type: "supports" | "extends" | "contradicts";
  evidence: string[]; // includes explanation, confidence, shared concepts, source sentences
  semanticType?: "supports" | "extends" | "contradicts" | "summarizes" | "improves"; // richer semantic type
  confidence?: number; // 0-100
  sharedConcepts?: string[]; // taxonomy-matched shared concepts driving this edge
  explanation?: string; // human-readable deterministic explanation
}

export interface ClaimNetwork {
  nodes: ClaimNode[];
  edges: ClaimEdge[];
}

export interface TimelineEntry {
  year: number;
  papers: string[];
  concepts: string[];
  methodologies: string[];
  findings: string[];
}

export interface AcademicInsightAnalysis {
  reliability: EvidenceReliability[];
  claimNetwork: ClaimNetwork;
  timeline: TimelineEntry[];
  rankedConcepts: string[]; // top 10-15 taxonomy-scored scientific concepts across the corpus
}
