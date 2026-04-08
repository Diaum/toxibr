export type FilterReason =
  | 'hard_block'
  | 'stem_match'
  | 'directed_insult'
  | 'fuzzy_match'
  | 'suspicious_content'
  | 'link'
  | 'phone'
  | 'digits_only'
  | 'offensive_emoji';

export type Severity = 'block' | 'warn' | 'flag';

export type FilterResult =
  | { allowed: true }
  | { allowed: false; reason: FilterReason; matched: string; severity: Severity };

export interface CensorResult {
  /** The censored text with blocked words replaced */
  censored: string;
  /** Whether any word was censored */
  hasToxicContent: boolean;
  /** List of words that were censored */
  matches: Array<{ word: string; reason: FilterReason; matched: string }>;
}

/** Severity configuration per FilterReason. Default: all 'block'. */
export type SeverityConfig = Partial<Record<FilterReason, Severity>>;

/** Blocked result passed to the onBlock callback. */
export type BlockedResult = {
  allowed: false;
  reason: FilterReason;
  matched: string;
  severity: Severity;
};

/** Accumulated filtering statistics. */
export interface FilterStats {
  total: number;
  allowed: number;
  blocked: number;
  byReason: Partial<Record<FilterReason, number>>;
  topMatched: Array<{ word: string; count: number }>;
  avgTimeMs: number;
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
  /** Severity level per filter reason. Default: all 'block'. */
  severity?: SeverityConfig;
  /** Callback invoked every time a message is blocked. */
  onBlock?: (result: BlockedResult) => void;
  /** Enable stats tracking. Default: false */
  trackStats?: boolean;
}
