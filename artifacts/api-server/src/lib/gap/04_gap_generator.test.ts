import { test } from 'node:test';
import assert from 'node:assert';
import { generateGaps } from './04_gap_generator';
import type { PaperInput, DomainMatch, ExtractedTopic, PaperContribution } from './types';

test('generateGaps adheres to strict domain gating', () => {
  const mockPapers: PaperInput[] = [
    {
      id: "paper-1",
      title: "Supply Chain Digital Transformation",
      abstract: "A study on digital supply chain management and resilience. This study aims to evaluate digital capabilities. Limitation: the study does not address small business scalability or long-term longitudinal data."
    }
  ];

  const mockDomains: DomainMatch[] = [
    { domainKey: "business", displayName: "Business & Management", confidence: 100 },
    { domainKey: "finance", displayName: "Finance & Economics", confidence: 65 }
  ];

  const mockTopics: ExtractedTopic[] = [
    {
      name: "Supply Chain Digital Transformation",
      mentions: 5,
      papers: ["Supply Chain Digital Transformation"],
      representativeTerms: ["supply chain digital transformation"],
      specificity: 70,
      sources: [{
        paperId: "paper-1",
        paperTitle: "Supply Chain Digital Transformation",
        sentence: "A study on digital supply chain management and resilience.",
        sentenceType: "general"
      }]
    }
  ];

  const mockContributions: PaperContribution[] = [
    {
      paperId: "paper-1",
      paperTitle: "Supply Chain Digital Transformation",
      objective: "To evaluate digital capabilities.",
      methodology: "Case study.",
      findings: "Improves resilience.",
      explicitLimitations: ["The study does not address small business scalability"],
      implicitLimitations: ["No longitudinal tracking of outcomes"],
      contributions: ["Model for digital supply chain."]
    }
  ];

  const gaps = generateGaps(mockPapers, mockDomains, mockTopics, mockContributions);

  // If gaps are generated, they must belong to Business domain only
  for (const gap of gaps) {
    if (gap.dimensionId !== 'fallback_integration') {
      assert.strictEqual(gap.domainKey, 'business', `Gap "${gap.dimensionId}" should belong to business, but belongs to ${gap.domainKey}`);
      assert.ok(gap.dimensionId.startsWith('biz_'), `Gap "${gap.dimensionId}" does not appear to be from Business domain.`);
    }

    // Every gap must have evidence
    const hasEvidence =
      (gap.evidence?.limitations ?? []).length > 0 ||
      (gap.evidence?.contributions ?? []).length > 0;
    assert.ok(hasEvidence, `Gap "${gap.title}" was generated without evidence — this violates the evidence-backed requirement.`);
  }
});

test('generateGaps returns empty when domain confidence < 70', () => {
  const papers: PaperInput[] = [
    { id: "p1", title: "Generic Study", abstract: "General analysis of things." }
  ];
  const domains: DomainMatch[] = [
    { domainKey: "business", displayName: "Business", confidence: 50 }
  ];
  const gaps = generateGaps(papers, domains, [], []);
  assert.strictEqual(gaps.length, 0, "Should return no gaps when primary domain confidence < 70%");
});

test('generateGaps does not create gaps between equivalent concepts', () => {
  const papers: PaperInput[] = [
    { id: "p1", title: "Supply Chain Study", abstract: "Examines supply chain and supply chains in business contexts." }
  ];
  const domains: DomainMatch[] = [
    { domainKey: "business", displayName: "Business & Management", confidence: 85 }
  ];
  const topics: ExtractedTopic[] = [
    { name: "Supply Chain", mentions: 3, papers: ["Supply Chain Study"], representativeTerms: ["supply chain"], specificity: 40, sources: [] },
    { name: "Supply Chains", mentions: 2, papers: ["Supply Chain Study"], representativeTerms: ["supply chains"], specificity: 35, sources: [] }
  ];
  const contribs: PaperContribution[] = [
    {
      paperId: "p1",
      paperTitle: "Supply Chain Study",
      objective: "Examines supply chains",
      methodology: "Survey",
      findings: "Supply chains improved",
      explicitLimitations: ["Limited to single sector"],
      implicitLimitations: [],
      contributions: ["Framework for supply chain analysis"]
    }
  ];

  const gaps = generateGaps(papers, domains, topics, contribs);

  // Should not have a fallback_integration gap between "Supply Chain" and "Supply Chains"
  const fallbackGap = gaps.find(g => g.dimensionId === "fallback_integration");
  if (fallbackGap) {
    const t1 = topics[0].name.toLowerCase();
    const t2 = topics[1].name.toLowerCase();
    assert.ok(
      !(fallbackGap.title.toLowerCase().includes(t1) && fallbackGap.title.toLowerCase().includes(t2)),
      `Should not generate fallback integration gap between equivalent concepts "${topics[0].name}" and "${topics[1].name}"`
    );
  }
});
