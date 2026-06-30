import { test } from 'node:test';
import assert from 'node:assert';
import { runAcademicInsightPipeline } from './pipeline';
import type { PaperInsightInput } from './types';

const mockPapers: PaperInsightInput[] = [
  {
    id: "paper-1",
    title: "Rigorous Evaluation of Supply Chain Traceability Platforms",
    abstract: "In this empirical study, we propose a novel supply chain traceability system. We evaluated it using a dataset of 500 transaction records. Statistical significance was verified with p-value < 0.01. The performance achieved 95% accuracy in testing. Limitations include scope restrictions to local farms. Future research should explore global supply networks.",
    year: 2024
  },
  {
    id: "paper-2",
    title: "Analyzing Supply Chain Failures and Traceability Limitations",
    abstract: "This case study focuses on supply chain bottlenecks. Our findings suggest that existing supply chain traceability systems fail under high transactional throughput. No repository or statistical metrics were evaluated.",
    year: 2025
  }
];

test('Academic Insight Pipeline - Evidence Reliability Analyzer', () => {
  const result = runAcademicInsightPipeline(mockPapers);
  
  // Paper 1 evaluation (should have high score because of dataset, methodology, statistics, limitations, future work, metrics)
  const rel1 = result.reliability.find(r => r.paperId === "paper-1")!;
  assert.ok(rel1.score >= 80, `Expected high reliability score for paper-1, got ${rel1.score}`);
  assert.strictEqual(rel1.reliabilityLevel, "Exceptional");
  assert.ok(rel1.supportingEvidence.some(e => e.signal.includes("Dataset")), "Should find dataset evidence");
  assert.ok(rel1.supportingEvidence.some(e => e.signal.includes("Methodology")), "Should find methodology evidence");
  assert.ok(rel1.supportingEvidence.some(e => e.signal.includes("Statistical")), "Should find statistical evidence");
  assert.ok(rel1.supportingEvidence.some(e => e.signal.includes("Limitation")), "Should find limitations evidence");

  // Paper 2 evaluation (should have low score because it lacks statistics, datasets, and quantitative metrics)
  const rel2 = result.reliability.find(r => r.paperId === "paper-2")!;
  assert.ok(rel2.score < 60, `Expected moderate/low reliability score for paper-2, got ${rel2.score}`);
  assert.strictEqual(rel2.reliabilityLevel, "Low");
  assert.ok(rel2.weaknesses.some(w => w.includes("dataset")), "Should list dataset as a weakness");
  assert.ok(rel2.weaknesses.some(w => w.includes("metrics")), "Should list quantitative metrics as a weakness");
});

test('Academic Insight Pipeline - Claim Network Visualization', () => {
  const result = runAcademicInsightPipeline(mockPapers);
  
  // Verify nodes
  assert.ok(result.claimNetwork.nodes.length >= 2, "Should extract at least 2 claim nodes");
  
  // Verify edge relationships (there is a contradiction overlap between supply chain traceability success in paper-1 vs failures/fails in paper-2)
  const edge = result.claimNetwork.edges.find(e => e.type === "contradicts");
  assert.ok(edge, "Should detect contradiction edge based on opposing assertions");
  assert.ok(edge.evidence.length > 0, "Edge must contain supporting evidence sentences");

  // Verify richer semantic fields are present on edges
  if (edge) {
    assert.ok(edge.semanticType !== undefined, "Edge should have semanticType");
    assert.ok(typeof edge.confidence === 'number' && edge.confidence >= 0 && edge.confidence <= 100, "Edge confidence should be 0-100");
    assert.ok(Array.isArray(edge.sharedConcepts), "Edge should have sharedConcepts array");
    assert.ok(typeof edge.explanation === 'string' && edge.explanation.length > 0, "Edge should have explanation text");
  }
});

test('Academic Insight Pipeline - Research Evolution Timeline', () => {
  const result = runAcademicInsightPipeline(mockPapers);
  
  // Verify chronological timeline sorting
  assert.strictEqual(result.timeline.length, 2, "Timeline should contain 2 entries for 2024 and 2025");
  assert.strictEqual(result.timeline[0].year, 2024, "First timeline entry should be 2024");
  assert.strictEqual(result.timeline[1].year, 2025, "Second timeline entry should be 2025");

  // Verify methodology and concepts aggregates
  assert.ok(result.timeline[0].methodologies.includes("Empirical Study"), "Timeline 2024 should list Empirical Study");
  assert.ok(result.timeline[1].methodologies.includes("Case Study"), "Timeline 2025 should list Case Study");
});

test('Academic Insight Pipeline - Ranked Corpus Concepts', () => {
  const result = runAcademicInsightPipeline(mockPapers);
  
  // Verify rankedConcepts is populated
  assert.ok(Array.isArray(result.rankedConcepts), "rankedConcepts should be an array");
  assert.ok(result.rankedConcepts.length > 0, "rankedConcepts should contain at least one concept");
  
  // All ranked concepts should be non-empty strings (taxonomy-matched terms)
  result.rankedConcepts.forEach((concept: string) => {
    assert.ok(typeof concept === 'string' && concept.length > 0, `Each rankedConcept should be a non-empty string, got: ${concept}`);
  });
});

test('Academic Insight Pipeline - Determinism check', () => {
  const result1 = runAcademicInsightPipeline(mockPapers);
  const result2 = runAcademicInsightPipeline(mockPapers);
  assert.deepStrictEqual(result1, result2, "runAcademicInsightPipeline must be fully deterministic");
});
