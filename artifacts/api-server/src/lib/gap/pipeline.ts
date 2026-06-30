// ============================================================
// pipeline.ts  –  Orchestrator: runs all stages in sequence
// ============================================================
import type { PaperInput, AnalyzerResult } from "./types";
import { classifyDomain }    from "./01_classifier";
import { extractTopics }     from "./02_topic_extractor";
import { extractPaperContributions } from "./02b_contribution_extractor";
import { analyzeCoverage }   from "./03_coverage_analyzer";
import { generateGaps }      from "./04_gap_generator";
import { filterValidGaps }   from "./05_gap_validator";
import { mergeDuplicateGaps } from "./06_duplicate_detector";

export function runGapAnalysisPipeline(papers: PaperInput[], projectName?: string): AnalyzerResult {
  if (!papers || papers.length === 0) {
    return { topics: [], gaps: [], trends: [] };
  }

  // ── Stage 1: Domain Classification ────────────────────────
  // Pass projectName as a domain hint so user-specified domains get priority
  const detectedDomains = classifyDomain(papers, projectName);

  // ── Stage 2: Topic Extraction (domain-grounded) ───────────
  const extractedTopics = extractTopics(papers, detectedDomains);

  // ── Stage 2b: Contribution Extraction ─────────────────────
  const contributions = extractPaperContributions(papers);

  // ── Stage 3: Coverage Analysis ────────────────────────────
  const coverageAnalysis = analyzeCoverage(papers, extractedTopics, contributions);

  // ── Stage 4: Domain-Constrained Gap Generation ────────────
  const rawGaps = generateGaps(papers, detectedDomains, extractedTopics, contributions);

  // ── Stage 5: Validation ───────────────────────────────────
  const { gaps: validatedGaps, allNotes } = filterValidGaps(rawGaps, papers, detectedDomains, contributions);

  // ── Stage 6: Duplicate Detection & Merging ────────────────
  const finalGaps = mergeDuplicateGaps(validatedGaps);

  // ── Build trend scores from topic extraction ──────────────
  const maxMentions = Math.max(...extractedTopics.map(t => t.mentions), 1);
  const trends = extractedTopics.map(t => ({
    name: t.name,
    score: Math.round((t.mentions / maxMentions) * 100)
  }));

  // ── Map to legacy AnalyzerResult shape ───────────────────
  return {
    // Legacy fields (required by DB schema)
    topics: extractedTopics.map(t => ({
      name: t.name,
      count: t.mentions,
      papers: t.papers
    })),
    gaps: finalGaps.map(g => ({
      title: g.title,
      description: g.description,
      papers: g.papers,
      questions: g.questions,
      confidence: g.confidence,
      categories: g.categories,
      evidence: g.evidence,
      methodologyRecommendation: g.methodologyRecommendation,
      validation: g.validation
    })),
    trends,
    // Enriched fields (stored in same jsonb, surfaced in UI)
    detectedDomains,
    coverageAnalysis,
    validationNotes: allNotes,
    contributions
  };
}
