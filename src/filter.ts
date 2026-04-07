// ─── ToxiBR — Content Filter for Brazilian Portuguese ────────────────────────
// Pure synchronous string ops — no I/O, < 1ms for 2000 chars.

import {
  ABBREVIATION_MAP,
  HARD_BLOCKED,
  CONTEXT_SENSITIVE,
  DIRECTED_PATTERNS,
  SELF_EXPRESSION_PATTERNS,
  SEXUAL_SEED_WORDS,
  OFFENSIVE_EMOJIS,
  OFFENSIVE_EMOJI_SEQUENCES,
  CONTEXT_SENSITIVE_EMOJIS,
} from './wordlists';
import type { FilterResult, CensorResult, ToxiBROptions, FilterReason, Severity } from './types';

// ─── Homoglyph map (Cyrillic → Latin) ────────────────────────────────────────

const HOMOGLYPHS: Record<string, string> = {
  '\u0430': 'a',
  '\u0435': 'e',
  '\u043E': 'o',
  '\u0440': 'p',
  '\u0441': 'c',
  '\u0443': 'y',
  '\u0456': 'i',
  '\u0445': 'x',
  '\u043D': 'h',
  '\u0442': 't',
  '\u043C': 'm',
  '\u043A': 'k',
};

// ─── Leetspeak map ───────────────────────────────────────────────────────────

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
};

// ─── Normalize text for comparison ───────────────────────────────────────────

export function normalize(input: string): string {
  let t = input;

  // 1. Remove zero-width and invisible chars
  t = t.replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u2064\u180E\uFEFF\u00AD\uFFF9-\uFFFB]/g, '');

  // 2. NFC normalize
  t = t.normalize('NFC');

  // 3. Replace homoglyphs
  t = [...t].map((c) => HOMOGLYPHS[c] ?? c).join('');

  // 4. Lowercase
  t = t.toLowerCase();

  // 5. Strip accents and combining marks
  t = t.normalize('NFD').replace(/[\u0300-\u036f\u0489]/g, '');

  // 6. Collapse repeated chars (2+ → 1)
  t = t.replace(/(.)\1+/g, '$1');

  // 7. Leetspeak
  t = [...t].map((c) => LEET[c] ?? c).join('');

  // 8. Remove censoring characters (* #) between letters
  t = t.replace(/[*#]+/g, '');

  // 8b. Remove dots/dashes between single chars (p.u.t.a → puta)
  t = t.replace(/(\w)[.\-](?=\w[.\-])/g, '$1');
  t = t.replace(/(\w)[.\-](\w)/g, '$1$2');

  // 9. Remove spaces between isolated single chars (p u t a → puta)
  t = t.replace(/\b(\w)\s(\w)\s(\w)/g, (_, a, b, c) => a + b + c);

  // 10. Expand known abbreviations (strip punctuation from each word before lookup)
  const words = t.split(/\s+/);
  t = words
    .map((w) => {
      const clean = w.replace(/[^a-z0-9çã]/g, '');
      return ABBREVIATION_MAP[clean] ?? w;
    })
    .join(' ');

  // 11. Re-clean after abbreviation expansion (expansions may contain dashes/spaces)
  t = t.replace(/[.\-]/g, ' ').replace(/\s+/g, ' ').trim();

  return t;
}

// ─── Levenshtein distance ───────────────────────────────────────────────────

function levenshtein(a: string, b: string, maxDist: number): number {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > maxDist) return maxDist + 1;

  // Single-row DP with early termination
  let prev = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    const curr = new Array(lb + 1);
    curr[0] = i;
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    // If the minimum value in this row already exceeds maxDist, bail early
    if (rowMin > maxDist) return maxDist + 1;
    prev = curr;
  }

  return prev[lb];
}

function getFuzzyThreshold(wordLength: number): number {
  if (wordLength <= 4) return 0; // disabled for short words
  if (wordLength <= 7) return 1;
  return 2;
}

// Common innocent words that fuzzy matching incorrectly flags
const FUZZY_ALLOWLIST = new Set([
  'parada',
  'parado',
  'paradas',
  'parados',
  'batedor',
  'batedores',
  'punho',
  'punhal',
  'punhado',
  'tocada',
  'tocado',
  'primeira',
  'primeiro',
  'primeiras',
  'primeiros',
  'merda',
  'bosta',
  'porra',
  'plsos', // typo de pulsos
  'chorando',
  'chorado', // fuzzy matches chupando
  'conteudo',
  'cotneudo', // fuzzy matches cornudo
  'estourar',
  'estourou',
  'estouro', // fuzzy matches estuprar
  'jogou',
  'jogos',
  'jogo', // fuzzy matches jorrou
  'mamae',
  'mamada', // mamae gets fuzzy-matched to mamada incorrectly
]);

