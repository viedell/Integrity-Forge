import { test } from 'node:test';
import assert from 'node:assert';
import { extractTopics } from './02_topic_extractor';
import { analyzeCoverage } from './03_coverage_analyzer';
import { generateGaps } from './04_gap_generator';
import type { PaperInput, DomainMatch, PaperContribution } from './types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockPapers: PaperInput[] = [
  {
    id: "paper-1",
    title: "Understanding Supply Chain Resilience and Supply Chains in Modern Business",
    abstract: "This study explores supply chain resilience in modern business contexts. Traditional supply chains are failing under load. We focus on supply chain traceability and sustainable agriculture in Indonesia. However, limitations exist regarding longitudinal tracking and sample size."
  },
  {
    id: "paper-2",
    title: "Plant-Based Diets and Processed Foods",
    abstract: "The purpose of this study is to analyze plant-based diets and processed food consumption patterns. Findings show that plant-based diet adoption is increasing. Limitations include small sample demographics and cross-sectional constraints. Future research should address long-term effects."
  }
];

const mockDomains: DomainMatch[] = [
  { domainKey: "business", displayName: "Business & Management", confidence: 95 },
  { domainKey: "food_science", displayName: "Food Science", confidence: 80 }
];

const mockContributions: PaperContribution[] = [
  {
    paperId: "paper-1",
    paperTitle: "Understanding Supply Chain Resilience and Supply Chains in Modern Business",
    objective: "explores supply chain resilience",
    contributions: ["Model for supply chain management"],
    methodology: "Conceptual analysis",
    findings: "Traditional supply chains fail under load",
    explicitLimitations: ["Lack of longitudinal tracking of outcomes"],
    implicitLimitations: ["Geographically restricted to Indonesia"]
  },
  {
    paperId: "paper-2",
    paperTitle: "Plant-Based Diets and Processed Foods",
    objective: "analyze plant-based diets",
    contributions: ["Analysis of dietary markets"],
    methodology: "Survey",
    findings: "Processed food markets are growing",
    explicitLimitations: ["Small sample demographics", "Cross-sectional timeline constraints over time"],
    implicitLimitations: []
  }
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('Concept Normalization: singular/plural variants merge into one canonical concept', () => {
  const topics = extractTopics(mockPapers, mockDomains);
  const topicNames = topics.map(t => t.name.toLowerCase());

  // "supply chains" (bare plural) should NOT appear alongside a more specific concept
  // e.g., "supply chain resilience" should subsume it
  const hasSpecificSupplyChain = topicNames.some(n =>
    n.includes("supply chain") && n.split(" ").length >= 2
  );
  const hasBareSupplyChains = topicNames.includes("supply chains");

  // If a more specific form exists, the bare plural should not appear separately
  if (hasSpecificSupplyChain) {
    assert.ok(!hasBareSupplyChains,
      `"supply chains" should be subsumed by a more specific concept like "supply chain resilience". Found topics: ${topicNames.join(", ")}`
    );
  }

  // Also: at most 2 supply chain variants (we allow "supply chain resilience" + "supply chain traceability" as distinct)
  const supplyChainVariants = topicNames.filter(n => {
    const words = n.split(" ");
    return words.includes("supply") && words.includes("chain");
  });
  // Bare "supply chain" and "supply chains" should NOT BOTH appear
  const hasBare = supplyChainVariants.filter(n => n === "supply chain" || n === "supply chains").length;
  assert.ok(hasBare <= 1,
    `Both "supply chain" and "supply chains" appeared together — plural should be deduplicated. Found: ${supplyChainVariants.join(", ")}`
  );
});

test('Concept Quality: broken noun phrases must be rejected', () => {
  const topics = extractTopics(mockPapers, mockDomains);
  const topicNames = topics.map(t => t.name.toLowerCase());

  const badPhrases = [
    "based diets", "based diet", "chain management", "influence architectural",
    "limitations over", "global food", "learning model"
  ];
  for (const bad of badPhrases) {
    assert.ok(!topicNames.includes(bad), `Broken noun phrase "${bad}" should be rejected but was found in topics`);
  }
});

test('Specificity Ranking: domain-specific concepts rank above generic terms', () => {
  const topics = extractTopics(mockPapers, mockDomains);

  // Generic terms should not appear at all
  const genericBlacklist = ["systems", "technology", "food", "business", "data", "model", "analysis"];
  const topicNames = topics.map(t => t.name.toLowerCase());
  for (const generic of genericBlacklist) {
    assert.ok(!topicNames.includes(generic), `Generic term "${generic}" should not appear as a standalone concept`);
  }

  // All topics should have a specificity score > 0
  for (const topic of topics) {
    assert.ok(topic.specificity > 0, `Topic "${topic.name}" has specificity score ${topic.specificity}, expected > 0`);
  }
});

test('Evidence Traceability: every extracted topic has source traces', () => {
  const topics = extractTopics(mockPapers, mockDomains);
  for (const topic of topics) {
    assert.ok(topic.sources.length > 0, `Topic "${topic.name}" must have at least one evidence trace`);
    const trace = topic.sources[0];
    assert.ok(trace.paperId, `Evidence trace for "${topic.name}" must have a paperId`);
    assert.ok(trace.sentence, `Evidence trace for "${topic.name}" must have a sentence`);
    assert.ok(trace.sentenceType, `Evidence trace for "${topic.name}" must have a sentenceType`);
  }
});

test('Coverage Analysis: backed by paper sentences only, no generic templates', () => {
  const topics = extractTopics(mockPapers, mockDomains);
  const coverage = analyzeCoverage(mockPapers, topics, mockContributions);

  // All coverage entries must have sources
  for (const entry of coverage) {
    assert.ok(Array.isArray(entry.sources), `Coverage entry "${entry.topic}" must have a sources array`);
  }

  // Verify template-driven forbidden phrases are not inserted
  const forbiddenPhrases = [
    "non-urban demographics",
    "cross-disciplinary validation",
    "long-term longitudinal tracking", // only allowed if in paper
    "demographic bias",
    "fairness",
    "scalability",
    "sustainability"
  ];
  for (const entry of coverage) {
    const allText = [entry.covered, entry.partial, entry.missing].join(" ").toLowerCase();
    for (const phrase of forbiddenPhrases) {
      // Allow only if it appears in the original papers too
      const inPapers = mockPapers.some(p => (p.title + " " + p.abstract).toLowerCase().includes(phrase));
      if (!inPapers) {
        assert.ok(!allText.includes(phrase), `Coverage for "${entry.topic}" contains forbidden template phrase: "${phrase}"`);
      }
    }
  }
});

test('Gap Generation: every gap has at least one evidence citation', () => {
  const topics = extractTopics(mockPapers, mockDomains);
  const gaps = generateGaps(mockPapers, mockDomains, topics, mockContributions);

  for (const gap of gaps) {
    const hasEvidence =
      (gap.evidence?.limitations ?? []).length > 0 ||
      (gap.evidence?.contributions ?? []).length > 0;
    assert.ok(hasEvidence, `Gap "${gap.title}" must have at least one evidence citation from the uploaded papers`);
  }
});

test('Gap Generation: no equivalent-concept fallback gaps', () => {
  const topics = extractTopics(mockPapers, mockDomains);
  const gaps = generateGaps(mockPapers, mockDomains, topics, mockContributions);

  for (const gap of gaps) {
    if (gap.dimensionId === "fallback_integration" && topics.length >= 2) {
      const t1 = topics[0].name.toLowerCase().split(/\s+/).map(w => {
        const w2 = w.toLowerCase();
        if (w2.endsWith("ies")) return w2.slice(0, -3) + "y";
        if (w2.endsWith("s") && !w2.endsWith("ss") && w2.length > 3) return w2.slice(0, -1);
        return w2;
      }).join(" ");
      const t2 = topics[1].name.toLowerCase().split(/\s+/).map(w => {
        const w2 = w.toLowerCase();
        if (w2.endsWith("ies")) return w2.slice(0, -3) + "y";
        if (w2.endsWith("s") && !w2.endsWith("ss") && w2.length > 3) return w2.slice(0, -1);
        return w2;
      }).join(" ");
      assert.notStrictEqual(t1, t2, `Fallback integration gap generated between equivalent normalized concepts: "${t1}" vs "${t2}"`);
    }
  }
});

test('Determinism: identical inputs produce identical outputs', () => {
  const topics1 = extractTopics(mockPapers, mockDomains);
  const topics2 = extractTopics(mockPapers, mockDomains);
  assert.deepStrictEqual(topics1, topics2, "extractTopics must be fully deterministic");

  const coverage1 = analyzeCoverage(mockPapers, topics1, mockContributions);
  const coverage2 = analyzeCoverage(mockPapers, topics1, mockContributions);
  assert.deepStrictEqual(coverage1, coverage2, "analyzeCoverage must be fully deterministic");

  const gaps1 = generateGaps(mockPapers, mockDomains, topics1, mockContributions);
  const gaps2 = generateGaps(mockPapers, mockDomains, topics1, mockContributions);
  assert.deepStrictEqual(gaps1, gaps2, "generateGaps must be fully deterministic");
});
