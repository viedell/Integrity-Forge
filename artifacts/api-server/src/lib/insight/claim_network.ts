import type { PaperInsightInput, ClaimNode, ClaimEdge, ClaimNetwork } from "./types";
import { extractScientificConceptsFromText } from "./taxonomy";

function segmentSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

const ASSERTION_VERBS = [
  /\bwe (find|demonstrate|show|propose|present|observe|conclude|argue)\b/i,
  /\bresults? (indicate|reveal|show|demonstrate|suggest)\b/i,
  /\bour findings? (confirm|suggest|show)\b/i,
  /\b(evidence suggests|proves that|leads to)\b/i
];

function extractClaimsFromPaper(paper: PaperInsightInput): { sentence: string; label: string }[] {
  const fullText = `${paper.title}. ${paper.abstract}`;
  const sentences = segmentSentences(fullText);
  const claims: { sentence: string; label: string }[] = [];

  for (const sent of sentences) {
    if (ASSERTION_VERBS.some(regex => regex.test(sent))) {
      let label = sent;
      if (label.length > 85) {
        label = label.substring(0, 82) + "...";
      }
      claims.push({
        sentence: sent,
        label: label.replace(/\s+/g, " ").trim()
      });
    }
  }

  if (claims.length === 0) {
    claims.push({
      sentence: paper.title,
      label: paper.title
    });
  }

  return claims;
}

