// ============================================================
// 02b_contribution_extractor.ts – Contribution Extraction
// ============================================================
import type { PaperInput, PaperContribution } from "./types";

function extractObjective(title: string, abstract: string): string {
  const text = `${title}. ${abstract}`;
  const sentences = text.split(/[.!?]\s+/);

  // Look for goal-oriented verbs
  const goalPatterns = [
    /aims to/i, /focuses on/i, /investigates/i, /examines/i,
    /presents a/i, /evaluates/i, /analyzes/i, /explores/i,
    /purpose of this/i, /this paper study/i
  ];

  for (const s of sentences) {
    if (goalPatterns.some(p => p.test(s))) {
      return s.trim();
    }
  }

  // Fallback to the first sentence or title
  return sentences[0] ? sentences[0].trim() : `Examine topic of ${title}`;
}

function extractContributions(abstract: string): string[] {
  const sentences = abstract.split(/[.!?]\s+/);
  const patterns = [
    /we propose/i, /we introduce/i, /we present/i, /novel/i,
    /contribution/i, /framework/i, /develop a/i, /design/i
  ];

  const found: string[] = [];
  for (const s of sentences) {
    if (patterns.some(p => p.test(s))) {
      found.push(s.trim());
    }
  }

  if (found.length === 0) {
    found.push("Provides a descriptive analysis and evaluation of the main study variables.");
  }
  return found;
}

function extractMethodology(abstract: string): string {
  const sentences = abstract.split(/[.!?]\s+/);
  const patterns = [
    /survey/i, /experiment/i, /interview/i, /focus group/i, /case study/i,
    /empirical/i, /longitudinal/i, /regression/i, /methodology/i, /mixed-method/i,
    /using a/i, /model/i
  ];

  for (const s of sentences) {
    if (patterns.some(p => p.test(s))) {
      return s.trim();
    }
  }
  return "Conceptual review and qualitative literature analysis.";
}

function extractFindings(abstract: string): string {
  const sentences = abstract.split(/[.!?]\s+/);
  const patterns = [
    /results/i, /findings/i, /show that/i, /indicate that/i, /demonstrates/i,
    /reveals/i, /found to/i, /conclude/i
  ];

  for (const s of sentences) {
    if (patterns.some(p => p.test(s))) {
      return s.trim();
    }
  }
  return "Identifies core qualitative patterns and structures within the studied domain.";
}

function extractExplicitLimitations(abstract: string): string[] {
  const sentences = abstract.split(/[.!?]\s+/);
  const patterns = [
    /limitation/i, /restricted/i, /future research should/i, /limit/i,
    /not address/i, /excluding/i, /fails to/i, /future work/i
  ];

  const found: string[] = [];
  for (const s of sentences) {
    if (patterns.some(p => p.test(s))) {
      found.push(s.trim());
    }
  }
  return found;
}

function inferImplicitLimitations(title: string, abstract: string, explicit: string[]): string[] {
  const t = `${title} ${abstract}`.toLowerCase();
  const inferred: string[] = [];

  // 1. Geographic checks
  const geoKeywords = ["indonesian", "jakarta", "urban", "local school", "university student", "malaysian", "regional", "single city"];
  if (geoKeywords.some(kw => t.includes(kw))) {
    inferred.push("Geographically restricted scope which limits generalizability to international or diverse regional contexts.");
  }

  // 2. Population checks
  if (t.includes("student") || t.includes("school") || t.includes("classroom")) {
    inferred.push("Population sample bias focusing predominantly on student demographics rather than general public cohorts.");
  }

  // 3. Methodology-based checks
  if (t.includes("survey") || t.includes("questionnaire")) {
    inferred.push("Relies on self-reported survey data, introducing potential social desirability and recall biases.");
  }

  if (!t.includes("longitudinal") && (t.includes("survey") || t.includes("cross-sectional") || t.includes("study"))) {
    inferred.push("Cross-sectional timeline limits the ability to establish long-term causal relationships.");
  }

  // Fallback if no implicit limits found and explicit is empty
  if (inferred.length === 0 && explicit.length === 0) {
    inferred.push("Restricted to small-scale evaluation constraints without cross-disciplinary validation.");
  }

  return inferred;
}

export function extractPaperContributions(papers: PaperInput[]): PaperContribution[] {
  return papers.map(paper => {
    const objective = extractObjective(paper.title, paper.abstract);
    const contributions = extractContributions(paper.abstract);
    const methodology = extractMethodology(paper.abstract);
    const findings = extractFindings(paper.abstract);
    const explicitLimitations = extractExplicitLimitations(paper.abstract);
    const implicitLimitations = inferImplicitLimitations(paper.title, paper.abstract, explicitLimitations);

    return {
      paperId: paper.id,
      paperTitle: paper.title,
      objective,
      contributions,
      methodology,
      findings,
      explicitLimitations,
      implicitLimitations
    };
  });
}
