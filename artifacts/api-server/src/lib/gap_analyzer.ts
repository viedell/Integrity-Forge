/**
 * gap_analyzer.ts  –  Public entry point (thin shim)
 *
 * Delegates all work to the domain-aware modular pipeline.
 * Import from this file to keep existing call sites unchanged.
 */
export type { AnalyzerResult } from "./gap/types";
export { runGapAnalysisPipeline as analyzeResearchGaps } from "./gap/pipeline";
