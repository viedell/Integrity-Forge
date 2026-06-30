import type { PaperInsightInput, AcademicInsightAnalysis } from "./types";
import { analyzeReliability } from "./reliability_analyzer";
import { buildClaimNetwork } from "./claim_network";
import { buildEvolutionTimeline, rankCorpusConcepts } from "./evolution_timeline";

export function runAcademicInsightPipeline(papers: PaperInsightInput[]): AcademicInsightAnalysis {
  const reliability = papers.map(p => analyzeReliability(p));
  const claimNetwork = buildClaimNetwork(papers);
  const timeline = buildEvolutionTimeline(papers);
  const rankedConcepts = rankCorpusConcepts(papers);

  return {
    reliability,
    claimNetwork,
    timeline,
    rankedConcepts
  };
}
