// ─── Locale: Español Genérico (es) ───────────────────────────────────────────
// Cubre vocabulario del español estándar. Las variantes regionales
// (MX, AR, CO…) pueden añadirse como locales adicionales en el futuro.
//
// Nota sobre falsos positivos:
//   - "coño", "joder", "mierda", "hostia" son exclamaciones MUY comunes
//     en España → se tratan como CONTEXT_SENSITIVE, no hard-blocked.
//   - "puta" es intensificador frecuente en LatAm → context-sensitive.
//   - "coger" significa "tomar/agarrar" en España pero tiene connotación
//     sexual en LatAm → context-sensitive.
import type { LocaleData } from './index';

export const esLocale: LocaleData = {

  ABBREVIATION_MAP: {
    hdp: 'hijo de puta',
    ptm: 'puta madre',
    csm: 'concha su madre',
    ctm: 'concha tu madre',
    mrd: 'mierda',
    cjt: 'cajeta',            // vulva (MX)
    pnc: 'pene en el culo',
    fds: 'fodase',
    vrg: 'verga',
    chng: 'chinga',
    chngd: 'chingada',
  },

  HARD_BLOCKED: [
    // ── Slurs / insultos graves ──
    'gilipollas', 'gilipolla',        // idiot (ES) — siempre insulto
    'maricon', 'maricones',           // slur gay
    'mariconaz',
    'bollera', 'bolleras',            // slur lésbica (ES)
    'tortillera', 'tortilleras',      // slur lésbica (ES)
    'mongolo', 'mongola',             // slur discapacidad
    'subnormal', 'subnormales',       // slur discapacidad
    'mamon', 'mamona',                // jerk / mama (sexual)
    'pendejo', 'pendeja',             // idiot/coward (LatAm)
    'wey', 'guey',                    // en contextos insultantes; se trata en Layer 2
    'puto',                            // slur gay / male prostitute (NO confundir con PT-PT)
    'hijo de puta', 'hija de puta',
    'hdp',
    'me cago en tu madre', 'me cago en dios',
    'hijoputa', 'hijosdeputa',

    // ── Contenido sexual explícito ──
    'follar', 'follando', 'follarse', // to fuck (ES)
    'polla', 'pollas',                // penis (ES)
    'verga', 'vergas',                // penis (LatAm)
    'chinga', 'chingada', 'chingado', // fuck (MX)
    'cojones',                         // balls
    'correrse', 'corrida',            // to cum / cum (ES)
    'punheta', 'pajero', 'pajearse',  // masturbation
    'sexo oral',
    'mamada', 'mamar', 'mamando',     // blowjob
    'chupada', 'chupar polla',
    'anal',
    'gozar',
    'coito',
    'fornicacion', 'fornicar',
    'eyaculacion',
    'nude', 'nudes',
    'pelada', 'en cueros',
    'pedo', 'pedofilo', 'pedofilia',
    'zoofilia', 'necrofilia',
    'pornografia infantil',
    'milf', 'gilf',
    'fansly',

    // ── Términos femeninos vulgares ──
    'coño de tu madre',               // phrase — la palabra sola es context-sensitive
    'zorra', 'zorras',                // slut (ES)
    'guarra', 'guarras',              // slut/dirty (ES)
    'furcia',                          // prostitute (ES)
    'puta madre',                      // phrase ofensiva

    // ── Violencia ──
    'te voy a matar', 'voy a matarte',
    'mátate', 'suicídate',
    'mata-te',

    // ── Racismo ──
    'mono', 'mona',                   // slur racial (aunque también = mono animal)
    'negro de mierda', 'negra de mierda',
    'sudaca',                          // slur contra latinoamericanos

    // ── Acoso sexual directo ──
    'manda nudes', 'manda fotos',
    'quieres follar', 'vamos a follar',
    'te voy a hacer',

    // ── Sitios pornográficos ──
    'pornhub', 'xvideos', 'xnxx', 'redtube', 'youporn',
    'xhamster', 'brazzers', 'onlyfans', 'chaturbate', 'livejasmin',
    'cam girl',
  ],

  CONTEXT_SENSITIVE: [
    // ── Exclamaciones comunes que pueden ser insultos dirigidos ──
    'joder',           // ¡joder! (exclamación) vs "¡joder tío!" dirigido
    'mierda',          // ¡mierda! vs "eres una mierda"
    'hostia',          // ¡hostia! (ES exclamación) vs "hostia que te doy"
    'cono',            // ¡coño! (exclamación) vs "eres un coño" — normalized: acent stripped
    'puta',            // "puta vida" / "¡puta!" vs "eres una puta"
    'coger',           // "coger el autobús" (ES) vs sexual en LatAm
    'cabron',          // entre amigos en ES vs insulto dirigido
    'cabrona',

    // ── Insultos contextuales ──
    'idiota',
    'estupido', 'estupida',
    'inutil',
    'imbecil',
    'burro', 'burra',
    'tonto', 'tonta',
    'bobo', 'boba',
    'nojento', 'nojenta',
    'ridiculo', 'ridicula',
    'covarde',
    'fracasado', 'fracasada',
    'perdedor', 'perdedora',
    'paleto', 'paleta',
    'maleducado', 'maleducada',
    'cerdo', 'cerda',
    'basura',
    'pringado', 'pringada',
    'capullo',

    // ── Términos ambiguos ──
    'pico',
    'concha',
    'bicho',
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
    // Patterns run against NORMALIZED text (accents stripped, repeated chars collapsed)
    /\btu\b/i,                         // "tú" → "tu" after accent strip
    /\busted\b/i,
    /\beres\s+un[a]?\b/i,
    /\bvete\b/i,
    /\bcalate\b/i,                     // "cállate"/"callate" → "calate" (accent + double-l collapsed)
    /\bvete\s+a\b/i,
    /\bnadie\s+te\b/i,
    /\bmetete\b/i,                     // "métete" → "metete" after accent strip
    /\bciera\s+(la\s+)?boca\b/i,       // "cierra" → "ciera" after double-r collapse
    /\bsu\b/i,
    /\bte\s+voy\b/i,
  ],

  SELF_EXPRESSION_PATTERNS: [
    /\bme\s+siento\b/i,               // "me siento un inútil"
    /\byo\s+soy\b/i,
    /\bsoy\s+un[a]?\b/i,
    /\bme\s+considero\b/i,
    /\bparezco\b/i,
    /\bme\s+veo\b/i,
    /\byo\s+me\s+siento\b/i,
    // Exclamaciones aisladas (no dirigidas)
    /\b[¡!]joder[!¡.,\s]/i,
    /\b[¡!]mierda[!¡.,\s]/i,
    /\b[¡!]hostia[!¡.,\s]/i,
    /\bqué\s+mierda\b/i,
    /\bvaya\s+mierda\b/i,
    /\bjoder\s+tío\b/i,
  ],
};
