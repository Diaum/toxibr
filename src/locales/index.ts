// ─── Locale System ────────────────────────────────────────────────────────────
// Each locale is a self-contained module — import only what you need.

export interface LocaleData {
  HARD_BLOCKED: string[];
  CONTEXT_SENSITIVE: string[];
  ABBREVIATION_MAP: Record<string, string>;
  DIRECTED_PATTERNS: RegExp[];
  SELF_EXPRESSION_PATTERNS: RegExp[];
  OFFENSIVE_EMOJIS: string[];
  OFFENSIVE_EMOJI_SEQUENCES: string[];
  CONTEXT_SENSITIVE_EMOJIS: string[];
}

export type SupportedLocale = 'pt-BR' | 'pt-PT' | 'es';

import { ptBRLocale } from './pt-BR';
import { ptPTLocale } from './pt-PT';
import { esLocale } from './es';

export { ptBRLocale, ptPTLocale, esLocale };

export const LOCALE_REGISTRY: Record<SupportedLocale, LocaleData> = {
  'pt-BR': ptBRLocale,
  'pt-PT': ptPTLocale,
  'es': esLocale,
};

/** Merge multiple locale datasets into one, deduplicating arrays. */
export function mergeLocaleData(dataList: LocaleData[]): LocaleData {
  return {
    HARD_BLOCKED: [...new Set(dataList.flatMap(l => l.HARD_BLOCKED))],
    CONTEXT_SENSITIVE: [...new Set(dataList.flatMap(l => l.CONTEXT_SENSITIVE))],
    ABBREVIATION_MAP: Object.assign({}, ...dataList.map(l => l.ABBREVIATION_MAP)),
    DIRECTED_PATTERNS: dataList.flatMap(l => l.DIRECTED_PATTERNS),
    SELF_EXPRESSION_PATTERNS: dataList.flatMap(l => l.SELF_EXPRESSION_PATTERNS),
    OFFENSIVE_EMOJIS: [...new Set(dataList.flatMap(l => l.OFFENSIVE_EMOJIS))],
    OFFENSIVE_EMOJI_SEQUENCES: [...new Set(dataList.flatMap(l => l.OFFENSIVE_EMOJI_SEQUENCES))],
    CONTEXT_SENSITIVE_EMOJIS: [...new Set(dataList.flatMap(l => l.CONTEXT_SENSITIVE_EMOJIS))],
  };
}
