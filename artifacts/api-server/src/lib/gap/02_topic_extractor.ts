// ============================================================
// 02_topic_extractor.ts  –  Stage 2: Specificity-Ranked Topic Extraction
//
// Design principles:
//   - Corpus-only: all extracted topics trace to actual paper sentences
//   - Specificity-first: domain-specific concepts ranked above generic parents
//   - Evidence-backed: every concept has at least one supporting EvidenceTrace
//   - Deterministic: identical inputs always produce identical outputs
//   - Phrase integrity: invalid/incomplete noun phrases are rejected
// ============================================================
import type { PaperInput, DomainMatch, ExtractedTopic, EvidenceTrace } from "./types";
import { DOMAIN_RULES } from "./domain_rules";

// ---------------------------------------------------------------------------
// Morphological helpers
// ---------------------------------------------------------------------------

function toSingular(word: string): string {
  const w = word.toLowerCase();
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("sses")) return w;             // "passes" -> stays
  if (w.endsWith("xes") || w.endsWith("shes") || w.endsWith("ches")) return w.slice(0, -2);
  if (w.endsWith("ses") && w.length > 4) return w.slice(0, -1);
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -1);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().trim().split(/\s+/).map(toSingular).join(" ");
}

// ---------------------------------------------------------------------------
// Generic concept blacklist – these terms are too broad to be a standalone topic
// ---------------------------------------------------------------------------

const GENERIC_CONCEPTS = new Set([
  "artificial intelligence", "machine learning", "learning models", "learning model",
  "deep learning", "neural network", "neural networks", "systems", "system",
  "technology", "technologies", "business", "food", "architecture", "education",
  "healthcare", "agriculture", "finance", "iot", "concept", "concepts",
  "data", "model", "models", "processing", "methodology", "methodologies",
  "approach", "approaches", "framework", "frameworks", "information", "analysis",
  "study", "studies", "research", "paper", "papers", "theory", "theories",
  "evaluation", "evaluations", "results", "result", "findings", "finding",
  "performance", "method", "methods", "learning", "model training", "prediction",
  "prediction model", "classification", "overview", "review", "survey",
  "issue", "issues", "challenge", "challenges", "aspect", "aspects",
  "factor", "factors", "domain", "domains", "area", "areas", "field", "fields",
  "context", "contexts", "environment", "environments", "region", "regions",
  "global", "local", "current", "existing", "recent", "previous", "various",
  "different", "multiple", "several", "related", "specific", "general"
]);

// Single-word terms that should never be treated as concepts
const GENERIC_SINGLE_WORDS = new Set([
  "ai", "ml", "iot", "data", "model", "system", "food", "health", "care",
  "work", "time", "cost", "risk", "user", "users", "case", "cases",
  "use", "type", "types", "form", "forms", "level", "levels", "rate", "rates",
  "impact", "effect", "role", "need", "needs"
]);

// Stop adjectives that should invalidate a phrase when they're the only modifier
const STOP_ADJECTIVES_START = new Set([
  "based", "related", "driven", "based", "oriented", "enabled", "supported",
  "led", "focused", "centered", "centric", "specific", "general", "common",
  "various", "different", "multiple", "several", "other", "such", "new",
  "current", "existing", "previous", "recent", "limited", "key", "main",
  "major", "overall", "global", "local", "traditional", "conventional",
  "potential", "possible", "typical", "standard", "basic", "advanced"
]);

const STOP_WORDS_END = new Set([
  "over", "under", "above", "across", "within", "of", "for", "in", "on",
  "at", "by", "with", "and", "or", "to", "from", "the", "a", "an",
  "architectural", "analytical", "empirical", "systematic", "clinical",
  "ethical", "practical", "theoretical", "methodological", "longitudinal",
  "conceptual", "qualitative", "quantitative", "limits", "limitation",
  "limitations", "aspects", "issues", "challenges", "factors", "areas",
  "context", "level", "levels", "rate", "rates", "impact", "effect",
  "performance", "results", "findings", "analysis", "evaluation", "review"
]);

// Exact phrases that should always be rejected (boilerplate/fragments)
const BLACKLISTED_PHRASES = new Set([
  "based diets", "based diet", "chain management", "influence architectural",
  "limitations over", "global food", "learning models", "model training",
  "data analysis", "study findings", "research results", "current study",
  "current research", "existing literature", "future research", "future work",
  "various factors", "multiple aspects", "different approaches", "key challenges",
  "significant impact", "important role", "various methods", "existing methods",
  // Academic boilerplate verb phrases that are NOT research topics
  "future work should", "work should investigate", "work should explore",
  "research should prioritize", "research should investigate", "research should explore",
  "future research should", "future studies should", "should investigate",
  "should explore", "should prioritize", "should establish", "should address",
  "publication date", "systematic literature", "literature review",
  "experimental evaluation", "experimental results", "remaining challenges",
  "remaining limitations", "existing studies", "existing research"
]);

// ---------------------------------------------------------------------------
// Noun phrase validation
// ---------------------------------------------------------------------------