// ─── Escape regex special chars ──────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Build regex list from words ─────────────────────────────────────────────

function buildRegexes(words: string[]): { word: string; regex: RegExp }[] {
  return words.map((word) => {
    const n = normalize(word);
    const pattern = n.includes(' ') ? escapeRegex(n) : `\\b${escapeRegex(n)}\\b`;
    return { word, regex: new RegExp(pattern) };
  });
}

// ─── Phone number regex (Brazilian formats) ──────────────────────────────────

const PHONE_REGEX = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[\s.-]?\d{4}/;
const PHONE_REGEX_G = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[\s.-]?\d{4}/g;
const LINK_REGEX = /https?:\/\/|www\.|\.com|\.net|\.org|\.br|\.io|\.me|\.tv|\.co|\.link|\.xyz/i;
const LINK_REPLACE_REGEX =
  /(?:https?:\/\/\S+|www\.\S+|\S+\.(?:com|net|org|br|io|me|tv|co|link|xyz)\S*)/gi;

// ─── Create filter instance ──────────────────────────────────────────────────

export function createFilter(options: ToxiBROptions = {}) {
  const {
    extraBlockedWords = [],
    extraContextWords = [],
    blockLinks = true,
    blockPhones = true,
    blockDigitsOnly = true,
    blockEmojis = true,
    severity: severityConfig = {},
  } = options;

  function getSeverity(reason: FilterReason): Severity {
    return severityConfig[reason] ?? 'block';
  }

  function makeResult(reason: FilterReason, matched: string): FilterResult {
    return { allowed: false, reason, matched, severity: getSeverity(reason) };
  }

  const allBlocked = [...HARD_BLOCKED, ...extraBlockedWords];
  const allContext = [...CONTEXT_SENSITIVE, ...extraContextWords];

  const hardBlockedRegexes = buildRegexes(allBlocked);
  const contextSensitiveRegexes = buildRegexes(allContext);

  // Pre-normalized wordlist for fuzzy matching, bucketed by length (deduplicated)
  const fuzzyByLength = new Map<number, string[]>();
  const seenFuzzy = new Set<string>();
  // Pre-normalized single words for prefix matching (min 5 chars)
  const prefixWords: string[] = [];
  for (const w of allBlocked) {
    const n = normalize(w);
    if (n.includes(' ')) continue;
    if (n.length >= 5 && !seenFuzzy.has(n)) {
      seenFuzzy.add(n);
      const len = n.length;
      if (!fuzzyByLength.has(len)) fuzzyByLength.set(len, []);
      fuzzyByLength.get(len)!.push(n);
    }
    if (n.length >= 5) prefixWords.push(n);
  }

  return function filterContent(text: string): FilterResult {
    const normalized = normalize(text);

    // Layer 0: Censorship bypass detection — words with * or # between letters
    if (/\w[*#]+\w/.test(text)) {
      return makeResult('hard_block', 'censorship bypass');
    }

    // Layer 0z: Pre-normalization exact matches (terms that break after leetspeak/normalization)
    if (/\bd4\b/i.test(text)) {
      return makeResult('hard_block', 'd4');
    }
    if (/\d+\s*cm\b/i.test(text)) {
      return makeResult('hard_block', 'medida cm');
    }
    if (/\b-18\b/.test(text)) {
      return makeResult('hard_block', '-18');
    }

    // Layer 0a: Block links/URLs
    if (blockLinks && LINK_REGEX.test(text)) {
      return makeResult('link', 'link');
    }

    // Layer 0b: Block phone numbers
    if (blockPhones) {
      if (PHONE_REGEX.test(text)) {
        return makeResult('phone', 'telefone');
      }
      const totalDigits = text.replace(/\D/g, '').length;
      if (totalDigits >= 5) {
        return makeResult('phone', 'telefone');
      }
    }

    // Layer 0c: Block messages that are only digits
    if (blockDigitsOnly && /^\d+$/.test(text.trim())) {
      return makeResult('digits_only', 'numero isolado');
    }

    // Layer 0d: Offensive emojis (checked on raw text — normalization strips emojis)
    if (blockEmojis) {
      // Strip zero-width joiners and variation selectors for comparison
      const emojiText = text.replace(/[\uFE00-\uFE0F\u200D]/g, '');

      // Always-blocked emojis
      for (const emoji of OFFENSIVE_EMOJIS) {
        if (emojiText.includes(emoji)) {
          return makeResult('offensive_emoji', emoji);
        }
      }

      // Always-blocked sequences
      for (const seq of OFFENSIVE_EMOJI_SEQUENCES) {
        if (emojiText.includes(seq)) {
          return makeResult('offensive_emoji', seq);
        }
      }

      // Context-sensitive emojis (only block when directed at someone)
      for (const emoji of CONTEXT_SENSITIVE_EMOJIS) {
        if (!emojiText.includes(emoji)) continue;
        if (DIRECTED_PATTERNS.some((p) => p.test(normalized))) {
          return makeResult('offensive_emoji', emoji);
        }
      }
    }

    // Layer 1: Hard-blocked words
    for (const { word, regex } of hardBlockedRegexes) {
      if (regex.test(normalized)) {
        return makeResult('hard_block', word);
      }
    }

    // Layer 1b: Fuzzy match (Levenshtein) — fallback for typo variants
    {
      const messageWords = new Set(normalized.split(/\s+/));
      for (const msgWord of messageWords) {
        const threshold = getFuzzyThreshold(msgWord.length);
        if (threshold === 0 || FUZZY_ALLOWLIST.has(msgWord)) continue;
        // Only check blocked words whose length is within threshold range
        for (let len = msgWord.length - threshold; len <= msgWord.length + threshold; len++) {
          const candidates = fuzzyByLength.get(len);
          if (!candidates) continue;
          for (const blocked of candidates) {
            const dist = levenshtein(msgWord, blocked, threshold);
            if (dist > 0 && dist <= threshold) {
              return makeResult('fuzzy_match', blocked);
            }
          }
        }
      }
    }

    // Layer 1c: Prefix match — catches truncated words (e.g. "estup" → "estupro")
    {
      const messageWords = normalized.split(/\s+/);
      for (const msgWord of messageWords) {
        // Word must be at least 4 chars and cover at least 70% of a blocked word
        if (msgWord.length < 4) continue;
        for (const blocked of prefixWords) {
          if (blocked.length < msgWord.length) continue;
          if (blocked.startsWith(msgWord) && msgWord.length >= blocked.length * 0.55) {
            return makeResult('hard_block', blocked);
          }
        }
      }
    }

    // Layer 2: Context-sensitive words
    // Check proximity: directed pattern must be within ~8 words of the sensitive word
    const normalizedWords = normalized.split(/\s+/);

    for (const { word, regex } of contextSensitiveRegexes) {
      if (!regex.test(normalized)) continue;

      // Find position(s) of the context-sensitive word in the message
      const normalizedWord = normalize(word);
      const wordPositions: number[] = [];
      for (let i = 0; i < normalizedWords.length; i++) {
        if (normalizedWords[i] === normalizedWord) wordPositions.push(i);
      }

      if (wordPositions.length === 0) {
        // Multi-word match — fall back to checking nearby text
        const matchIdx = normalized.indexOf(normalizedWord);
        if (matchIdx >= 0) {
          const before = normalized.substring(0, matchIdx).split(/\s+/).length - 1;
          wordPositions.push(before);
        }
      }

      // Check each occurrence independently — use proximity to decide
      for (const pos of wordPositions) {
        // Check progressively closer windows: whoever is closest wins
        let closestDirected = Infinity;
        let closestSelfExpr = Infinity;

        // Find closest directed pattern
        for (let radius = 1; radius <= 5; radius++) {
          const ws = Math.max(0, pos - radius);
          const we = Math.min(normalizedWords.length, pos + radius + 1);
          const w = normalizedWords.slice(ws, we).join(' ');
          if (closestDirected === Infinity && DIRECTED_PATTERNS.some((p) => p.test(w))) {
            closestDirected = radius;
          }
          if (closestSelfExpr === Infinity && SELF_EXPRESSION_PATTERNS.some((p) => p.test(w))) {
            closestSelfExpr = radius;
          }
          if (closestDirected < Infinity && closestSelfExpr < Infinity) break;
        }

        // Directed is closer (or equal) than self-expression → block
        if (closestDirected < Infinity && closestDirected <= closestSelfExpr) {
          return makeResult('directed_insult', word);
        }
      }

      // All occurrences are self-expression or ambiguous → allow
    }

    // Layer 3: Sexual seed word density — if 3+ sexual seed words appear
    // in a sliding window of 10 words, the content is suspicious
    {
      const seedSet = new Set(SEXUAL_SEED_WORDS);
      const words = normalized.split(/\s+/);
      const windowSize = 10;

      for (let i = 0; i <= words.length - windowSize; i++) {
        const window = words.slice(i, i + windowSize);
        const seedMatches = window.filter((w) => seedSet.has(w));
        if (seedMatches.length >= 3) {
          return makeResult('suspicious_content', seedMatches.join(', '));
        }
      }

      // Also check shorter messages (< windowSize words)
      if (words.length < windowSize && words.length >= 3) {
        const seedMatches = words.filter((w) => seedSet.has(w));
        if (seedMatches.length >= 3) {
          return makeResult('suspicious_content', seedMatches.join(', '));
        }
      }
    }

    return { allowed: true };
  };
}

// ─── Censor function ────────────────────────────────────────────────────────

export function createCensor(options: ToxiBROptions = {}) {
  const filter = createFilter(options);
  const char = options.censorChar ?? '*';
  const censorPhones = options.censorPhones ?? false;
  const censorLinks = options.censorLinks ?? false;

  return function censorContent(text: string): CensorResult {
    let workingText = text;
    const matches: CensorResult['matches'] = [];

    // Step 1: Censor phones inline (replace with ***) if enabled
    if (censorPhones && PHONE_REGEX.test(workingText)) {
      workingText = workingText.replace(PHONE_REGEX_G, (m) => {
        matches.push({ word: m, reason: 'phone', matched: 'telefone' });
        return char.repeat(m.length);
      });
    }

    // Step 2: Censor links inline if enabled
    if (censorLinks && LINK_REGEX.test(text)) {
      workingText = workingText.replace(LINK_REPLACE_REGEX, (m) => {
        matches.push({ word: m, reason: 'link', matched: 'link' });
        return char.repeat(m.length);
      });
    }

    // Step 3: Check full message for non-word-level blocks (if not censoring inline)
    if (!censorPhones || !censorLinks) {
      const fullResult = filter(workingText);
      if (!fullResult.allowed && ['link', 'phone', 'digits_only'].includes(fullResult.reason)) {
        return {
          censored: char.repeat(text.length),
          hasToxicContent: true,
          matches: [{ word: text, reason: fullResult.reason, matched: fullResult.matched }],
        };
      }
    }

    // Step 4: Censor toxic words
    const words = workingText.split(/(\s+)/);
    const censored: string[] = [];

    // Scan multi-word phrases first (n-grams: 2, 3, 4)
    const phraseBlocked = new Set<number>();

    const nonSpaceIndices: number[] = [];
    words.forEach((w, i) => {
      if (w.trim()) nonSpaceIndices.push(i);
    });

    for (let n = 2; n <= 4; n++) {
      for (let si = 0; si <= nonSpaceIndices.length - n; si++) {
        const indices = nonSpaceIndices.slice(si, si + n);
        if (indices.some((idx) => phraseBlocked.has(idx))) continue;
        const phrase = indices.map((idx) => words[idx]).join(' ');
        const res = filter(phrase);
        if (!res.allowed && res.matched && res.matched.split(/\s+/).length >= 2) {
          for (const idx of indices) {
            phraseBlocked.add(idx);
          }
          matches.push({ word: phrase, reason: res.reason, matched: res.matched });
        }
      }
    }

    for (let i = 0; i < words.length; i++) {
      const token = words[i];

      if (!token.trim()) {
        censored.push(token);
        continue;
      }

      if (phraseBlocked.has(i)) {
        censored.push(char.repeat(token.length));
        continue;
      }

      const res = filter(token);
      if (!res.allowed && !['digits_only', 'phone', 'link'].includes(res.reason)) {
        censored.push(char.repeat(token.length));
        matches.push({ word: token, reason: res.reason, matched: res.matched });
      } else {
        censored.push(token);
      }
    }

    return {
      censored: censored.join(''),
      hasToxicContent: matches.length > 0,
      matches,
    };
  };
}

export const censorContent = createCensor();

// ─── Default filter (zero config) ────────────────────────────────────────────

export const filterContent = createFilter();
