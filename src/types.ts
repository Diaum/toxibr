export type FilterReason =
  | 'hard_block'
  | 'directed_insult'
  | 'fuzzy_match'
  | 'suspicious_content'
  | 'link'
  | 'phone'
  | 'digits_only'
  | 'offensive_emoji';

export type FilterResult =
  | { allowed: true }
  | { allowed: false; reason: FilterReason; matched: string };

export interface CensorResult {
  /** The censored text with blocked words replaced */
  censored: string;
  /** Whether any word was censored */
  hasToxicContent: boolean;
  /** List of words that were censored */
  matches: Array<{ word: string; reason: FilterReason; matched: string }>;
}

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
  /** Block offensive emojis and emoji sequences. Default: true */
  blockEmojis?: boolean;
  /** Character used for censoring. Default: '*' */
  censorChar?: string;
  /** Censor phone numbers instead of blocking. Default: false */
  censorPhones?: boolean;
  /** Censor links instead of blocking. Default: false */
  censorLinks?: boolean;
}
