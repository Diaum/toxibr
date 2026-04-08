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
import type {
  FilterResult,
  FilterStats,
  CensorResult,
  ToxiBROptions,
  FilterReason,
  Severity,
} from './types';

// ─── Homoglyph map (Cyrillic + Latin Extended → ASCII) ───────────────────────

const HOMOGLYPHS: Record<string, string> = {
  // Cyrillic → Latin
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

  // Latin Extended — non-decomposable letter forms used in bypass attempts
  // Latin Extended-A (U+0100–U+017F)
  '\u0110': 'd',
  '\u0111': 'd', // Đ đ (D with stroke)
  '\u0126': 'h',
  '\u0127': 'h', // Ħ ħ (H with stroke)
  '\u0131': 'i', // ı (dotless i)
  '\u0138': 'k', // ĸ (kra)
  '\u0141': 'l',
  '\u0142': 'l', // Ł ł (L with stroke)
  '\u014A': 'n',
  '\u014B': 'n', // Ŋ ŋ (eng)
  '\u0152': 'oe',
  '\u0153': 'oe', // Œ œ (ligature)
  '\u0166': 't',
  '\u0167': 't', // Ŧ ŧ (T with stroke)

  // Latin Extended-B (U+0180–U+024F)
  '\u0180': 'b', // ƀ (b with stroke)
  '\u0183': 'b',
  '\u0182': 'b', // ƃ Ƃ (b with topbar)
  '\u0188': 'c',
  '\u0187': 'c', // ƈ Ƈ (c with hook)
  '\u0189': 'd',
  '\u018A': 'd', // Ɖ Ɗ (African D)
  '\u0191': 'f',
  '\u0192': 'f', // Ƒ ƒ (f with hook)
  '\u0193': 'g', // Ɠ (G with hook)
  '\u0197': 'i', // Ɨ (I with stroke)
  '\u0198': 'k',
  '\u0199': 'k', // Ƙ ƙ (k with hook)
  '\u019A': 'l', // ƚ (l with bar)
  '\u019D': 'n', // Ɲ (N with left hook)
  '\u019E': 'n', // ƞ (n with long right leg)
  '\u01A4': 'p',
  '\u01A5': 'p', // Ƥ ƥ (p with hook)
  '\u01AB': 't', // ƫ (t with palatal hook)
  '\u01AD': 't',
  '\u01AC': 't', // ƭ Ƭ (t with hook)
  '\u01B2': 'v', // Ʋ (V with hook)
  '\u01B3': 'y',
  '\u01B4': 'y', // Ƴ ƴ (y with hook)
  '\u01B5': 'z',
  '\u01B6': 'z', // Ƶ ƶ (z with stroke)
  '\u01C2': '!', // ǂ (alveolar click — used as ! substitute)
  '\u0221': 'd', // ȡ (d with curl)
  '\u0225': 'z', // ȥ (z with hook)
  '\u0234': 'l', // ȴ (l with curl)
  '\u0235': 'n', // ȵ (n with curl)
  '\u0236': 't', // ȶ (t with curl)

  // IPA / Latin Extended-B letter forms commonly abused
  '\u0251': 'a', // ɑ (Latin alpha)
  '\u0252': 'a', // ɒ (turned alpha)
  '\u0253': 'b', // ɓ (b with hook)
  '\u0254': 'o', // ɔ (open o)
  '\u0256': 'd',
  '\u0257': 'd', // ɖ ɗ (d with tail/hook)
  '\u025B': 'e', // ɛ (open e)
  '\u0261': 'g', // ɡ (script g)
  '\u0262': 'g', // ɢ (small capital G)
  '\u0265': 'h', // ɥ (turned h)
  '\u0268': 'i', // ɨ (i with stroke)
  '\u026A': 'i', // ɪ (small capital I)
  '\u026B': 'l',
  '\u026C': 'l',
  '\u026D': 'l', // ɫ ɬ ɭ
  '\u0271': 'm', // ɱ (m with hook)
  '\u0272': 'n',
  '\u0273': 'n', // ɲ ɳ (n variants)
  '\u0275': 'o', // ɵ (barred o)
  '\u027C': 'r',
  '\u027D': 'r',
  '\u027E': 'r', // ɼ ɽ ɾ
  '\u0280': 'r', // ʀ (small capital R)
  '\u0282': 's', // ʂ (s with hook)
  '\u0284': 'j', // ʄ (dotless j with stroke and hook)
  '\u0287': 't', // ʇ (turned t)
  '\u0288': 't', // ʈ (t with retroflex hook)
  '\u028B': 'v', // ʋ (v with hook)
  '\u028F': 'y', // ʏ (small capital Y)
  '\u0290': 'z',
  '\u0291': 'z', // ʐ ʑ (z variants)
  '\u0299': 'b', // ʙ (small capital B)
  '\u029B': 'g', // ʛ (small capital G with hook)
  '\u029C': 'h', // ʜ (small capital H)
  '\u029F': 'l', // ʟ (small capital L)
  '\u02A0': 'q', // ʠ (q with hook)

  // Currency & typographic symbols abused as letter substitutes
  '\u20AC': 'e', // € (euro sign → e)
  '\u00A3': 'l', // £ (pound sign → l)
  '\u00A2': 'c', // ¢ (cent sign → c)
  '\u00A5': 'y', // ¥ (yen sign → y)

  // Superscript digits → ASCII digits (leetspeak will then convert them)
  '\u00B2': '2', // ² → 2
  '\u00B3': '3', // ³ → 3
  '\u00B9': '1', // ¹ → 1
  '\u2070': '0', // ⁰ → 0
  '\u2074': '4', // ⁴ → 4
  '\u2075': '5', // ⁵ → 5
  '\u2076': '6', // ⁶ → 6
  '\u2077': '7', // ⁷ → 7
  '\u2078': '8', // ⁸ → 8
  '\u2079': '9', // ⁹ → 9
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
  // 8c. Convert ! used as bypass for 'i' — only when directly between word chars
  //     Handles "cuz!nh0" → "cuzinho". Trailing/leading ! (e.g. "valeu!") is untouched.
  t = t.replace(/(\w)!+(\w)/g, (_, a, b) => a + 'i' + b);

  // 8b. Remove dots/dashes between single chars (p.u.t.a → puta)
  t = t.replace(/(\w)[.\-](?=\w[.\-])/g, '$1');
  t = t.replace(/(\w)[.\-](\w)/g, '$1$2');

  // 9. Remove spaces between isolated single chars (p u t a → puta)

  const blocklist = new Set([...HARD_BLOCKED]);

  t = t.replace(/\b(?:[a-z]\s*){3,}\b/gi, (match) => {
  const normalizada = match.replace(/\s+/g, "").toLowerCase();

    if (blocklist.has(normalizada)) {
      return normalizada; // ou "***", ou bloquear como quiser
    }

    return match;
  });

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
  'jogo',
  'jogar', // fuzzy matches jorar (jorrar collapsed)
  'cama', // prefix matches cam4
  'video',
  'videos', // fuzzy matches xvideos
  'mamae',
  'mamada', // mamae gets fuzzy-matched to mamada incorrectly
  // Common words that fuzzy-match sexual/offensive terms
  'certinho',
  'certinha', // → peitinho
  'chamando', // → chupando
  'camilo', // → mamilo
  'corpo', // → corno
  'corpos', // → cornos
  'pela',
  'pelas', // → pelada
  'sapato',
  'sapatos', // → sapata
  'mensagem',
  'mensagens', // → menage
  'torno', // → corno
  'ponta',
  'pontas', // → phnta
  'bloqueie', // → boquete
  'roda', // prefix matches rodada
  // Brazilian proper names — fuzzy false positives
  'patricia', // → pitrica (dist 2)
  'adriano', // → ariano (dist 1)
  'ariane',  // → ariano (dist 1)
  'nadia',   // → vadia  (dist 1)
  'nunes',   // → nudes  (dist 1)
  'porto',   // → porno  (dist 1)
]);

