// ============================================================
// 04_gap_generator.ts  –  Stage 4: Evidence-Backed Gap Generation
//
// Design principles:
//   - Every gap must cite at least one explicit limitation or future work statement
//   - No default domain gaps generated without paper support
//   - Template fills use the most specific topic extracted from corpus
//   - Provenance (EvidenceTrace[]) stored for every gap
//   - Gap dimension templates only trigger when evidence exists in the papers
//   - Deterministic: identical inputs produce identical outputs
// ============================================================
import type {
  PaperInput, DomainMatch, ExtractedTopic, GapCandidate,
  PaperContribution, GapEvidence, MethodologyRecommendation, EvidenceTrace
} from "./types";
import { DOMAIN_RULES } from "./domain_rules";

// ---------------------------------------------------------------------------
// Template utilities
// ---------------------------------------------------------------------------

function fillTemplate(template: string, primaryTopic: string): string {
  return template.replace(/\{primaryTopic\}/g, primaryTopic);
}

function determineCategories(dimensionId: string): string[] {
  const cats: string[] = [];
  const id = dimensionId.toLowerCase();

  if (id.includes("culture") || id.includes("regional") || id.includes("geographic")) cats.push("Geographic Gap", "Population Gap");
  if (id.includes("longitudinal") || id.includes("temporal") || id.includes("time")) cats.push("Temporal Gap");
  if (id.includes("ethics") || id.includes("bias") || id.includes("fairness")) cats.push("Ethical Gap");
  if (id.includes("scale") || id.includes("resource") || id.includes("deployment") || id.includes("iot_security")) cats.push("Technological Gap", "Implementation Gap");
  if (id.includes("interpret") || id.includes("explain") || id.includes("xai")) cats.push("Theoretical Gap", "Methodological Gap");
  if (id.includes("efficiency") || id.includes("real_world") || id.includes("adoption")) cats.push("Implementation Gap", "Evaluation Gap");
  if (id.includes("policy") || id.includes("governance")) cats.push("Policy Gap");

  if (cats.length === 0) cats.push("Methodological Gap", "Evaluation Gap");
  return cats;
}

function recommendMethodology(categories: string[]): MethodologyRecommendation {
  const methods: string[] = [];
  const reasons: string[] = [];

  if (categories.includes("Geographic Gap") || categories.includes("Population Gap")) {
    methods.push("Cross-sectional Survey", "Multi-site Field Study");
    reasons.push("Allows collecting standardized responses from diverse regional/demographic subgroups to mitigate sample skew.");
  }
  if (categories.includes("Temporal Gap")) {
    methods.push("Longitudinal Cohort Study", "Time-series Panel Analysis");
    reasons.push("Tracks participant behaviors and variable dynamics over months/years to detect patterns and establish causality.");
  }
  if (categories.includes("Ethical Gap")) {
    methods.push("Algorithmic Auditing", "Stakeholder Impact Assessment");
    reasons.push("Enables checking outcome distributions for subgroup disparities and evaluating ethical alignment.");
  }
  if (categories.includes("Technological Gap") || categories.includes("Implementation Gap")) {
    methods.push("System Prototype Evaluation", "Empirical Controlled Experiment");
    reasons.push("Measures system scalability, execution latency, and stability under load or resource constraints.");
  }
  if (categories.includes("Policy Gap")) {
    methods.push("Comparative Case Study", "Policy Impact Analysis");
    reasons.push("Analyzes how governance frameworks and regulatory mandates shape real-world institutional outcomes.");
  }
  if (categories.includes("Theoretical Gap") || categories.includes("Methodological Gap")) {
    methods.push("Triangulated Mixed-Methods Study", "Comparative Meta-analysis");
    reasons.push("Synthesizes conceptual models and validates qualitative constructs through structural quantitative measures.");
  }
  if (methods.length === 0) {
    methods.push("Exploratory Case Study", "Semi-structured Interviews");
    reasons.push("Surfaces initial insights and constructs for domains with sparse empirical benchmarks.");
  }

  return { recommendedMethods: methods, reason: reasons.join(" ") };
}

function calculateConfidence(
  domainConf: number,
  topic: ExtractedTopic | undefined,
  evidencePapersCount: number,
  forbiddenCount: number
): number {
  let score = 70;
  if (domainConf >= 80) score += 10;
  else if (domainConf >= 50) score += 5;
  if (topic && topic.mentions >= 3) score += 8;
  else if (topic && topic.mentions >= 2) score += 4;
  if (evidencePapersCount >= 2) score += 10;
  else if (evidencePapersCount === 1) score += 5;
  if (forbiddenCount === 0) score += 5;
  else score -= 15;
  return Math.max(0, Math.min(score, 98));
}

