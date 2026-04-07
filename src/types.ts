export type FilterReason = 'hard_block' | 'directed_insult' | 'fuzzy_match' | 'link' | 'phone' | 'digits_only' | 'offensive_emoji';

export type FilterResult =
  | { allowed: true }
  | { allowed: false; reason: FilterReason; matched: string };

export type { SupportedLocale, LocaleData } from './locales/index';

export interface ToxiBROptions {
  /**
   * Locale(s) to use. Accepts a single locale string or an array for multi-locale.
   * Default: 'pt-BR'.
   * @example createFilter({ locale: 'pt-PT' })
   * @example createFilter({ locale: ['pt-BR', 'pt-PT'] })
   */
  locale?: import('./locales/index').SupportedLocale | import('./locales/index').SupportedLocale[];
  /**
   * Pass locale data objects directly for tree-shakeable bundles.
   * When provided, `locale` is ignored.
   * @example
   *   import { ptBRLocale } from 'toxibr'
   *   createFilter({ locales: [ptBRLocale] })
   */
  locales?: import('./locales/index').LocaleData[];
  /** Additional words to hard-block (merged with built-in list). */
  extraBlockedWords?: string[];
  /** Additional context-sensitive words (merged with built-in list). */
  extraContextWords?: string[];
  /** Block links/URLs. Default: true */
  blockLinks?: boolean;
  /** Block phone numbers (Brazilian format). Default: true */
  blockPhones?: boolean;
  /** Block messages that are only digits. Default: true */
  blockDigitsOnly?: boolean;
  /** Block offensive emojis and emoji sequences. Default: true */
  blockEmojis?: boolean;
}