// ─── PT-BR Stemmer (RSLP simplificado) ──────────────────────────────────────

// Suffixes ordered longest-first so greedy match works correctly.
// Each group: verbal conjugation, then nominal.
const STEM_SUFFIXES = [
  // Verbal — gerund
  'ando',
  'endo',
  'indo',
  // Verbal — past / conditional / subjunctive (longer first)
  'ariam',
  'eriam',
  'iriam',
  'aram',
  'eram',
  'iram',
  'avam',
  'iam',
  'aria',
  'eria',
  'iria',
  'asse',
  'esse',
  'isse',
  'ase',
  'ese',
  'ise', // normalized forms (ss → s after char collapse)
  'aram',
  'eram',
  'iram',
  'aram',
  // Verbal — simple past / present
  'ou',
  'ei',
  'eu',
  'ar',
  'er',
  'ir',
  // Nominal — augmentative / diminutive / agent
  'inho',
  'inha',
  'inhos',
  'inhas',
  'eiro',
  'eira',
  'eiros',
  'eiras',
  'udo',
  'uda',
  'udos',
  'udas',
  'oso',
  'osa',
  'osos',
  'osas',
  'ado',
  'ada',
  'ados',
  'adas',
  'ido',
  'ida',
  'idos',
  'idas',
  'ona',
  'onas',
  'ao',
  'oes',
];

