// ============================================================
// taxonomy.ts  –  Scientific Taxonomy and Normalization Catalog
// ============================================================

export interface ConceptDefinition {
  canonical: string;
  category: "technology" | "method" | "task" | "problem";
  aliases: string[]; // lowercase patterns to match
}

export const CONCEPT_TAXONOMY: ConceptDefinition[] = [
  {
    canonical: "Large Language Models (LLMs)",
    category: "technology",
    aliases: ["large language models", "large language model", "llms", "llm"]
  },
  {
    canonical: "Retrieval-Augmented Generation (RAG)",
    category: "technology",
    aliases: ["retrieval-augmented generation", "retrieval augmented generation", "rag", "rag systems", "rag system"]
  },
  {
    canonical: "Reinforcement Learning from Human Feedback (RLHF)",
    category: "method",
    aliases: ["reinforcement learning from human feedback", "rlhf", "human feedback reinforcement"]
  },
  {
    canonical: "GPT-3",
    category: "technology",
    aliases: ["gpt-3", "gpt3", "gpt 3"]
  },
  {
    canonical: "GPT-4",
    category: "technology",
    aliases: ["gpt-4", "gpt4", "gpt 4"]
  },
  {
    canonical: "Llama 2",
    category: "technology",
    aliases: ["llama 2", "llama2", "llama-2"]
  },
  {
    canonical: "BERT",
    category: "technology",
    aliases: ["bert", "bidirectional encoder representations"]
  },
  {
    canonical: "Transformer",
    category: "technology",
    aliases: ["transformer", "transformers", "transformer architecture"]
  },
  {
    canonical: "Fine-tuning",
    category: "method",
    aliases: ["fine-tuning", "finetuning", "fine tuning", "supervised fine-tuning", "sft"]
  },
  {
    canonical: "Foundation Models",
    category: "technology",
    aliases: ["foundation models", "foundation model"]
  },
  {
    canonical: "Question Answering",
    category: "task",
    aliases: ["question answering", "qa tasks", "qa task", "question-answering"]
  },
  {
    canonical: "Text Summarization",
    category: "task",
    aliases: ["text summarization", "summarization", "summarizing"]
  },
  {
    canonical: "Machine Translation",
    category: "task",
    aliases: ["machine translation", "translation task"]
  },
  {
    canonical: "Sentiment Analysis",
    category: "task",
    aliases: ["sentiment analysis", "sentiment classification"]
  },
  {
    canonical: "Hallucination",
    category: "problem",
    aliases: ["hallucination", "hallucinations", "hallucinate", "model hallucination"]
  },
  {
    canonical: "Human Alignment",
    category: "problem",
    aliases: ["human alignment", "alignment", "aligning models", "model alignment"]
  },
  {
    canonical: "Factual Consistency",
    category: "problem",
    aliases: ["factual consistency", "factuality", "factual errors"]
  },
  {
    canonical: "Bias",
    category: "problem",
    aliases: ["bias", "biases", "gender bias", "social bias"]
  },
  {
    canonical: "Explainability",
    category: "problem",
    aliases: ["explainability", "explainable ai", "xai", "interpretability"]
  },
  {
    canonical: "Safety",
    category: "problem",
    aliases: ["safety", "safety guardrails", "harmful outputs"]
  },
  {
    canonical: "Transfer Learning",
    category: "method",
    aliases: ["transfer learning"]
  },
  {
    canonical: "Instruction Tuning",
    category: "method",
    aliases: ["instruction tuning", "instruction-tuned"]
  },
  {
    canonical: "Prompt Engineering",
    category: "method",
    aliases: ["prompt engineering", "in-context learning", "few-shot prompting"]
  },
  {
    canonical: "Multimodal Learning",
    category: "method",
    aliases: ["multimodal learning", "multimodal"]
  }
];

export const GENERIC_ACADEMIC_TERMS = new Set([
  "language", "paper", "study", "result", "system", "model", "models", "research",
  "analysis", "training", "method", "performance", "approach", "results", "systems",
  "methods", "approaches", "framework", "frameworks", "process", "processes",
  "evaluation", "evaluations", "technique", "techniques", "study", "studies", "data"
]);

/**
 * Normalizes alias string into its canonical form from our scientific taxonomy
 */
export function normalizeScientificConcept(text: string): string | null {
  const clean = text.toLowerCase().trim();
  for (const def of CONCEPT_TAXONOMY) {
    if (def.aliases.includes(clean)) {
      return def.canonical;
    }
  }
  return null;
}

/**
 * Find all matching scientific concepts from the text
 */
export function extractScientificConceptsFromText(text: string): string[] {
  const matched = new Set<string>();
  const lower = text.toLowerCase();

  for (const def of CONCEPT_TAXONOMY) {
    for (const alias of def.aliases) {
      // Regex check with word boundaries to avoid partial matching (e.g. RAG inside drag)
      const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(lower)) {
        matched.add(def.canonical);
      }
    }
  }

  return Array.from(matched);
}