export function buildClaimNetwork(papers: PaperInsightInput[]): ClaimNetwork {
  const nodes: ClaimNode[] = [];
  const edges: ClaimEdge[] = [];

  // 1. Extract claim nodes
  const claimMap: Map<string, { sentence: string; paperId: string; paperTitle: string }> = new Map();
  let nodeCounter = 0;

  for (const paper of papers) {
    const claims = extractClaimsFromPaper(paper);
    for (const c of claims) {
      nodeCounter++;
      const id = `claim-${paper.id}-${nodeCounter}`;
      nodes.push({
        id,
        label: c.label,
        paperId: paper.id,
        paperTitle: paper.title
      });
      claimMap.set(id, {
        sentence: c.sentence,
        paperId: paper.id,
        paperTitle: paper.title
      });
    }
  }

  // 2. Build edges deterministically satisfying both Condition A and Condition B
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      // Skip pairwise claims from same paper
      if (nodeA.paperId === nodeB.paperId) continue;

      const claimAInfo = claimMap.get(nodeA.id)!;
      const claimBInfo = claimMap.get(nodeB.id)!;

      const paperAObj = papers.find(p => p.id === nodeA.paperId)!;
      const paperBObj = papers.find(p => p.id === nodeB.paperId)!;

      // CONDITION A: Shared Scientific Concept from taxonomy
      const conceptsA = extractScientificConceptsFromText(claimAInfo.sentence);
      const conceptsB = extractScientificConceptsFromText(claimBInfo.sentence);
      const sharedConcepts = conceptsA.filter(c => conceptsB.includes(c));

      if (sharedConcepts.length === 0) {
        // No valid shared taxonomy concepts -> skip
        continue;
      }

      // CONDITION B: Shared Research Intent
      // Look for intent keywords in the claims or papers
      const textA = claimAInfo.sentence.toLowerCase();
      const textB = claimBInfo.sentence.toLowerCase();

      const isSurveyA = /\b(survey|review|synthesize|overview|literature)\b/i.test(textA) || paperAObj.title.toLowerCase().includes("survey");
      const isSurveyB = /\b(survey|review|synthesize|overview|literature)\b/i.test(textB) || paperBObj.title.toLowerCase().includes("survey");

      const proposesA = /\b(propose|present|introduce|design|develop|build)\b/i.test(textA);
      const proposesB = /\b(propose|present|introduce|design|develop|build)\b/i.test(textB);

      const evaluatesA = /\b(evaluate|assess|test|experiment|compare|study|analyze)\b/i.test(textA);
      const evaluatesB = /\b(evaluate|assess|test|experiment|compare|study|analyze)\b/i.test(textB);

      const improvesA = /\b(improve|enhance|advance|outperform|boost|mitigate|address)\b/i.test(textA);
      const improvesB = /\b(improve|enhance|advance|outperform|boost|mitigate|address)\b/i.test(textB);

      // Check if there is compatible scientific intent
      const hasIntentMatch =
        (isSurveyA || isSurveyB) ||
        (proposesA && proposesB) ||
        (evaluatesA && evaluatesB) ||
        (improvesA || improvesB) ||
        (proposesA && evaluatesB) ||
        (evaluatesA && proposesB);

      if (!hasIntentMatch) {
        continue;
      }

      // Determine Relationship Type & Edge confidence
      let edgeType: "supports" | "extends" | "contradicts" | "summarizes" | "improves" = "supports";
      let confidence = 75;
      let reason = "";

      const yearA = paperAObj.year ?? 0;
      const yearB = paperBObj.year ?? 0;

      // 1. SUMMARIZES Check (Survey reviews/synthesizes target)
      if (isSurveyA && !isSurveyB) {
        edgeType = "summarizes";
        confidence = 90;
        reason = `Paper A ("${nodeA.paperTitle}") surveys or synthesizes research on ${sharedConcepts.join(" and ")} introduced or evaluated in Paper B ("${nodeB.paperTitle}").`;
      } else if (isSurveyB && !isSurveyA) {
        edgeType = "summarizes";
        confidence = 90;
        reason = `Paper B ("${nodeB.paperTitle}") surveys or synthesizes research on ${sharedConcepts.join(" and ")} introduced or evaluated in Paper A ("${nodeA.paperTitle}").`;
      }
      // 2. CONTRADICTS Check
      else if (
        (/\b(fail|not|cannot|contradict|unable|fails|limitation|degrade|decrease)\b/i.test(textA) !==
         /\b(fail|not|cannot|contradict|unable|fails|limitation|degrade|decrease)\b/i.test(textB))
      ) {
        edgeType = "contradicts";
        confidence = 85;
        reason = `Paper A reports different findings on ${sharedConcepts.join(", ")} compared to Paper B.`;
      }
      // 3. IMPROVES Check
      else if (improvesB && yearB > yearA) {
        edgeType = "improves";
        confidence = 88;
        reason = `Paper B ("${nodeB.paperTitle}"), published in ${yearB}, explicitly improves upon the ${sharedConcepts.join(", ")} methods in Paper A ("${nodeA.paperTitle}").`;
      } else if (improvesA && yearA > yearB) {
        edgeType = "improves";
        confidence = 88;
        reason = `Paper A ("${nodeA.paperTitle}"), published in ${yearA}, explicitly improves upon the ${sharedConcepts.join(", ")} methods in Paper B ("${nodeB.paperTitle}").`;
      }
      // 4. EXTENDS Check
      else if (yearB > yearA && yearA > 0) {
        edgeType = "extends";
        confidence = 82;
        reason = `Paper B ("${nodeB.paperTitle}") builds on techniques related to ${sharedConcepts.join(", ")} outlined in Paper A ("${nodeA.paperTitle}").`;
      } else if (yearA > yearB && yearB > 0) {
        edgeType = "extends";
        confidence = 82;
        reason = `Paper A ("${nodeA.paperTitle}") builds on techniques related to ${sharedConcepts.join(", ")} outlined in Paper B ("${nodeB.paperTitle}").`;
      }
      // 5. SUPPORTS Check
      else {
        edgeType = "supports";
        confidence = 80;
        reason = `Both papers report compatible evaluations or architectures concerning ${sharedConcepts.join(" and ")}.`;
      }

      const evidence = [
        `Deterministic rule used: ${edgeType.toUpperCase()}`,
        `Confidence score: ${confidence}%`,
        `Shared concepts: ${sharedConcepts.join(", ")}`,
        `Explanation: ${reason}`,
        `Source A: "${claimAInfo.sentence}"`,
        `Source B: "${claimBInfo.sentence}"`
      ];

      // Map internal semantic type to the API-contract enum (supports/extends/contradicts)
      let mappedType: "supports" | "extends" | "contradicts" = "supports";
      if (edgeType === "contradicts") mappedType = "contradicts";
      else if (edgeType === "extends" || edgeType === "improves" || edgeType === "summarizes") mappedType = "extends";

      edges.push({
        sourceClaimId: nodeA.id,
        targetClaimId: nodeB.id,
        type: mappedType,
        semanticType: edgeType,
        confidence,
        sharedConcepts,
        explanation: reason,
        evidence
      });
    }
  }

  // Stable sort edges
  edges.sort((a, b) => {
    const comp = a.sourceClaimId.localeCompare(b.sourceClaimId);
    if (comp !== 0) return comp;
    return a.targetClaimId.localeCompare(b.targetClaimId);
  });

  return { nodes, edges };
}
