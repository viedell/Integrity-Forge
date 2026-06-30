// ============================================================
// types.ts – Shared interfaces for the domain-aware gap pipeline
// ============================================================

export interface PaperInput {
  id: string;
  title: string;
  abstract: string;
}

export interface DomainMatch {
  domainKey: string;
  displayName: string;
  confidence: number; // 0-100
}

/** A single traceable piece of evidence from a paper */
export interface EvidenceTrace {
  paperId: string;
  paperTitle: string;
  sentence: string;           // The exact sentence that supports this item
  sentenceType: "title" | "objective" | "finding" | "limitation" | "future_work" | "general";
}

/** A validated concept extracted from the corpus */
export interface ExtractedTopic {
  name: string;
  mentions: number;           // how many papers mention this topic
  papers: string[];           // paper titles that discuss it
  representativeTerms: string[];
  specificity: number;        // specificity score (higher = more domain-specific)
  sources: EvidenceTrace[];   // traceable sentences that prove this concept exists
}

export interface CoverageEntry {
  topic: string;
  covered: string;            // what existing studies already address
  partial: string;            // what is only partially explored
  missing: string;            // what appears absent from literature
  sources: EvidenceTrace[];   // evidence traces that back the coverage claim
}

export interface PaperContribution {
  paperId: string;
  paperTitle: string;
  objective: string;
  contributions: string[];
  methodology: string;
  findings: string;
  explicitLimitations: string[];
  implicitLimitations: string[];
}

export interface GapEvidence {
  papers: string[];
  topics: string[];
  contributions: string[];
  limitations: string[];
  reason: string;
  traces?: EvidenceTrace[];   // full sentence-level provenance
}

export interface MethodologyRecommendation {
  recommendedMethods: string[];
  reason: string;
}

export interface GapValidationDetail {
  passed: boolean;
  notes: string[];
}

export interface GapCandidate {
  dimensionId: string;
  domainKey: string;
  title: string;
  description: string;
  papers: string[];
  questions: string[];
  confidence?: number;
  categories?: string[];
  evidence?: GapEvidence;
  methodologyRecommendation?: MethodologyRecommendation;
  validation?: GapValidationDetail;
}

export interface ValidationResult {
  passed: boolean;
  dimensionId: string;
  notes: string[];
}

export interface AnalyzerResult {
  topics: Array<{ name: string; count: number; papers: string[] }>;
  gaps: Array<{
    title: string;
    description: string;
    papers: string[];
    questions: string[];
    confidence?: number;
    categories?: string[];
    evidence?: GapEvidence;
    methodologyRecommendation?: MethodologyRecommendation;
    validation?: GapValidationDetail;
  }>;
  trends: Array<{ name: string; score: number }>;
  detectedDomains?: DomainMatch[];
  coverageAnalysis?: CoverageEntry[];
  validationNotes?: string[];
  contributions?: PaperContribution[];
}

// ---- Domain rule schema -----------------------------------------------

export interface GapDimension {
  id: string;
  name: string;
  triggerIfAbsent: string[];   // gap is surfaced if NONE of these appear in papers
  description: string;         // template – use {primaryTopic}
  researchQuestions: string[]; // templates – use {primaryTopic}
}

export interface SubdomainRule {
  displayName: string;
  keywords: string[];          // used to detect if this subdomain applies
  gapDimensions: GapDimension[];
}

export interface DomainRule {
  displayName: string;
  keywords: string[];          // used for domain classification
  topicKeywords: string[];     // used for topic extraction within this domain
  forbiddenInGaps: string[];   // concepts that must NOT appear in gaps for this domain
  expectedActors: string[];    // semantic entities (e.g. patients, investors, students)
  expectedConcepts: string[];  // semantic concepts (e.g. curriculum, portfolio, diagnosis)
  genericTemplates: GapDimension[]; // fallback templates if no subdomain matches
  subdomains: Record<string, SubdomainRule>;
}

export interface DomainRulesConfig {
  domains: Record<string, DomainRule>;
}
