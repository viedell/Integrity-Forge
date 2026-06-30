// ============================================================
// 01_classifier.ts  –  Stage 1: Domain Classification
// ============================================================
import type { PaperInput, DomainMatch } from "./types";
import { DOMAIN_RULES } from "./domain_rules";

const STOP_WORDS = new Set(["the","a","an","and","or","of","in","on","at","to","for","with","by","is","are","was","were","be","been","this","that","these","those","it","its","we","our","they","their","he","she","her","him","paper","study","research","method","results","using","used","shows","examine","present","focus","findings","conclude"]);

function tokenizeText(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function buildNgrams(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    out.push(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

/**
 * Match user-provided domain hint against a domain rule.
 * Returns true if the hint text contains the domain's displayName or any of its keywords.
 */
function hintMatchesDomain(hintLower: string, displayName: string, keywords: string[]): boolean {
  // Check if hint contains the display name (e.g., "Internet of Things" in "Smart Cities & Internet of Things (IoT)")
  if (hintLower.includes(displayName.toLowerCase())) return true;
  // Check short aliases like "IoT", "AI", etc.
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    // Only match keywords that are distinctive enough (≥3 chars or known acronyms)
    if (kwLower.length >= 3 && hintLower.includes(kwLower)) return true;
  }
  return false;
}

export function classifyDomain(papers: PaperInput[], userDomainHint?: string): DomainMatch[] {
  const fullText = papers.map(p => `${p.title} ${p.abstract}`).join(" ").toLowerCase();
  const tokens = tokenizeText(fullText);
  const unigrams = new Set(tokens);
  const bigrams = new Set(buildNgrams(tokens, 2));
  const trigrams = new Set(buildNgrams(tokens, 3));

  const hintLower = (userDomainHint || "").toLowerCase().trim();

  const scores: Array<{ domainKey: string; displayName: string; hits: number; hintMatch: boolean }> = [];

  for (const [key, rule] of Object.entries(DOMAIN_RULES.domains)) {
    let hits = 0;
    for (const kw of rule.keywords) {
      const kwLower = kw.toLowerCase();
      const kwTokens = kwLower.split(/\s+/);
      if (kwTokens.length === 1 && unigrams.has(kwLower)) hits += 2;
      else if (kwTokens.length === 2 && bigrams.has(kwLower)) hits += 3;
      else if (kwTokens.length >= 3 && trigrams.has(kwLower)) hits += 4;
      else if (fullText.includes(kwLower)) hits += 1;
    }

    const hintMatch = hintLower ? hintMatchesDomain(hintLower, rule.displayName, rule.keywords) : false;
    scores.push({ domainKey: key, displayName: rule.displayName, hits, hintMatch });
  }

  const anyHintMatch = scores.some(s => s.hintMatch);

  // Normalize to 0-100 against max
  const max = Math.max(...scores.map(s => s.hits), 1);
  let normalized: DomainMatch[] = scores
    .map(s => {
      let confidence = Math.round((s.hits / max) * 100);

      // ── User domain hint override ─────────────────────────
      // If the user explicitly named a domain, that domain is ALWAYS primary.
      // Non-matching domains are capped so they never outrank the hinted one.
      if (anyHintMatch) {
        if (s.hintMatch) {
          confidence = 100; // user's domain is always #1
        } else {
          confidence = Math.min(confidence, 80); // cap others
        }
      }

      return { domainKey: s.domainKey, displayName: s.displayName, confidence };
    })
    .filter(s => s.confidence >= 10)
    .sort((a, b) => b.confidence - a.confidence);

  return normalized.slice(0, 3); // return top-3 matching domains
}
