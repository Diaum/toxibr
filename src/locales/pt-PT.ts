// ─── Locale: Português de Portugal (pt-PT) ───────────────────────────────────
// Nota: Várias palavras são DIFERENTES do PT-BR:
//   - "puto" em PT-PT significa "rapaz/miúdo" (inocente), não é insulto
//   - "rapariga" em PT-PT significa "rapaça" (inocente), não é insulto
//   - "fixe" é gíria positiva ("fixe!" = "fixe!")
//   - "bué" é intensificador neutro ("bué fixe" = "muito fixe")
import type { LocaleData } from './index';

export const ptPTLocale: LocaleData = {

  ABBREVIATION_MAP: {
    fdp: 'filho da puta',
    mrd: 'merda',
    crlh: 'caralho',
    fds: 'foda-se',
    pnc: 'pau no cu',
    tnc: 'tomar no cu',
    stf: 'cala-te',
    xvd: 'xvideos',
    prnhb: 'pornhub',
    nfsw: 'nao e para ver no trabalho',
  },

  HARD_BLOCKED: [
    // ── Slurs / ofensas graves PT-PT ──
    'paneleiro', 'paneleiros',       // slur gay (PT-PT)
    'maricas',                        // slur gay (PT-PT)
    'mariconaz',
    'cabrao', 'cabra',               // bastardo (muito ofensivo em PT-PT)
    'filha da puta', 'filho da puta',
    'fdp',
    'puta', 'putas', 'putaria',
    'vadia', 'vadio',
    'prostituta',
    'rameira',
    'arrombado', 'arrombada',
    'retardado', 'retardada',
    'mongoloide',
    'deficiente mental',             // usado como insulto
    'aleijado',                       // usado como insulto

    // ── Conteúdo sexual explícito ──
    'cona', 'conas',                 // vulva (PT-PT, equivale a "buceta")
    'picha', 'pichas',               // pénis (PT-PT vulgar)
    'caralho',                        // pénis (PT-PT, também exclamação — em PT-PT é mais forte)
    'fodasse', 'foda-se',
    'foder', 'fodendo',
    'punheta', 'punhetas',
    'boquete',
    'mamada',
    'gozar', 'gozada',
    'anal',
    'trepada',
    'transar',
    'nude', 'nudes',
    'pelada', 'pelado',
    'pornografia',
    'pedo', 'pedofilo', 'pedofilia',
    'zoofilia', 'necrofilia',

    // ── Violência ──
    'vou-te matar', 'vou matar-te',
    'mata-te', 'vai-te matar',
    'suicida-te',

    // ── Racismo ──
    'macaco', 'macaca',
    'preto imundo', 'preta imunda',
    'negro de merda',

    // ── Sites pornográficos ──
    'pornhub', 'xvideos', 'xnxx', 'redtube', 'youporn',
    'xhamster', 'brazzers', 'onlyfans', 'fansly',
    'chaturbate', 'livejasmin',
    'cam girl',
  ],

  CONTEXT_SENSITIVE: [
    // Insultos que podem ser auto-expressão ou contexto inofensivo
    'lixo',
    'inutil',
    'burro', 'burra',
    'idiota',
    'imbecil',
    'nojento', 'nojenta',
    'fracassado', 'fracassada',
    'ridiculo', 'ridicula',
    'covarde',
    'fraco', 'fraca',
    'perdedor', 'perdedora',
    'parvo', 'parva',             // tolo — muito comum em PT-PT
    'tolo', 'tola',
    'palhaço', 'palhaca',         // clown/fool — contexto
    'estupido', 'estupida',
    'doente',
    'maluco', 'maluca',
    'escravo', 'escrava',
    'merda',                       // exclamação vs insulto dirigido
    // Ambíguas em PT-PT
    'cu',                          // comum em expressões inocentes
    'pica',
    'pau',
    'gostosa', 'gostoso',
    'delicia',
  ],

  OFFENSIVE_EMOJIS: [
    '🖕',
    '🖕🏻', '🖕🏼', '🖕🏽', '🖕🏾', '🖕🏿',
  ],

  OFFENSIVE_EMOJI_SEQUENCES: [
    '🍆💦', '🍆🍑', '🍑💦', '🍆👅', '👅💦',
    '🍑🍆', '💦🍆', '🍆😮', '🍆🤤', '🍑👋',
    '🍑🤤', '🍆🍆', '🍑🍑', '💦💦',
    '🐵🐒', '🐒🐵', '🦍🐒', '🦍🐵',
    '🍌🐒', '🍌🐵',
  ],

  CONTEXT_SENSITIVE_EMOJIS: [
    '🐵', '🐒', '🦍',
  ],

  DIRECTED_PATTERNS: [
    /\btu\b/i,
    /\bvoces?\b/i,                    // "você/vocês" → "voce/voces" after normalization
    /\bes\s+um[a]?\b/i,              // "és um" → "es um" after accent strip
    /\be\s+um[a]?\b/i,               // "é um" → "e um"
    /\bvaite\b/i,                     // "vai-te" → "vaite" after hyphen removal
    /\bcalate\b/i,                    // "cala-te" → "calate" after hyphen removal
    /\bcala\s+a?\s*boca\b/i,
    /\bsome\s+daqui\b/i,
    /\bninguem\s+te\b/i,
    /\bninguem\s+gosta\b/i,          // "ninguém" → "ninguem" after accent strip
    /\btoma\s+no\b/i,
    /\benfia\b/i,
    /\bmete\s+no\b/i,
    /\bvais\s+para\b/i,
    /\bseu\b/i,
    /\bsua\b/i,
  ],

  SELF_EXPRESSION_PATTERNS: [
    /\beu\s+(me\s+)?sinto\b/i,
    /\bsintome\b/i,                   // "sinto-me" → "sintome" after hyphen removal
    /\beu\s+sintome\b/i,
    /\beu\s+sou\b/i,
    /\bsou\s+um[a]?\b/i,
    /\bme\s+acho\b/i,
    /\beu\s+pareco\b/i,
    /\bsinto\s+que\b/i,
    // Expressões inocentes com palavras ambíguas
    /\bmerda[\s,!.]+\b/i,
    /\bque\s+merda\b/i,
    /\bpau\s+de\b/i,
    /\bcacete[\s,!.]+\b/i,
  ],
};