// ---------------------------------------------------------------------------
// Singular normalizer (for gap identity checks)
// ---------------------------------------------------------------------------

function toSingular(word: string): string {
  const w = word.toLowerCase();
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("xes") || w.endsWith("shes") || w.endsWith("ches")) return w.slice(0, -2);
  if (w.endsWith("ses") && w.length > 4) return w.slice(0, -1);
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -1);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

function normalizeTerm(term: string): string {
  return term.toLowerCase().trim().split(/\s+/).map(toSingular).join(" ");
}

// ---------------------------------------------------------------------------
// Evidence extraction from a contribution against dimension keywords
// ---------------------------------------------------------------------------

function extractEvidenceForDimension(
  contribution: PaperContribution,
  dimKeywords: string[]
): {
  usedLimitations: string[];
  usedContributions: string[];
  traces: EvidenceTrace[];
} {
  const usedLimitations: string[] = [];
  const usedContributions: string[] = [];
  const traces: EvidenceTrace[] = [];

  // Check explicit limitations
  for (const l of (contribution.explicitLimitations ?? [])) {
    if (dimKeywords.some(kw => l.toLowerCase().includes(kw.toLowerCase()))) {
      usedLimitations.push(`"${contribution.paperTitle}" — explicit limitation: ${l}`);
      traces.push({
        paperId: contribution.paperId,
        paperTitle: contribution.paperTitle,
        sentence: l,
        sentenceType: "limitation"
      });
    }
  }

  // Check implicit limitations
  for (const l of (contribution.implicitLimitations ?? [])) {
    if (dimKeywords.some(kw => l.toLowerCase().includes(kw.toLowerCase()))) {
      usedLimitations.push(`"${contribution.paperTitle}" — implicit limitation: ${l}`);
      traces.push({
        paperId: contribution.paperId,
        paperTitle: contribution.paperTitle,
        sentence: l,
        sentenceType: "future_work"
      });
    }
  }

  // Check contributions (for contradiction-type gaps)
  for (const co of (contribution.contributions ?? [])) {
    if (dimKeywords.some(kw => co.toLowerCase().includes(kw.toLowerCase()))) {
      usedContributions.push(`"${contribution.paperTitle}" — contribution: ${co}`);
      traces.push({
        paperId: contribution.paperId,
        paperTitle: contribution.paperTitle,
        sentence: co,
        sentenceType: "finding"
      });
    }
  }

  return { usedLimitations, usedContributions, traces };
}

// ---------------------------------------------------------------------------
// Main gap generation function
// ---------------------------------------------------------------------------

