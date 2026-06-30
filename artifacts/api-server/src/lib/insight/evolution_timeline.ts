import type { PaperInsightInput, TimelineEntry } from "./types";
import { extractScientificConceptsFromText, CONCEPT_TAXONOMY, GENERIC_ACADEMIC_TERMS } from "./taxonomy";

function extractYear(paper: PaperInsightInput): number {
  if (paper.year && paper.year >= 1900 && paper.year <= 2100) {
    return paper.year;
  }
  const text = `${paper.title} ${paper.abstract} ${paper.filename || ""}`;
  const match = text.match(/\b(19\d{2}|20\d{2})\b/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    if (parsed >= 1900 && parsed <= 2100) return parsed;
  }
  return 2024;
}

function segmentSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

const COMMON_METHODOLOGIES = [
  "Randomized Controlled Trial", "Mixed-methods", "Survey",
  "Semi-structured Interview", "Case Study", "Empirical Study",
  "Experiment", "Machine Learning", "Deep Learning", "Neural Network",
  "Regression Analysis", "Simulated", "Prototiping", "Audit", "Meta-analysis",
  "Reinforcement Learning", "Fine-tuning", "Instruction Tuning", "Prompt Engineering"
];

function extractMethodologies(abstract: string): string[] {
  const matched: string[] = [];
  const lower = abstract.toLowerCase();
  for (const m of COMMON_METHODOLOGIES) {
    if (lower.includes(m.toLowerCase())) {
      matched.push(m);
    }
  }
  return matched;
}

function extractFindings(abstract: string): string[] {
  const sentences = segmentSentences(abstract);
  const findings: string[] = [];
  const FINDING_VERBS = [
    /\b(we found that|findings show|results show|demonstrates that|indicates that|proves that|conclude that|observe that)\b/i
  ];

  for (const sent of sentences) {
    if (FINDING_VERBS.some(regex => regex.test(sent))) {
      findings.push(sent);
    }
  }

  if (findings.length === 0 && sentences.length > 1) {
    findings.push(sentences[1]);
  }

  return findings;
}

/**
 * Deterministically ranks and outputs top 10-15 concepts across the corpus
 */
export function rankCorpusConcepts(papers: PaperInsightInput[]): string[] {
  const conceptScores: Map<string, number> = new Map();

  for (const paper of papers) {
    const titleConcepts = extractScientificConceptsFromText(paper.title);
    const abstractConcepts = extractScientificConceptsFromText(paper.abstract);
    const allConcepts = [...new Set([...titleConcepts, ...abstractConcepts])];

    const titleLower = paper.title.toLowerCase();
    const abstractLower = paper.abstract.toLowerCase();

    for (const concept of allConcepts) {
      let score = 0;

      // Rule 1: Appears in title (+20)
      const isTitle = titleConcepts.includes(concept);
      if (isTitle) score += 20;

      // Rule 2: Appears multiple times (+10 per count)
      // Count frequency in abstract/title
      const def = CONCEPT_TAXONOMY.find(c => c.canonical === concept);
      if (def) {
        let matches = 0;
        for (const alias of def.aliases) {
          const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
          const regex = new RegExp(`\\b${escaped}\\b`, "gi");
          const titleHits = titleLower.match(regex);
          const abstractHits = abstractLower.match(regex);
          if (titleHits) matches += titleHits.length;
          if (abstractHits) matches += abstractHits.length;
        }
        score += matches * 10;
      }

      // Rule 3: Multi-word phrase (+15)
      if (concept.split(/\s+/).length >= 2) {
        score += 15;
      }

      // Rule 4: Proper noun/Acronym presence (+15)
      if (/[A-Z]/.test(concept)) {
        score += 15;
      }

      // Rule 5: Findings/Methodology keyword matches (+15)
      const findings = extractFindings(paper.abstract).join(" ").toLowerCase();
      if (def?.aliases.some(alias => findings.includes(alias))) {
        score += 15;
      }

      conceptScores.set(concept, (conceptScores.get(concept) || 0) + score);
    }
  }

  // Stable sort descending by score then alphabetically
  const ranked = Array.from(conceptScores.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(entry => entry[0]);

  return ranked.slice(0, 15);
}

export function buildEvolutionTimeline(papers: PaperInsightInput[]): TimelineEntry[] {
  const yearMap: Map<number, {
    papers: string[];
    concepts: Set<string>;
    methodologies: Set<string>;
    findings: Set<string>;
  }> = new Map();

  for (const paper of papers) {
    const year = extractYear(paper);
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        papers: [],
        concepts: new Set(),
        methodologies: new Set(),
        findings: new Set()
      });
    }

    const entry = yearMap.get(year)!;
    entry.papers.push(paper.title);

    // Extract genuine scientific concepts matching taxonomy
    const concepts = extractScientificConceptsFromText(`${paper.title}. ${paper.abstract}`);
    concepts.forEach(c => entry.concepts.add(c));

    // Extract methodologies
    const methodologies = extractMethodologies(paper.abstract);
    methodologies.forEach(m => entry.methodologies.add(m));

    // Extract findings
    const findings = extractFindings(paper.abstract);
    findings.forEach(f => entry.findings.add(f));
  }

  const timeline: TimelineEntry[] = [];
  for (const [year, data] of yearMap.entries()) {
    timeline.push({
      year,
      papers: data.papers,
      concepts: Array.from(data.concepts).sort(),
      methodologies: Array.from(data.methodologies).sort(),
      findings: Array.from(data.findings).sort()
    });
  }

  timeline.sort((a, b) => a.year - b.year);
  return timeline;
}
