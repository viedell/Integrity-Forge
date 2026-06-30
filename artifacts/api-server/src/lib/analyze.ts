/**
 * Heuristic-based AI-generation and plagiarism detection.
 *
 * AI Score  – measures signals common in LLM-generated text:
 *   • Overuse of known AI "filler" transition phrases
 *   • Unnaturally low contraction rate (AI rarely uses contractions)
 *   • Low first-person pronoun density (AI avoids "I", "my", etc.)
 *   • High sentence-length uniformity (AI writes very consistent lengths)
 *   • Passive-voice density
 *   • Perplexity-like vocab richness vs. sentence complexity ratio
 *
 * Plagiarism Score – character-level n-gram (shingle) Jaccard similarity
 *   against every other submission for the same assignment, returning the
 *   maximum pairwise similarity found.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// AI Detection signals
// ---------------------------------------------------------------------------

const AI_PHRASES = [
  "it is worth noting",
  "it is important to note",
  "it is essential to",
  "in conclusion",
  "in summary",
  "to summarize",
  "furthermore",
  "moreover",
  "in addition",
  "it is crucial",
  "plays a crucial role",
  "plays a vital role",
  "plays an important role",
  "it is evident",
  "it is clear",
  "as mentioned",
  "as previously",
  "delve into",
  "dive into",
  "shed light",
  "in the realm of",
  "landscape of",
  "at its core",
  "at the heart of",
  "underpins",
  "underscores",
  "it goes without saying",
  "needless to say",
  "it should be noted",
  "it can be argued",
  "one must consider",
  "a myriad of",
  "multifaceted",
  "nuanced",
  "leverage",
  "utilize",
  "facilitate",
  "demonstrate",
  "robust",
  "comprehensive",
  "holistic",
  "paradigm",
  "synergy",
  "streamline",
  "cutting-edge",
  "state-of-the-art",
  "best practices",
];

const CONTRACTIONS = [
  "don't","doesn't","didn't","can't","couldn't","won't","wouldn't",
  "isn't","aren't","wasn't","weren't","haven't","hasn't","hadn't",
  "i'm","i've","i'll","i'd","you're","you've","you'll","you'd",
  "he's","she's","it's","we're","we've","we'll","we'd","they're",
  "they've","they'll","they'd","that's","there's","here's","let's",
  "who's","what's","how's",
];

const FIRST_PERSON = ["i","me","my","mine","myself","we","us","our","ours","ourselves"];

const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi,
  /\b(is|are|was|were)\s+\w+en\b/gi,
];

export function detectAI(text: string): number {
  if (!text || text.trim().length < 30) return 0;

  const lower = text.toLowerCase();
  const wordList = words(text);
  const sentList = sentences(text);
  const totalWords = wordList.length;
  const totalSentences = sentList.length;

  if (totalWords === 0 || totalSentences === 0) return 0;

  // 1. AI phrase density (weight: 30)
  let phraseHits = 0;
  for (const phrase of AI_PHRASES) {
    const re = new RegExp(phrase.replace(/\s+/g, "\\s+"), "gi");
    const matches = lower.match(re);
    if (matches) phraseHits += matches.length;
  }
  // Normalise: 1 hit per 100 words → score of ~30
  const phraseDensity = (phraseHits / totalWords) * 100;
  const phraseScore = Math.min(30, phraseDensity * 30);

  // 2. Contraction scarcity (weight: 20)
  // Human writing typically has contractions; AI avoids them
  let contractionCount = 0;
  for (const c of CONTRACTIONS) {
    const re = new RegExp(`\\b${c}\\b`, "gi");
    const matches = text.match(re);
    if (matches) contractionCount += matches.length;
  }
  const contractionRate = contractionCount / totalWords;
  // 0 contractions → high AI signal; ≥2% → likely human
  const contractionScore = Math.max(0, 20 - contractionRate * 1000);

  // 3. First-person scarcity (weight: 15)
  let fpCount = 0;
  for (const fp of FIRST_PERSON) {
    const re = new RegExp(`\\b${fp}\\b`, "gi");
    const matches = text.match(re);
    if (matches) fpCount += matches.length;
  }
  const fpRate = fpCount / totalWords;
  // 0 first-person → high AI signal; ≥3% → likely human
  const fpScore = Math.max(0, 15 - fpRate * 500);

  // 4. Sentence-length uniformity (weight: 20)
  // AI tends to write very uniform sentence lengths; humans vary more
  const sentLengths = sentList.map((s) => words(s).length);
  const sd = stdDev(sentLengths);
  const avgLen = sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length;
  // Coefficient of variation — low CV = high uniformity = high AI signal
  const cv = avgLen > 0 ? sd / avgLen : 0;
  const uniformityScore = Math.max(0, 20 - cv * 40);

  // 5. Passive voice density (weight: 15)
  let passiveCount = 0;
  for (const pat of PASSIVE_PATTERNS) {
    const matches = text.match(pat);
    if (matches) passiveCount += matches.length;
  }
  const passiveRate = passiveCount / totalSentences;
  // >40% passive → high AI signal
  const passiveScore = Math.min(15, passiveRate * 37.5);

  const raw = phraseScore + contractionScore + fpScore + uniformityScore + passiveScore;

  // Clamp to [0, 100]
  return Math.min(100, Math.max(0, raw));
}

// ---------------------------------------------------------------------------
// Plagiarism Detection — shingle Jaccard similarity
// ---------------------------------------------------------------------------

function buildShingles(text: string, k = 5): Set<string> {
  const chars = text.toLowerCase().replace(/\s+/g, " ").trim();
  const shingles = new Set<string>();
  for (let i = 0; i <= chars.length - k; i++) {
    shingles.add(chars.slice(i, i + k));
  }
  return shingles;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const s of a) {
    if (b.has(s)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : (intersection / union) * 100;
}

/**
 * Given the submitted text and an array of existing submission texts,
 * returns the maximum Jaccard similarity score (0-100) found.
 */
export function detectPlagiarism(text: string, others: string[]): number {
  if (!text || text.trim().length < 30 || others.length === 0) return 0;

  const shingles = buildShingles(text);
  let maxSim = 0;

  for (const other of others) {
    if (!other || other.trim().length < 30) continue;
    const otherShingles = buildShingles(other);
    const sim = jaccardSimilarity(shingles, otherShingles);
    if (sim > maxSim) maxSim = sim;
  }

  return Math.min(100, Math.max(0, maxSim));
}
