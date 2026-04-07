// ─── ToxiBR ──────────────────────────────────────────────────────────────────
// Biblioteca de moderação de conteúdo multilíngue.

export { filterContent, createFilter, normalize } from './filter';
export type { FilterResult, FilterReason, ToxiBROptions, SupportedLocale, LocaleData } from './types';

// ─── Locale data (tree-shakeable) ────────────────────────────────────────────
export { ptBRLocale, ptPTLocale, esLocale, mergeLocaleData } from './locales/index';

// ─── PT-BR wordlists (backward compatibility) ────────────────────────────────
export {
  HARD_BLOCKED,
  CONTEXT_SENSITIVE,
  DIRECTED_PATTERNS,
  SELF_EXPRESSION_PATTERNS,
  ABBREVIATION_MAP,
  OFFENSIVE_EMOJIS,
  OFFENSIVE_EMOJI_SEQUENCES,
  CONTEXT_SENSITIVE_EMOJIS,
} from './wordlists';