function isValidNounPhrase(phrase: string): boolean {
  const lower = phrase.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // Must have at least 2 words
  if (words.length < 2) return false;

  // Hard blacklist
  if (BLACKLISTED_PHRASES.has(lower)) return false;

  // Reject phrases containing modal/auxiliary verbs (these are action fragments, not concepts)
  const modalVerbs = new Set(["should", "could", "would", "must", "shall", "might", "will", "may"]);
  if (words.some(w => modalVerbs.has(w))) return false;

  // Invalid start words
  if (STOP_ADJECTIVES_START.has(words[0]) || STOP_WORDS_END.has(words[0])) return false;

  // Invalid end words
  if (STOP_WORDS_END.has(words[words.length - 1])) return false;

  // Reject if it consists entirely of single-letter tokens or numbers
  if (words.every(w => w.length <= 1)) return false;

  // Reject pure stop-word combinations (e.g. "in the")
  const stopWords = new Set(["the", "a", "an", "in", "on", "at", "by", "of", "for", "to", "and", "or", "with"]);
  if (words.every(w => stopWords.has(w))) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Sentence segmentation helper
// ---------------------------------------------------------------------------

function segmentSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

// Classify sentence role for evidence tracing
type SentenceRole = "title" | "objective" | "finding" | "limitation" | "future_work" | "general";

function classifySentenceRole(sentence: string): SentenceRole {
  const s = sentence.toLowerCase();
  if (/\b(aim|focus|investigate|examine|explore|propose|present|study|analyze|analyze)\b/.test(s)) return "objective";
  if (/\b(results?|findings?|show|demonstrate|reveal|found|indicate|suggest|conclude)\b/.test(s)) return "finding";
  if (/\b(limitation|limit|restrict|constrain|exclude|not address|not cover|fail to|unable to)\b/.test(s)) return "limitation";
  if (/\b(future (work|research|stud)|further research|recommended|should be (investigated|explored|studied))\b/.test(s)) return "future_work";
  return "general";
}

// ---------------------------------------------------------------------------
// Specificity scoring
// ---------------------------------------------------------------------------

function calculateSpecificity(
  term: string,
  papers: PaperInput[],
  domainKeywords: Set<string>
): { score: number; sources: EvidenceTrace[] } {
  const lower = term.toLowerCase().trim();
  const sources: EvidenceTrace[] = [];
  let score = 0;

  // Hard penalty for generic concepts
  if (GENERIC_CONCEPTS.has(lower)) return { score: -200, sources: [] };
  if (GENERIC_SINGLE_WORDS.has(lower)) return { score: -200, sources: [] };

  // Reward multi-word terms (more specific)
  const words = lower.split(/\s+/);
  if (words.length >= 4) score += 30;
  else if (words.length === 3) score += 20;
  else if (words.length === 2) score += 10;

  // Reward terms that appear in domain keyword list (confirmed domain-relevant)
  if (domainKeywords.has(lower)) score += 15;

  // Reward appearance in different paper sections
  for (const paper of papers) {
    // Title match — strongest signal
    if (paper.title.toLowerCase().includes(lower)) {
      score += 25;
      sources.push({
        paperId: paper.id,
        paperTitle: paper.title,
        sentence: `The study is explicitly titled: "${paper.title}"`,
        sentenceType: "title"
      });
      break; // only count title once per concept
    }
  }

  for (const paper of papers) {
    const sentences = segmentSentences(paper.abstract);
    for (const s of sentences) {
      if (!s.toLowerCase().includes(lower)) continue;
      const role = classifySentenceRole(s);

      if (role === "objective") {
        score += 20;
        sources.push({ paperId: paper.id, paperTitle: paper.title, sentence: s, sentenceType: "objective" });
      } else if (role === "finding") {
        score += 15;
        sources.push({ paperId: paper.id, paperTitle: paper.title, sentence: s, sentenceType: "finding" });
      } else if (role === "limitation") {
        score += 12;
        sources.push({ paperId: paper.id, paperTitle: paper.title, sentence: s, sentenceType: "limitation" });
      } else if (role === "future_work") {
        score += 12;
        sources.push({ paperId: paper.id, paperTitle: paper.title, sentence: s, sentenceType: "future_work" });
      } else {
        score += 5;
        if (sources.length < 3) {
          sources.push({ paperId: paper.id, paperTitle: paper.title, sentence: s, sentenceType: "general" });
        }
      }
    }
  }

  return { score, sources };
}

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

export function extractTopics(papers: PaperInput[], domains: DomainMatch[]): ExtractedTopic[] {
  if (domains.length === 0 || papers.length === 0) return [];

  // Collect all domain keyword vocabularies from detected domains
  const domainKeywords = new Set<string>();
  for (const d of domains) {
    const rule = DOMAIN_RULES.domains[d.domainKey];
    if (!rule) continue;
    rule.topicKeywords.forEach(k => domainKeywords.add(k.toLowerCase().trim()));
  }

  // -----------------------------------------------------------------------
  // Phase 1: Keyword matching against domain vocabulary
  // -----------------------------------------------------------------------
  const candidateMap: Map<string, {
    rawTerms: Set<string>;
    paperTitles: Set<string>;
    count: number;
  }> = new Map();

  function recordCandidate(rawTerm: string, paperTitle: string) {
    if (!isValidNounPhrase(rawTerm)) return;
    const norm = normalizePhrase(rawTerm);
    if (!candidateMap.has(norm)) {
      candidateMap.set(norm, { rawTerms: new Set(), paperTitles: new Set(), count: 0 });
    }
    const entry = candidateMap.get(norm)!;
    entry.rawTerms.add(rawTerm.toLowerCase().trim());
    entry.paperTitles.add(paperTitle);
    entry.count++;
  }

  // Match domain vocabulary keywords in each paper
  for (const paper of papers) {
    const fullText = `${paper.title} ${paper.abstract}`.toLowerCase();
    for (const kw of domainKeywords) {
      if (kw.split(/\s+/).length < 2) continue; // only multi-word terms from domain vocab
      if (fullText.includes(kw)) {
        recordCandidate(kw, paper.title);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2: Free-form bigram + trigram extraction within sentence boundaries
  // -----------------------------------------------------------------------
  for (const paper of papers) {
    const sentences = segmentSentences(paper.abstract);
    for (const sent of sentences) {
      const words = sent
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !w.match(/^\d+$/));

      // Bigrams
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        // Only collect if related to domain vocabulary
        const isRelated = Array.from(domainKeywords).some(kw =>
          kw.includes(words[i]) || kw.includes(words[i + 1])
        );
        if (isRelated) {
          recordCandidate(bigram, paper.title);
        }
      }

      // Trigrams (only if related to domain vocabulary)
      for (let i = 0; i < words.length - 2; i++) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        const isRelated = Array.from(domainKeywords).some(kw =>
          kw.includes(words[i]) || kw.includes(words[i + 1]) || kw.includes(words[i + 2])
        );
        if (isRelated) {
          recordCandidate(trigram, paper.title);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Phase 3: Score each candidate and filter out low-specificity terms
  // -----------------------------------------------------------------------
  const MIN_SPECIFICITY = 10; // threshold – must exceed to qualify as a topic

  const scoredCandidates: {
    norm: string;
    canonicalName: string;
    count: number;
    papers: string[];
    specificity: number;
    sources: EvidenceTrace[];
  }[] = [];

  for (const [norm, entry] of candidateMap) {
    // Choose the most specific raw form as the canonical name:
    // prefer the longest form that is a valid noun phrase
    const rawTermsSorted = Array.from(entry.rawTerms).sort((a, b) => b.length - a.length);
    const canonical = rawTermsSorted[0] ?? norm;

    const { score, sources } = calculateSpecificity(canonical, papers, domainKeywords);

    if (score < MIN_SPECIFICITY) continue; // reject generic/unsupported terms

    scoredCandidates.push({
      norm,
      canonicalName: canonical,
      count: entry.count,
      papers: Array.from(entry.paperTitles).sort(),
      specificity: score,
      sources
    });
  }

  // -----------------------------------------------------------------------
  // Phase 4: Sort by specificity desc, then count desc, then name asc (deterministic)
  // -----------------------------------------------------------------------
  scoredCandidates.sort((a, b) => {
    if (b.specificity !== a.specificity) return b.specificity - a.specificity;
    if (b.count !== a.count) return b.count - a.count;
    return a.canonicalName.localeCompare(b.canonicalName);
  });

  // -----------------------------------------------------------------------
  // Phase 5: Remove subset concepts where a more specific version already exists.
  // Comparison uses normalized forms (singular) so "supply chains" is recognized
  // as a subset of "supply chain resilience", etc.
  // -----------------------------------------------------------------------
  const retained: typeof scoredCandidates = [];
  for (const candidate of scoredCandidates) {
    const candidateNorm = normalizePhrase(candidate.canonicalName);
    const isCoveredByMoreSpecific = retained.some(r => {
      const retainedNorm = normalizePhrase(r.canonicalName);
      // The retained concept is MORE specific and CONTAINS the candidate
      return (
        retainedNorm !== candidateNorm &&
        (retainedNorm.includes(candidateNorm) || r.canonicalName.includes(candidate.canonicalName))
      );
    });
    if (!isCoveredByMoreSpecific) {
      retained.push(candidate);
    }
    if (retained.length >= 6) break;
  }

  // -----------------------------------------------------------------------
  // Phase 6: Format output
  // -----------------------------------------------------------------------
  return retained.map(candidate => {
    const titleCased = candidate.canonicalName
      .split(" ")
      .map(w => {
        // Preserve acronyms (all-uppercase words like "IoT", "AI", "NLP")
        if (w.length <= 3 && w === w.toUpperCase()) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");

    return {
      name: titleCased,
      mentions: candidate.count,
      papers: candidate.papers,
      representativeTerms: Array.from(
        new Set([candidate.canonicalName, ...candidate.papers.map(p => p.toLowerCase())])
      ).sort().slice(0, 5),
      specificity: candidate.specificity,
      sources: candidate.sources.slice(0, 3) // top 3 evidence traces per concept
    };
  });
}
