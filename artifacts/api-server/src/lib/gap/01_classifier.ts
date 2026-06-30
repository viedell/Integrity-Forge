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

export function classifyDomain(papers: PaperInput[]): DomainMatch[] {
  const fullText = papers.map(p => `${p.title} ${p.abstract}`).join(" ").toLowerCase();
  const tokens = tokenizeText(fullText);
  const unigrams = new Set(tokens);
  const bigrams = new Set(buildNgrams(tokens, 2));
  const trigrams = new Set(buildNgrams(tokens, 3));

  const scores: DomainMatch[] = [];

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
    scores.push({ domainKey: key, displayName: rule.displayName, confidence: hits });
  }

  // Normalize to 0-100 against max
  const max = Math.max(...scores.map(s => s.confidence), 1);
  const normalized = scores
    .map(s => ({ ...s, confidence: Math.round((s.confidence / max) * 100) }))
    .filter(s => s.confidence >= 10)
    .sort((a, b) => b.confidence - a.confidence);

  return normalized.slice(0, 3); // return top-3 matching domains
}