/** Minimum stem length — stems shorter than this are not produced. */
const MIN_STEM_LEN = 3;

/**
 * Lightweight PT-BR stemmer: strips the first matching suffix and returns the
 * radical. Returns the original word when no suffix matches or the stem would
 * be shorter than MIN_STEM_LEN.
 */
export function stem(word: string): string {
  for (const suf of STEM_SUFFIXES) {
    if (word.length > suf.length + MIN_STEM_LEN - 1 && word.endsWith(suf)) {
      return word.slice(0, -suf.length);
    }
  }
  return word;
}

/**
 * Stems that are known false-positives — innocent words whose stem collides
 * with a blocked word's stem. Checked against the *message word's* stem.
 */
const STEM_ALLOWLIST = new Set([
  // "computador/computar" → stem "comput" — innocent
  'comput',
  // "método/meter" collision
  'met',
  // "comunidade/comer" collision
  'com',
  // "estourar/estouro" — stem "estour"
  'estour',
  // "jogou/jogar" — innocent gaming context (already context-sensitive)
  'jog',
  // "chorando/chorado" — innocent
  'chor',
  // "mamãe" — stem "mam"
  'mam',
  // "batedor/bater" — stem "bat"
  'bat',
  // "tocada/tocar" — stem "toc"
  'toc',
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

export interface ToxiBRFilter {
  (text: string): FilterResult;
  getStats: () => FilterStats;
  resetStats: () => void;
  exportStats: () => string;
}

export function createFilter(options: ToxiBROptions = {}): ToxiBRFilter {
  const {
    extraBlockedWords = [],
    extraContextWords = [],
    blockLinks = true,
    blockPhones = true,
    blockDigitsOnly = true,
    blockEmojis = true,
    severity: severityConfig = {},
    onBlock,
    trackStats = false,
  } = options;

  // ─── Stats state (only allocated when trackStats is true) ───────────────
  let statsTotal = 0;
  let statsAllowed = 0;
  let statsBlocked = 0;
  let statsByReason: Partial<Record<FilterReason, number>> = {};
  let statsMatchedCounts: Record<string, number> = {};
  let statsTotalTimeMs = 0;

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

  // Pre-compute blocked stems (single words only, stem length >= MIN_STEM_LEN)
  const blockedStems = new Set<string>();
  for (const w of allBlocked) {
    const n = normalize(w);
    if (n.includes(' ')) continue;
    const s = stem(n);
    if (s.length >= MIN_STEM_LEN) blockedStems.add(s);
  }

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

  function filterContent(text: string): FilterResult {
    const start = trackStats ? performance.now() : 0;
    const result = _filter(text);

    if (trackStats) {
      const elapsed = performance.now() - start;
      statsTotal++;
      statsTotalTimeMs += elapsed;
      if (result.allowed) {
        statsAllowed++;
      } else {
        statsBlocked++;
        statsByReason[result.reason] = (statsByReason[result.reason] ?? 0) + 1;
        statsMatchedCounts[result.matched] = (statsMatchedCounts[result.matched] ?? 0) + 1;
      }
    }

    if (!result.allowed && onBlock) {
      onBlock(result);
    }

    return result;
  }

  filterContent.getStats = (): FilterStats => {
    const topMatched = Object.entries(statsMatchedCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: statsTotal,
      allowed: statsAllowed,
      blocked: statsBlocked,
      byReason: { ...statsByReason },
      topMatched,
      avgTimeMs: statsTotal > 0 ? statsTotalTimeMs / statsTotal : 0,
    };
  };

  filterContent.resetStats = (): void => {
    statsTotal = 0;
    statsAllowed = 0;
    statsBlocked = 0;
    statsByReason = {};
    statsMatchedCounts = {};
    statsTotalTimeMs = 0;
  };

  filterContent.exportStats = (): string => {
    return JSON.stringify(filterContent.getStats());
  };

  return filterContent;

  function _filter(text: string): FilterResult {
    const normalized = normalize(text);

    // Layer 0: Censorship bypass detection
    // * or # between any two letters (p*ta, v#ado)
    // @ between letters as bypass separator (g@z0, t@r@d0) — distinct from the
    //   LEET map that converts @ → a for leet-style writes like t@r4d0.
    // Non-leet digits 2,6,8,9 used as separators — require ≥2 letters on at
    //   least one side so that technical terms like b2b / ps5 / 2x1 are allowed.
    // Emojis used as separators within a word (v🍑ado) — same ≥2-letter rule.
    const _emojiSepRe =
      /[a-zA-Z]{2,}\p{Extended_Pictographic}[a-zA-Z]|[a-zA-Z]\p{Extended_Pictographic}[a-zA-Z]{2,}/u;
    if (
      /[a-zA-Z][*#@]+[a-zA-Z]/.test(text) ||
      /[a-zA-Z]{2,}[2689]+[a-zA-Z]|[a-zA-Z][2689]+[a-zA-Z]{2,}/.test(text) ||
      _emojiSepRe.test(text)
    ) {
      return makeResult('hard_block', 'censorship bypass');
    }

    // Layer 0e: Words with 3+ digits mixed with letters — obfuscation bypass
    // (e.g. v14d0, p0rn0gr4f14, c4r4lh0). Pure digit sequences and known
    // technical patterns (like "h2o2", short codes) are excluded.
    {
      const words = text.split(/\s+/);
      for (const w of words) {
        // Must contain at least one letter and at least 3 digits
        if (!/[a-zA-Z]/.test(w)) continue;
        const digitCount = (w.match(/\d/g) || []).length;
        if (digitCount >= 3) {
          return makeResult('hard_block', 'censorship bypass');
        }
      }
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
    if (/\bcam4\b/i.test(text)) {
      return makeResult('hard_block', 'cam4');
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

    // Layer 1a: Stem match — catches verb conjugations automatically
    {
      const messageWords = normalized.split(/\s+/);
      for (const msgWord of messageWords) {
        if (msgWord.length < 4) continue;
        const wordStem = stem(msgWord);
        if (
          wordStem.length >= MIN_STEM_LEN &&
          !STEM_ALLOWLIST.has(wordStem) &&
          blockedStems.has(wordStem)
        ) {
          return makeResult('stem_match', msgWord);
        }
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
        if (msgWord.length < 4 || FUZZY_ALLOWLIST.has(msgWord)) continue;
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
  }
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

// ─── Batch filtering ─────────────────────────────────────────────────────────

export function createFilterBatch(options: ToxiBROptions = {}) {
  const filter = createFilter(options);
  return (messages: string[]): FilterResult[] => messages.map(filter);
}

export const filterBatch = createFilterBatch();

// ─── Default filter (zero config) ────────────────────────────────────────────

export const filterContent = createFilter();
