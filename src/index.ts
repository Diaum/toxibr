// ─── ToxiBR ──────────────────────────────────────────────────────────────────
// Biblioteca de moderação de conteúdo para português brasileiro.

export {
  filterContent,
  createFilter,
  filterBatch,
  createFilterBatch,
  censorContent,
  createCensor,
  normalize,
  stem,
} from './filter';
export type { ToxiBRFilter } from './filter';
export type {
  FilterResult,
  FilterReason,
  FilterStats,
  BlockedResult,
  CensorResult,
  ToxiBROptions,
  Severity,
  SeverityConfig,
} from './types';
export {
  HARD_BLOCKED,
  CONTEXT_SENSITIVE,
  DIRECTED_PATTERNS,
  SELF_EXPRESSION_PATTERNS,
  ABBREVIATION_MAP,
  SEXUAL_SEED_WORDS,
  OFFENSIVE_EMOJIS,
  OFFENSIVE_EMOJI_SEQUENCES,
  CONTEXT_SENSITIVE_EMOJIS,
} from './wordlists';
