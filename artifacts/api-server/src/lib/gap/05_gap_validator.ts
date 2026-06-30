// ============================================================
// 05_gap_validator.ts  –  Stage 5: Pre-return Validation
//
// Validates each generated gap against 5 criteria:
//   1. Domain consistency  – gap belongs to a detected domain
//   2. Evidence backing    – gap has at least one paper-level citation
//   3. Concept leakage     – gap does not mention forbidden out-of-domain concepts
//   4. Coverage overlap    – gap is not already fully covered in findings
//   5. Semantic coherence  – actors/concepts are consistent with source text
//
// Design: no "return anyway" override — if all gaps fail, return empty.
// ============================================================
import type {
  PaperInput, GapCandidate, DomainMatch, ValidationResult, PaperContribution
} from "./types";
import { DOMAIN_RULES } from "./domain_rules";

export function validateGap(
  gap: GapCandidate,
  papers: PaperInput[],
  domains: DomainMatch[],
  contributions: PaperContribution[]
): ValidationResult {
  const notes: string[] = [];
  let passed = true;

  const primaryDomainKey = domains[0]?.domainKey;
  const rule = primaryDomainKey ? DOMAIN_RULES.domains[primaryDomainKey] : undefined;
  const fullText = papers.map(p => `${p.title} ${p.abstract}`).join(" ").toLowerCase();

  // -----------------------------------------------------------------------
  // Check 1: Domain Consistency
  // -----------------------------------------------------------------------
  const detectedKeys = domains.map(d => d.domainKey);
  if (!detectedKeys.includes(gap.domainKey)) {
    notes.push(`FAIL [Domain Consistency]: Gap domain '${gap.domainKey}' does not match any detected domain (${detectedKeys.join(", ")}).`);
    passed = false;
  } else {
    notes.push(`PASS [Domain Consistency]: Gap aligns with detected domain '${gap.domainKey}'.`);
  }

  // -----------------------------------------------------------------------
  // Check 2: Evidence Backing — must have at least one paper citation
  // -----------------------------------------------------------------------
  const hasEvidence =
    (gap.evidence?.limitations ?? []).length > 0 ||
    (gap.evidence?.contributions ?? []).length > 0 ||
    (gap.evidence?.traces ?? []).length > 0;

  if (!hasEvidence) {
    notes.push(`FAIL [Evidence Backing]: Gap "${gap.title}" has no paper-level citation. Generated gaps must be evidence-backed.`);
    passed = false;
  } else {
    const citeCount = (gap.evidence?.papers ?? []).length;
    notes.push(`PASS [Evidence Backing]: Gap is supported by ${citeCount} paper(s).`);
  }

  // -----------------------------------------------------------------------
  // Check 3: Concept Leakage (forbidden out-of-domain terms)
  // -----------------------------------------------------------------------
  if (rule) {
    const gapText = `${gap.title} ${gap.description} ${gap.questions.join(" ")}`.toLowerCase();
    const violations = rule.forbiddenInGaps.filter(fc => gapText.includes(fc.toLowerCase()));
    if (violations.length > 0) {
      notes.push(`FAIL [Concept Leakage]: Gap introduces forbidden concepts (${violations.join(", ")}) not consistent with ${rule.displayName}.`);
      passed = false;
    } else {
      notes.push(`PASS [Concept Leakage]: No forbidden out-of-discipline concepts detected.`);
    }
  }

  // -----------------------------------------------------------------------
  // Check 4: Coverage Overlap — not already discussed in findings
  // -----------------------------------------------------------------------
  const findingsText = contributions
    .map(c => `${c.methodology} ${c.findings}`)
    .join(" ")
    .toLowerCase();

  const dimRule = (() => {
    if (!rule) return undefined;
    for (const sub of Object.values(rule.subdomains)) {
      const found = sub.gapDimensions.find(d => d.id === gap.dimensionId);
      if (found) return found;
    }
    return undefined;
  })();

  if (dimRule) {
    const coverageHits = dimRule.triggerIfAbsent.filter(kw =>
      findingsText.includes(kw.toLowerCase())
    );
    if (coverageHits.length >= 2) {
      notes.push(`FAIL [Coverage Overlap]: Gap dimension "${gap.title}" appears already discussed in findings: (${coverageHits.join(", ")}).`);
      passed = false;
    } else {
      notes.push(`PASS [Coverage Overlap]: Gap dimensions verified as unaddressed in current findings.`);
    }
  }

  // -----------------------------------------------------------------------
  // Check 5: Semantic Coherence — no cross-domain actor mismatch
  // -----------------------------------------------------------------------
  if (rule) {
    const gapText = `${gap.title} ${gap.description} ${gap.questions.join(" ")}`.toLowerCase();
    const mentionedActors = rule.expectedActors.filter(a => gapText.includes(a.toLowerCase()));

    if (mentionedActors.length > 0) {
      const allOtherConcepts = Object.entries(DOMAIN_RULES.domains)
        .filter(([key]) => key !== gap.domainKey)
        .flatMap(([, d]) => d.expectedConcepts);
      const conflictingConcepts = allOtherConcepts.filter(
        c => gapText.includes(c.toLowerCase()) && !fullText.includes(c.toLowerCase())
      );

      if (conflictingConcepts.length > 0) {
        notes.push(`FAIL [Semantic Coherence]: Gap combines domain actors (${mentionedActors.join(", ")}) with unrelated cross-domain concepts (${conflictingConcepts.join(", ")}) not in source text.`);
        passed = false;
      } else {
        notes.push(`PASS [Semantic Coherence]: Domain actors (${mentionedActors.join(", ")}) are consistent with generated concepts.`);
      }
    } else {
      notes.push(`PASS [Semantic Coherence]: No domain-actor mismatch detected.`);
    }
  }

  return { passed, dimensionId: gap.dimensionId, notes };
}

export function filterValidGaps(
  gaps: GapCandidate[],
  papers: PaperInput[],
  domains: DomainMatch[],
  contributions: PaperContribution[]
): { gaps: GapCandidate[]; allNotes: string[] } {
  const validGaps: GapCandidate[] = [];
  const allNotes: string[] = [];

  for (const gap of gaps) {
    const result = validateGap(gap, papers, domains, contributions);
    gap.validation = { passed: result.passed, notes: result.notes };
    allNotes.push(...result.notes.map(n => `[${gap.title}] ${n}`));
    if (result.passed) {
      validGaps.push(gap);
    }
  }

  // Design decision: if all gaps fail validation, return empty rather than
  // surfacing invalid results. The frontend displays a "no gaps found" state.
  if (validGaps.length === 0 && gaps.length > 0) {
    allNotes.push(
      "NOTE [All Gaps Rejected]: All candidate gaps failed strict validation. " +
      "Returning empty — the uploaded literature does not provide sufficient evidence " +
      "to generate valid research gaps for this corpus."
    );
  }

  return { gaps: validGaps, allNotes };
}
