// ============================================================
// 03_coverage_analyzer.ts  –  Stage 3: Evidence-Grounded Coverage Analysis
//
// Design principles:
//   - All coverage claims trace to exact paper sentences
//   - "Missing" reflects only actual gaps suggested by paper evidence
//   - No template-driven generic statements are inserted
//   - Every output includes a sources[] array for traceability
//   - Deterministic: identical inputs produce identical outputs
// ============================================================
import type {
  PaperInput, ExtractedTopic, CoverageEntry, PaperContribution, EvidenceTrace
} from "./types";

// ---------------------------------------------------------------------------
// Sentence-level evidence retrieval
// ---------------------------------------------------------------------------

type SentenceRole = "title" | "objective" | "finding" | "limitation" | "future_work" | "general";

function classifySentenceRole(sentence: string): SentenceRole {
  const s = sentence.toLowerCase();
  if (/\b(aim|focus|investigate|examine|explore|propose|present|study|analyze)\b/.test(s)) return "objective";
  if (/\b(results?|findings?|show|demonstrate|reveal|found|indicate|suggest|conclude)\b/.test(s)) return "finding";
  if (/\b(limitation|limit|restrict|constrain|exclude|not address|not cover|fail to|unable to)\b/.test(s)) return "limitation";
  if (/\b(future (work|research|stud)|further research|recommended|should be (investigated|explored|studied))\b/.test(s)) return "future_work";
  return "general";
}

function segmentSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

/**
 * Find all sentences in this paper that contain the topic term.
 * Returns an array of EvidenceTrace sorted by role priority.
 */
function findEvidenceTraces(
  paper: PaperInput,
  topicName: string
): EvidenceTrace[] {
  const lower = topicName.toLowerCase();
  const traces: EvidenceTrace[] = [];

  // Title match — highest confidence
  if (paper.title.toLowerCase().includes(lower)) {
    traces.push({
      paperId: paper.id,
      paperTitle: paper.title,
      sentence: `Explicitly titled: "${paper.title}"`,
      sentenceType: "title"
    });
  }

  const sentences = segmentSentences(paper.abstract);
  for (const s of sentences) {
    if (!s.toLowerCase().includes(lower)) continue;
    const role = classifySentenceRole(s);
    traces.push({
      paperId: paper.id,
      paperTitle: paper.title,
      sentence: s.trim(),
      sentenceType: role
    });
  }

  // Sort by priority: title > objective > finding > limitation > future_work > general
  const priority: Record<SentenceRole, number> = {
    title: 0, objective: 1, finding: 2, limitation: 3, future_work: 4, general: 5
  };
  traces.sort((a, b) => priority[a.sentenceType] - priority[b.sentenceType]);

  return traces;
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export function analyzeCoverage(
  papers: PaperInput[],
  topics: ExtractedTopic[],
  contributions: PaperContribution[]
): CoverageEntry[] {
  return topics.map(topic => {
    const topicName = topic.name;
    const lower = topicName.toLowerCase();

    // -----------------------------------------------------------------------
    // Step 1: Gather all evidence traces for this topic across all papers
    // -----------------------------------------------------------------------
    const allTraces: EvidenceTrace[] = [];
    for (const paper of papers) {
      const traces = findEvidenceTraces(paper, lower);
      allTraces.push(...traces);
    }

    // Papers that actually contain this topic
    const coveredPaperIds = new Set(allTraces.map(t => t.paperId));
    const coveredContribs = contributions.filter(c => coveredPaperIds.has(c.paperId));

    // -----------------------------------------------------------------------
    // Step 2: Build "covered" description from objective/finding traces
    // -----------------------------------------------------------------------
    let covered: string;
    const objectiveTraces = allTraces.filter(t =>
      t.sentenceType === "title" || t.sentenceType === "objective" || t.sentenceType === "finding"
    );

    if (objectiveTraces.length === 0) {
      covered = `None of the ${papers.length} uploaded papers explicitly address "${topicName}" as a primary focus.`;
    } else {
      const uniquePapers = [...new Set(objectiveTraces.map(t => t.paperTitle))];
      const detail = objectiveTraces.slice(0, 2).map(t => {
        const shortTitle = t.paperTitle.length > 40
          ? t.paperTitle.substring(0, 40) + "…"
          : t.paperTitle;
        return `"${shortTitle}" (${t.sentenceType}): ${t.sentence.substring(0, 120).replace(/\s+/g, " ")}`;
      }).join(" | ");
      covered = `${uniquePapers.length} of ${papers.length} papers address ${lower}: ${detail}.`;
    }

    // -----------------------------------------------------------------------
    // Step 3: Build "partial" from limitation traces only — no templates
    // -----------------------------------------------------------------------
    let partial: string;
    const limitationTraces = allTraces.filter(t =>
      t.sentenceType === "limitation" || t.sentenceType === "future_work"
    );

    // Also check explicit limitation strings in contributions
    const explicitLimits: string[] = [];
    for (const c of coveredContribs) {
      for (const l of (c.explicitLimitations ?? [])) {
        if (l.toLowerCase().includes(lower) || lower.split(" ").some(w => w.length > 4 && l.toLowerCase().includes(w))) {
          explicitLimits.push(`"${c.paperTitle}": ${l}`);
        }
      }
    }

    if (limitationTraces.length === 0 && explicitLimits.length === 0) {
      partial = "Insufficient evidence from the uploaded papers to identify documented limitations or partial coverage of this topic.";
    } else {
      const limitDetails: string[] = [];
      for (const t of limitationTraces.slice(0, 2)) {
        limitDetails.push(t.sentence.substring(0, 120).replace(/\s+/g, " "));
      }
      for (const l of explicitLimits.slice(0, 2 - limitDetails.length)) {
        limitDetails.push(l.substring(0, 120));
      }
      partial = `Documented limitations: ${limitDetails.join(" | ")}.`;
    }

    // -----------------------------------------------------------------------
    // Step 4: Build "missing" from future_work traces and concept intersections
    // No template-driven generic statements — only from paper evidence
    // -----------------------------------------------------------------------
    let missing: string;
    const futureTraces = allTraces.filter(t => t.sentenceType === "future_work");
    const futureWorkLimits: string[] = [];
    for (const c of coveredContribs) {
      for (const l of (c.implicitLimitations ?? [])) {
        if (lower.split(" ").some(w => w.length > 4 && l.toLowerCase().includes(w))) {
          futureWorkLimits.push(`"${c.paperTitle}": ${l}`);
        }
      }
    }

    if (futureTraces.length === 0 && futureWorkLimits.length === 0 && coveredPaperIds.size === 0) {
      missing = `"${topicName}" does not appear in the uploaded literature. It may represent an entirely unexplored aspect.`;
    } else if (futureTraces.length === 0 && futureWorkLimits.length === 0) {
      missing = "The uploaded papers do not explicitly identify future work or missing dimensions for this topic.";
    } else {
      const missingDetails: string[] = [];
      for (const t of futureTraces.slice(0, 2)) {
        missingDetails.push(t.sentence.substring(0, 120).replace(/\s+/g, " "));
      }
      for (const l of futureWorkLimits.slice(0, 2 - missingDetails.length)) {
        missingDetails.push(l.substring(0, 120));
      }
      missing = `Suggested future directions from the literature: ${missingDetails.join(" | ")}.`;
    }

    return {
      topic: topicName,
      covered,
      partial,
      missing,
      sources: allTraces.slice(0, 5)  // top 5 traces for display
    };
  });
}
