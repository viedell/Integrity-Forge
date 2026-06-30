// ============================================================
// 06_duplicate_detector.ts  –  Stage 6: Duplicate Gap Detection & Merging
// ============================================================
import type { GapCandidate } from "./types";

function calculateOverlap(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  return intersection.size / Math.min(words1.size, words2.size);
}

export function mergeDuplicateGaps(gaps: GapCandidate[]): GapCandidate[] {
  const merged: GapCandidate[] = [];

  for (const gap of gaps) {
    // Find if a highly similar gap already exists in the merged list
    const duplicateIdx = merged.findIndex(m =>
      m.dimensionId === gap.dimensionId ||
      m.title.toLowerCase() === gap.title.toLowerCase() ||
      calculateOverlap(m.title, gap.title) >= 0.7
    );

    if (duplicateIdx !== -1) {
      const existing = merged[duplicateIdx];

      // Merge evidence papers
      const mergedPapers = Array.from(new Set([...(existing.papers || []), ...(gap.papers || [])]));
      
      // Merge questions
      const mergedQuestions = Array.from(new Set([...(existing.questions || []), ...(gap.questions || [])]));
      
      // Merge categories
      const mergedCategories = Array.from(new Set([...(existing.categories || []), ...(gap.categories || [])]));

      // Merge Evidence Traceability
      let mergedEvidence = existing.evidence;
      if (existing.evidence && gap.evidence) {
        mergedEvidence = {
          papers: Array.from(new Set([...existing.evidence.papers, ...gap.evidence.papers])),
          topics: Array.from(new Set([...existing.evidence.topics, ...gap.evidence.topics])),
          contributions: Array.from(new Set([...existing.evidence.contributions, ...gap.evidence.contributions])),
          limitations: Array.from(new Set([...existing.evidence.limitations, ...gap.evidence.limitations])),
          reason: `${existing.evidence.reason} Additionally, ${gap.evidence.reason}`
        };
      }

      // Average confidence
      const mergedConfidence = Math.round(((existing.confidence || 75) + (gap.confidence || 75)) / 2);

      // Update existing
      merged[duplicateIdx] = {
        ...existing,
        papers: mergedPapers,
        questions: mergedQuestions,
        categories: mergedCategories,
        evidence: mergedEvidence,
        confidence: mergedConfidence
      };
    } else {
      merged.push(gap);
    }
  }

  return merged;
}
