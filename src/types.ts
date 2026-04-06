export type FilterReason = 'hard_block' | 'directed_insult' | 'fuzzy_match' | 'link' | 'phone' | 'digits_only';

export type FilterResult =
  | { allowed: true }
  | { allowed: false; reason: FilterReason; matched: string };

export interface ToxiBROptions {
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
}