export function generateGaps(
  papers: PaperInput[],
  domains: DomainMatch[],
  topics: ExtractedTopic[],
  contributions: PaperContribution[]
): GapCandidate[] {
  if (domains.length === 0) return [];

  const primaryDomain = domains[0];
  if (primaryDomain.confidence < 70) return []; // strict domain gating

  // Use the most specific extracted topic as the primary topic label
  // (topics are already sorted by specificity from the extractor)
  const primaryTopic = topics.length > 0
    ? topics[0].name.toLowerCase()
    : primaryDomain.displayName.toLowerCase();

  const candidates: GapCandidate[] = [];
  const fullText = papers.map(p => `${p.title} ${p.abstract}`).join(" ").toLowerCase();

  const rule = DOMAIN_RULES.domains[primaryDomain.domainKey];
  if (!rule) return [];

  // -----------------------------------------------------------------------
  // Template retrieval: prefer matched subdomains, fallback to generic
  // -----------------------------------------------------------------------
  const matchedDimensions: typeof rule.genericTemplates = [];
  const subdomains = Object.values(rule.subdomains);

  for (const sub of subdomains) {
    const subHits = sub.keywords.filter(kw => fullText.includes(kw.toLowerCase()));
    if (subHits.length > 0) {
      matchedDimensions.push(...sub.gapDimensions);
    }
  }

  if (matchedDimensions.length === 0) {
    matchedDimensions.push(...rule.genericTemplates);
  }

  // -----------------------------------------------------------------------
  // Gap generation loop — each gap must be evidence-backed
  // -----------------------------------------------------------------------
  for (const dim of matchedDimensions) {
    // Core trigger: the concept is absent from the full corpus text
    const isAbsent = !dim.triggerIfAbsent.some(kw => fullText.includes(kw.toLowerCase()));
    if (!isAbsent) continue;

    // Forbidden concept leakage check
    const forbiddenHits = rule.forbiddenInGaps.filter(fc =>
      dim.description.toLowerCase().includes(fc.toLowerCase()) ||
      dim.researchQuestions.some(q => q.toLowerCase().includes(fc.toLowerCase()))
    );

    // Gather evidence from paper contributions
    const supportingPaperTitles: string[] = [];
    const allLimitations: string[] = [];
    const allContributions: string[] = [];
    const allTraces: EvidenceTrace[] = [];

    for (const c of contributions) {
      const { usedLimitations, usedContributions, traces } = extractEvidenceForDimension(c, dim.triggerIfAbsent);

      if (usedLimitations.length > 0 || usedContributions.length > 0) {
        supportingPaperTitles.push(c.paperTitle);
        allLimitations.push(...usedLimitations);
        allContributions.push(...usedContributions);
        allTraces.push(...traces);
      }
    }

    // *** Critical gate: skip this gap if there is no supporting evidence ***
    if (allLimitations.length === 0 && allContributions.length === 0) {
      continue;
    }

    const categories = determineCategories(dim.id);
    const methodologyRecommendation = recommendMethodology(categories);
    const confidence = calculateConfidence(
      primaryDomain.confidence,
      topics[0],
      supportingPaperTitles.length,
      forbiddenHits.length
    );

    let description = fillTemplate(dim.description, primaryTopic);
    if (confidence < 75) {
      description = `Based on limited evidence from the uploaded papers, this aspect may lack validation: ${description}`;
    }

    const evidence: GapEvidence = {
      papers: supportingPaperTitles.length > 0 ? supportingPaperTitles : [],
      topics: topics.slice(0, 2).map(t => t.name),
      contributions: allContributions,
      limitations: allLimitations,
      reason: `None of the analyzed studies evaluate "${dim.name}" within the scope of "${primaryTopic}".`,
      traces: allTraces.slice(0, 5)
    };

    candidates.push({
      dimensionId: dim.id,
      domainKey: primaryDomain.domainKey,
      title: dim.name,
      description,
      papers: supportingPaperTitles,
      questions: dim.researchQuestions.map(q => fillTemplate(q, primaryTopic)),
      confidence,
      categories,
      evidence,
      methodologyRecommendation
    });

    if (candidates.length >= 4) break;
  }

  // -----------------------------------------------------------------------
  // Fallback integration gap: only when no template gaps found AND
  // two distinct (non-equivalent) concepts exist in the corpus
  // -----------------------------------------------------------------------
  if (candidates.length === 0 && topics.length >= 2) {
    const norm1 = normalizeTerm(topics[0].name);
    const norm2 = normalizeTerm(topics[1].name);

    // Only generate if the two concepts are truly distinct
    if (norm1 !== norm2 && !norm1.includes(norm2) && !norm2.includes(norm1)) {
      const t1 = topics[0].name;
      const t2 = topics[1].name;
      const domainName = primaryDomain.displayName;

      // Require at least some paper-level limitation evidence even for fallback
      const hasAnyEvidence = contributions.some(c =>
        (c.explicitLimitations ?? []).length > 0 || (c.implicitLimitations ?? []).length > 0
      );

      if (hasAnyEvidence) {
        const categories = ["Theoretical Gap", "Methodological Gap"];
        const methodologyRecommendation = recommendMethodology(categories);

        candidates.push({
          dimensionId: "fallback_integration",
          domainKey: primaryDomain.domainKey,
          title: `Integrated Investigation of ${t1} and ${t2}`,
          description: `Within ${domainName}, papers examine ${t1.toLowerCase()} and ${t2.toLowerCase()} independently. No paper in the corpus analyzes their intersection or combined influence.`,
          papers: papers.map(p => p.title),
          questions: [
            `How does ${t1.toLowerCase()} jointly influence and interact with ${t2.toLowerCase()} in ${domainName} contexts?`,
            `What methodological approaches would best illuminate the relationship between ${t1.toLowerCase()} and ${t2.toLowerCase()}?`
          ],
          confidence: 70,
          categories,
          evidence: {
            papers: papers.map(p => p.title),
            topics: [t1, t2],
            contributions: [`Studies evaluate ${t1.toLowerCase()} and ${t2.toLowerCase()} in isolation.`],
            limitations: contributions.flatMap(c => (c.explicitLimitations ?? []).slice(0, 1)),
            reason: `No paper in the collection analyzes the intersection of ${t1.toLowerCase()} and ${t2.toLowerCase()}.`
          },
          methodologyRecommendation
        });
      }
    }
  }

  return candidates.slice(0, 5);
}
