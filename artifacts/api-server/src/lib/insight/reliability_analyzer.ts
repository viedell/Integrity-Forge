import type { PaperInsightInput, EvidenceReliability } from "./types";

function segmentSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

interface SignalRule {
  key: string;
  name: string;
  points: number;
  patterns: RegExp[];
  missingWarning: string;
}

const SIGNAL_RULES: SignalRule[] = [
  {
    key: "dataset",
    name: "Dataset & Sample Specification",
    points: 20,
    patterns: [
      /\b(datasets?|samples?|participants?|respondents?|corpus|subjects?|n\s*=\s*\d+)\b/i,
      /\b(surveyed|interviewed|sampled|cohorts? of|data collected)\b/i
    ],
    missingWarning: "Lack of explicit dataset or participant sample size details."
  },
  {
    key: "methodology",
    name: "Explicit Methodology Statement",
    points: 15,
    patterns: [
      /\b(methodolog(y|ies)|case stud(y|ies)|experiments?|controlled trials?|mixed-methods|qualitative|quantitative|survey designs?|empirical analysis)\b/i,
      /\b(we propose a|we developed a|this study utilizes|research design)\b/i
    ],
    missingWarning: "No clear methodology description or research design identified."
  },
  {
    key: "statistics",
    name: "Statistical Evaluation",
    points: 15,
    patterns: [
      /\b(p-values?|anova|t-tests?|regressions?|correlations?|statistical significance|chi-square|confidence intervals?|p\s*<\s*0?\.\d+)\b/i,
      /\b(statistically significant|variance|standard deviation)\b/i
    ],
    missingWarning: "Absence of formal statistical significance testing or regression results."
  },
  {
    key: "limitations",
    name: "Limitations Discussion",
    points: 15,
    patterns: [
      /\b(limitations?|limits?|restricted?|constrains?|excludes?|threats to validity|does not address|scope is restricted)\b/i,
      /\b(unable to|not cover|fails? to)\b/i
    ],
    missingWarning: "No explicit discussion of study boundaries or threats to validity."
  },
  {
    key: "future_work",
    name: "Future Work & Extensions",
    points: 15,
    patterns: [
      /\b(future (works?|research|studies)|further research|recommended|should be (investigated|explored|studied))\b/i,
      /\b(avenues for future|unresolved questions)\b/i
    ],
    missingWarning: "No recommendations or directions outlined for future work."
  },
  {
    key: "metrics",
    name: "Quantitative Metrics",
    points: 20,
    patterns: [
      /\b(accurac(y|ies)|f1-scores?|precisions?|recalls?|auc|mae|rmse|baselines?|benchmarks?|percent(age)?s?)\b/i,
      /\b(performance of|outperformed|improved by \d+)\b/i
    ],
    missingWarning: "No standard quantitative metrics, benchmarks, or baseline comparisons reported."
  }
];

export function analyzeReliability(paper: PaperInsightInput): EvidenceReliability {
  const fullText = `${paper.title}. ${paper.abstract}`;
  const sentences = segmentSentences(fullText);

  let score = 0;
  const supportingEvidence: Array<{ signal: string; sentence: string }> = [];
  const weaknesses: string[] = [];

  for (const rule of SIGNAL_RULES) {
    let matchFound = false;
    for (const sent of sentences) {
      if (rule.patterns.some(p => p.test(sent))) {
        supportingEvidence.push({
          signal: rule.name,
          sentence: sent
        });
        score += rule.points;
        matchFound = true;
        break; // take first match only
      }
    }
    if (!matchFound) {
      weaknesses.push(rule.missingWarning);
    }
  }

  // Determine reliability level based on score
  let reliabilityLevel: "Low" | "Medium" | "High" | "Exceptional" = "Low";
  if (score >= 90) reliabilityLevel = "Exceptional";
  else if (score >= 70) reliabilityLevel = "High";
  else if (score >= 40) reliabilityLevel = "Medium";

  // Confidence is calculated deterministically
  const confidence = Math.min(98, 70 + supportingEvidence.length * 4);

  // Construct structured explanation
  const hitCount = supportingEvidence.length;
  const explanation = `This paper achieves an evidence reliability score of ${score}/100 (${reliabilityLevel} Reliability) based on finding ${hitCount} of the 6 core scientific validity signals in the title and abstract text. ` +
    (weaknesses.length > 0
      ? `Areas where scientific grounding could be improved include: ${weaknesses.map(w => w.replace(/\.$/, "")).join("; ")}.`
      : "The paper demonstrates rigorous reporting standards, satisfying all evaluated quality dimensions.");

  return {
    paperId: paper.id,
    paperTitle: paper.title,
    score,
    reliabilityLevel,
    supportingEvidence,
    weaknesses,
    confidence,
    explanation
  };
}
